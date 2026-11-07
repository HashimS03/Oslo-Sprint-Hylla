"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { filTilBilde, tilJpeg } from "@/lib/bilde";
import type { Bokse, KameraHendelse, Sone } from "@/lib/types";

type SoneInfo = { id: string; navn: string; sone: Sone; skuer: string[]; varer: string[] };
type Katalog = { sku: string; navn: string }[];
type SoneSvar = {
  sone: string; navn: string; status: string; bevegelse: number; endring: number;
  funnet?: { sku: string; navn: string; antall: number; hjemmehorende: boolean; bokser: Bokse[] }[];
  hendelser?: KameraHendelse[]; feil?: string;
};

const FARGE: Record<string, string> = { uttak: "#B93A2B", plassering: "#2E7D4F", gjenglemt: "#7B3FB0" };
const STATUS: Record<string, string> = {
  bevegelse: "Bevegelse", stille: "Venter på ro", uendret: "Uendret", teller: "Teller", pause: "Pause", talt: "Talt", feil: "Feil",
};

export function TakTest({ kameraId, soner, katalog }: { kameraId: string; soner: SoneInfo[]; katalog: Katalog }) {
  const router = useRouter();
  const [lagrer, setLagrer] = useState(false);
  async function lagreSone(id: string, skuer: string[]) {
    setLagrer(true);
    setFeil("");
    const r = await fetch(`/api/hyller/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ skuer }) });
    if (!r.ok) setFeil(((await r.json()) as { feil?: string }).feil ?? "Kunne ikke lagre");
    setLagrer(false);
    router.refresh();
  }
  const video = useRef<HTMLVideoElement>(null);
  const bildeRef = useRef<HTMLImageElement | null>(null);
  const strom = useRef<MediaStream | null>(null);
  const opptatt = useRef(false);
  const [kilde, setKilde] = useState<"ingen" | "kamera" | "bilde">("ingen");
  const [forhandsvisning, setForhandsvisning] = useState<string>("");
  const [auto, setAuto] = useState(true);
  const [svar, setSvar] = useState<SoneSvar[]>([]);
  const [hendelser, setHendelser] = useState<KameraHendelse[]>([]);
  const [feil, setFeil] = useState("");
  const [teller, setTeller] = useState(false);

  const hentHendelser = useCallback(async () => {
    const r = await fetch("/api/kamera/tak", { cache: "no-store" });
    if (r.ok) setHendelser(((await r.json()) as { hendelser: KameraHendelse[] }).hendelser.filter((h) => h.kamera === kameraId).reverse());
  }, [kameraId]);

  useEffect(() => { hentHendelser(); }, [hentHendelser]);
  useEffect(() => () => strom.current?.getTracks().forEach((t) => t.stop()), []);

  async function startKamera() {
    setFeil("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false });
      strom.current = s;
      setKilde("kamera");
      requestAnimationFrame(async () => {
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => undefined); }
      });
    } catch {
      setFeil("Fikk ikke tilgang til kamera. Last opp et bilde i stedet.");
    }
  }

  async function velgBilde(fil?: File) {
    if (!fil) return;
    strom.current?.getTracks().forEach((t) => t.stop());
    const img = await filTilBilde(fil);
    bildeRef.current = img;
    setForhandsvisning(img.src);
    setKilde("bilde");
  }

  const send = useCallback(async (tving: boolean) => {
    const el = kilde === "kamera" ? video.current : bildeRef.current;
    if (!el || opptatt.current) return;
    opptatt.current = true;
    setTeller(true);
    setFeil("");
    try {
      const bilde = tilJpeg(el, 1568, 0.85);
      const liten = tilJpeg(el, 320, 0.6);
      const r = await fetch("/api/kamera/tak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kameraId, bilde, liten, tving }),
      });
      const j = (await r.json()) as { soner?: SoneSvar[]; feil?: string };
      if (!r.ok) throw new Error(j.feil ?? "Feil fra serveren");
      setSvar(j.soner ?? []);
      await hentHendelser();
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      opptatt.current = false;
      setTeller(false);
    }
  }, [kilde, kameraId, hentHendelser]);

  // Automatisk modus: send et bilde hvert 2. sekund, serveren avgjør per sone om det er verdt å telle.
  useEffect(() => {
    if (!auto || kilde !== "kamera") return;
    const t = setInterval(() => send(false), 2000);
    return () => clearInterval(t);
  }, [auto, kilde, send]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Takkamera · {kameraId}</h1>
      <p style={{ margin: "0 0 16px", color: "#555" }}>Sonene er tegnet over bildet. Hver sone telles for seg, og endringer blir til hendelser for matcheren.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={startKamera}>Start kamera</button>
        <label style={{ border: "1px solid #888", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>
          Last opp bilde
          <input type="file" accept="image/*" hidden onChange={(e) => velgBilde(e.target.files?.[0])} />
        </label>
        <button onClick={() => send(true)} disabled={kilde === "ingen" || teller}>{teller ? "Teller …" : "Tell nå"}</button>
        <label><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Automatisk (kamera)</label>
      </div>
      {feil && <p style={{ color: "#B93A2B" }}>{feil}</p>}

      <div style={{ position: "relative", background: "#1B2326", aspectRatio: "16 / 9", overflow: "hidden", borderRadius: 8 }}>
        {kilde === "kamera" && <video ref={video} playsInline muted style={{ width: "100%", height: "100%", objectFit: "fill" }} />}
        {kilde === "bilde" && <img src={forhandsvisning} alt="" style={{ width: "100%", height: "100%", objectFit: "fill" }} />}
        {kilde === "ingen" && <div style={{ color: "#aaa", padding: 24 }}>Start kameraet eller last opp et bilde.</div>}
        {/* Deteksjoner, som i YOLO: en boks per funn med navn og sikkerhet. Rødt = vare som ikke hører hjemme i sonen. */}
        {svar.flatMap((s) => (s.funnet ?? []).flatMap((f) => f.bokser.map((b, i) => (
          <div key={`${s.sone}-${f.sku}-${i}`} style={{
            position: "absolute", left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.b * 100}%`, height: `${b.h * 100}%`,
            border: `2px solid ${f.hjemmehorende ? "#3DDC84" : "#FF5A4F"}`, boxSizing: "border-box", pointerEvents: "none",
          }}>
            <span style={{ position: "absolute", top: -18, left: -2, background: f.hjemmehorende ? "#3DDC84" : "#FF5A4F", color: "#000", fontSize: 11, padding: "0 4px", whiteSpace: "nowrap" }}>
              {f.navn} {Math.round(b.c * 100)} %
            </span>
          </div>
        ))))}
        {soner.map((z) => {
          const s = svar.find((x) => x.sone === z.id);
          const gang = z.sone.type === "gang";
          return (
            <div key={z.id} style={{
              position: "absolute", left: `${z.sone.x * 100}%`, top: `${z.sone.y * 100}%`, width: `${z.sone.b * 100}%`, height: `${z.sone.h * 100}%`,
              border: `3px ${gang ? "dashed" : "solid"} #F4C430`, boxSizing: "border-box", color: "#fff", textShadow: "0 1px 3px #000", padding: 6, fontSize: 14,
            }}>
              <b>{z.navn}</b>{!gang && <div style={{ opacity: 0.85 }}>{z.varer.join(", ")}</div>}
              {s && <div>{STATUS[s.status] ?? s.status}</div>}
              {s?.funnet?.filter((f) => f.antall > 0).map((f) => (
                <div key={f.sku} style={{ color: f.hjemmehorende ? "#9BE3B3" : "#FF9A8F" }}>{f.antall} × {f.navn}{f.hjemmehorende ? "" : " (feil sted)"}</div>
              ))}
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 18, margin: "20px 0 8px" }}>Innstillinger per sone</h2>
      <p style={{ margin: "0 0 8px", color: "#555" }}>Velg hvilke varer hver sone skal klassifisere. T1 kan for eksempel bare være Red Bull og T2 bare Coca-Cola. Endringen nullstiller utgangspunktet for sonen.</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {soner.filter((z) => z.sone.type !== "gang").map((z) => (
          <fieldset key={z.id} disabled={lagrer} style={{ border: "1px solid #bbb", borderRadius: 6, minWidth: 220 }}>
            <legend><b>{z.navn}</b></legend>
            {katalog.filter((v) => ["REDBULL", "COLA-BOKS", "BRUS-RED", "VANN-KLAR"].includes(v.sku) || z.skuer.includes(v.sku)).map((v) => (
              <label key={v.sku} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={z.skuer.includes(v.sku)}
                  onChange={(e) => lagreSone(z.id, e.target.checked ? [...z.skuer, v.sku] : z.skuer.filter((x) => x !== v.sku))}
                /> {v.navn}
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <h2 style={{ fontSize: 18, margin: "20px 0 8px" }}>Kamerahendelser</h2>
      {hendelser.length === 0 && <p style={{ color: "#777" }}>Ingen ennå. Det første bildet setter bare utgangspunktet.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {hendelser.slice(0, 30).map((h) => (
          <li key={h.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #ddd" }}>
            <span style={{ background: FARGE[h.type], color: "#fff", borderRadius: 4, padding: "1px 8px", fontSize: 13 }}>{h.type}</span>
            <span>{new Date(h.tid).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" })}</span>
            <span>{h.sone}</span>
            <span>{h.antall} × {h.sku ?? "ukjent"}</span>
            {h.hjemmehorende === false && <span style={{ color: "#B93A2B" }}>mulig feilplassert</span>}
            <span style={{ color: "#777" }}>{Math.round(h.sikkerhet * 100)} %</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
