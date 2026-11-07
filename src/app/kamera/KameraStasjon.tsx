"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { tilJpeg } from "@/lib/bilde";
import { fortegn, klokke } from "@/lib/format";
import type { Forslag } from "@/lib/types";

// Kameramodus: en telefon på stativ som følger med på én hylle.
// Tar bilde med fast intervall, og når bevegelse foran hylla har stoppet.

type Props = { hylle: string; kameraId?: string; intervallMin: number; demo: boolean };
type Endring = { tid: string; tekst: string; endring: number; svinn: boolean };

const ROLIG_ETTER_MS = 4000;
const BEVEGELSE_GRENSE = 14; // gjennomsnittlig pikselforskjell (0–255) som regnes som bevegelse

function hentKameraId(fra?: string) {
  if (fra) return fra;
  try {
    let id = localStorage.getItem("hylla-kamera-id");
    if (!id) {
      id = `kam_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("hylla-kamera-id", id);
    }
    return id;
  } catch {
    return `kam_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function KameraStasjon({ hylle, kameraId: fraUrl, intervallMin, demo }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const strom = useRef<MediaStream | null>(null);
  const [modus, setModus] = useState<"oppsett" | "aktiv">("oppsett");
  const [kameraOk, setKameraOk] = useState<boolean | null>(null);
  const [lys, setLys] = useState<number | null>(null);
  const [lader, setLader] = useState<boolean | null>(null);
  const [batteri, setBatteri] = useState<number | undefined>();
  const [koblet, setKoblet] = useState(false);
  const [nesteOm, setNesteOm] = useState(intervallMin * 60);
  const [bilderIdag, setBilderIdag] = useState(0);
  const [endringer, setEndringer] = useState<Endring[]>([]);
  const [bevegelse, setBevegelse] = useState(false);
  const [teller, setTeller] = useState(false);
  const [feil, setFeil] = useState("");
  const [id] = useState(() => (typeof window === "undefined" ? "" : hentKameraId(fraUrl)));
  const forrigeRamme = useRef<Uint8ClampedArray | null>(null);
  const sistBevegelse = useRef(0);
  const venterPaaRo = useRef(false);

  // Start kameraet
  useEffect(() => {
    let avbrutt = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then(async (s) => {
        if (avbrutt) return s.getTracks().forEach((t) => t.stop());
        strom.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => undefined);
        }
        setKameraOk(true);
      })
      .catch(() => setKameraOk(false));
    return () => {
      avbrutt = true;
      strom.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Oppsett og aktiv modus har hvert sitt videoelement: koble strømmen til det som vises.
  useEffect(() => {
    if (video.current && strom.current && video.current.srcObject !== strom.current) {
      video.current.srcObject = strom.current;
      video.current.play().catch(() => undefined);
    }
  }, [modus, kameraOk]);

  // Batteri og lading, der nettleseren støtter det
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean; level: number; addEventListener: (e: string, f: () => void) => void }> };
    nav.getBattery?.().then((b) => {
      const oppdater = () => { setLader(b.charging); setBatteri(Math.round(b.level * 100)); };
      oppdater();
      b.addEventListener("chargingchange", oppdater);
      b.addEventListener("levelchange", oppdater);
    });
  }, []);

  // Meld fra til serveren at kameraet lever
  const ping = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch("/api/kamera/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kameraId: id, hylle, navn: `${hylle} · ${/iPhone/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "kamera"}`, lader: lader ?? undefined, batteri }),
      });
      if (res.ok) {
        const { kamera } = await res.json();
        setKoblet(true);
        setBilderIdag(kamera.bilderIdag);
      }
    } catch {
      setKoblet(false);
    }
  }, [id, hylle, lader, batteri]);

  useEffect(() => {
    ping();
    const t = setInterval(ping, 60_000);
    return () => clearInterval(t);
  }, [ping]);

  // Ta et bilde og send det til telling
  const taBilde = useCallback(async () => {
    if (!video.current || teller || !video.current.videoWidth) return;
    setTeller(true);
    setFeil("");
    try {
      const bilde = tilJpeg(video.current, 1568);
      const liten = tilJpeg(video.current, 720, 0.7);
      const res = await fetch("/api/kamera/bilde", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kameraId: id, hylle, bilde, liten, demo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.feil ?? "Tellingen feilet");
      setBilderIdag((n) => n + 1);
      const f = data.forslag as Forslag;
      const nye: Endring[] = f.endringer.flatMap((e) =>
        e.deler.map((d) => ({
          tid: f.tid,
          tekst: `${e.navn} · ${d.type === "mottak" ? "mottak" : d.type === "mulig_svinn" ? "mulig svinn" : d.type === "plukk" ? "plukk" : "korrigering"}`,
          endring: d.endring,
          svinn: d.type === "mulig_svinn",
        })),
      );
      if (nye.length) setEndringer((gml) => [...nye, ...gml].slice(0, 6));
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setTeller(false);
      setNesteOm(intervallMin * 60);
    }
  }, [id, hylle, demo, intervallMin, teller]);

  // Lysmåling (oppsett) og bevegelsesdeteksjon (aktiv), på et lite nedskalert bilde
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 48;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const t = setInterval(() => {
      const v = video.current;
      if (!v || !v.videoWidth) return;
      ctx.drawImage(v, 0, 0, 64, 48);
      const px = ctx.getImageData(0, 0, 64, 48).data;
      const gra = new Uint8ClampedArray(64 * 48);
      let sum = 0;
      for (let i = 0; i < gra.length; i++) {
        gra[i] = (px[i * 4] * 3 + px[i * 4 + 1] * 6 + px[i * 4 + 2]) / 10;
        sum += gra[i];
      }
      setLys(sum / gra.length);
      if (forrigeRamme.current && modus === "aktiv") {
        let diff = 0;
        for (let i = 0; i < gra.length; i++) diff += Math.abs(gra[i] - forrigeRamme.current[i]);
        const beveg = diff / gra.length > BEVEGELSE_GRENSE;
        if (beveg) {
          sistBevegelse.current = Date.now();
          venterPaaRo.current = true;
        }
        setBevegelse(Date.now() - sistBevegelse.current < ROLIG_ETTER_MS);
        if (venterPaaRo.current && Date.now() - sistBevegelse.current > ROLIG_ETTER_MS) {
          venterPaaRo.current = false;
          taBilde();
        }
      }
      forrigeRamme.current = gra;
    }, 500);
    return () => clearInterval(t);
  }, [modus, taBilde]);

  // Nedtelling til neste faste bilde
  useEffect(() => {
    if (modus !== "aktiv") return;
    const t = setInterval(() => setNesteOm((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [modus]);
  useEffect(() => {
    if (modus === "aktiv" && nesteOm === 0) taBilde();
  }, [nesteOm, modus, taBilde]);

  // Hold skjermen våken mens kameraet står på
  useEffect(() => {
    if (modus !== "aktiv") return;
    type Las = { release: () => Promise<void> };
    let las: Las | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Las> } };
    nav.wakeLock?.request("screen").then((l) => (las = l)).catch(() => undefined);
    return () => { las?.release(); };
  }, [modus]);

  const lysOk = lys !== null && lys > 45;
  const tid = new Date().toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });

  if (modus === "oppsett") {
    const Sjekk = ({ ok, tekst }: { ok: boolean | null; tekst: string }) => (
      <div className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold ${ok ? "bg-gronnlys text-gronn" : "bg-gullys text-tekst"}`}>{ok ? "✓" : "!"}</span>
        {tekst}
      </div>
    );
    return (
      <div className="flex min-h-dvh flex-col gap-4 px-5 pt-6 pb-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-dempet">HYLLEKAMERA · STEG 2 AV 3</span>
          <h1 className="display text-[30px]">Rett telefonen mot hylle {hylle}</h1>
        </div>
        <div className="flex gap-1.5">
          <span className="h-[5px] flex-1 rounded bg-gronn" />
          <span className="h-[5px] flex-1 rounded bg-gul" />
          <span className="h-[5px] flex-1 rounded bg-kant" />
        </div>
        <div className="relative h-[330px] overflow-hidden rounded-[18px] bg-skifer">
          <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          {kameraOk === false && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">Fikk ikke tilgang til kameraet. Tillat kamera for denne siden og last inn på nytt.</div>}
          <div className={`absolute inset-[22px_18px] rounded-xl border-[3px] border-dashed ${lysOk ? "border-gronn" : "border-gul"}`} />
          {lysOk && <div className="absolute bottom-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gronn px-3.5 py-[7px] text-[13px] font-semibold text-white">Hele hylla må være innenfor rammen</div>}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Sjekk ok={koblet} tekst={koblet ? "Koblet til lageret" : "Kobler til lageret …"} />
          <Sjekk ok={lysOk} tekst={lysOk ? "Lyset er godt nok" : "For mørkt, skru på lyset ved hylla"} />
          <Sjekk ok={lader ?? false} tekst={lader ? "Telefonen lader" : "Koble til lader, kameraet står på hele dagen"} />
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button className="knapp-gul" disabled={!kameraOk} onClick={() => { setModus("aktiv"); setNesteOm(intervallMin * 60); }}>Start overvåking</button>
          <span className="text-center text-xs text-dempet">Tar bilde hvert {intervallMin}. minutt, og når noen har vært ved hylla{demo ? " · demomodus" : ""}</span>
          <Link href="/kameraer" className="text-center text-xs text-dempet underline">Avbryt</Link>
        </div>
      </div>
    );
  }

  const mm = Math.floor(nesteOm / 60);
  const ss = String(nesteOm % 60).padStart(2, "0");
  return (
    <div className="flex min-h-dvh flex-col gap-3.5 bg-[#0B0E0F] px-[18px] pt-[22px] pb-[30px] text-white">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3DBE7A] shadow-[0_0_0_4px_rgba(61,190,122,.25)]" />
          Følger med på {hylle}
        </span>
        <span className="font-mono text-xs text-[#9AA3A6]">{batteri !== undefined ? `⚡ ${batteri} %` : ""}{lader ? " · lader" : ""}</span>
      </header>
      <div className="relative h-[300px] overflow-hidden rounded-[18px] bg-skifer">
        <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-[3px] font-mono text-[11px]">{teller ? "TELLER …" : `LIVE · ${tid}`}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] bg-[#1A2023] p-3">
          <div className="text-[11px] text-[#9AA3A6]">Neste bilde om</div>
          <div className="display text-[30px] text-gul" style={{ fontStretch: "100%" }}>{teller ? "nå" : `${mm}:${ss}`}</div>
        </div>
        <div className="rounded-[14px] bg-[#1A2023] p-3">
          <div className="text-[11px] text-[#9AA3A6]">Bilder i dag</div>
          <div className="display text-[30px]" style={{ fontStretch: "100%" }}>{bilderIdag}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] tracking-[.06em] text-[#9AA3A6]">SISTE ENDRINGER</span>
        <div className="overflow-hidden rounded-[14px] bg-[#1A2023] text-[13px]">
          {endringer.length === 0 && <div className="px-3 py-2.5 text-[#9AA3A6]">Ingen endringer ennå.</div>}
          {endringer.map((e, i) => (
            <div key={i} className={`flex gap-2.5 px-3 py-2.5 ${i ? "border-t border-skifer" : ""}`}>
              <span className="w-9 font-mono text-[11px] text-[#9AA3A6]">{klokke(e.tid)}</span>
              <span className="flex-1">{e.tekst}</span>
              <span className={`font-mono ${e.svinn ? "text-[#F08A7E]" : e.endring > 0 ? "text-[#3DBE7A]" : "text-[#9AA3A6]"}`}>{fortegn(e.endring)}</span>
            </div>
          ))}
        </div>
      </div>
      {bevegelse && (
        <div className="rounded-xl border border-gul/40 bg-gul/10 px-3 py-2.5 text-[13px] text-[#F4E3A6]">Noen står ved hylla. Tar bilde når det er rolig igjen.</div>
      )}
      {feil && <div className="rounded-xl bg-[#3a1c18] px-3 py-2.5 text-[13px] text-[#F08A7E]">{feil}</div>}
      <div className="mt-auto flex gap-2.5">
        <button onClick={taBilde} disabled={teller} className="h-12 flex-1 rounded-xl border border-skifer bg-[#1A2023] text-sm font-semibold">Ta bilde nå</button>
        <button onClick={() => setModus("oppsett")} className="h-12 flex-1 rounded-xl border border-skifer text-sm text-[#9AA3A6]">Pause</button>
      </div>
    </div>
  );
}
