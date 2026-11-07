"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Forslag, ForslagEndring } from "@/lib/types";
import { dataUrlTilJpeg, filTilJpeg, tilJpeg } from "@/lib/bilde";
import { fortegn } from "@/lib/format";
import { Ikon } from "@/components/ui";
import { klargjorLyd, siHoyt } from "@/lib/tale";

type Props = {
  hylle: { id: string; navn: string };
  varer: { sku: string; navn: string; nivaa: string }[];
  forrige: { tid: string; bilde?: string } | null;
  ekteTeller: boolean;
  sporNaarUsikker: boolean;
  /** Les opp hva tellingen endret etter lagring (innstillingen «Svar høyt»). */
  svarHoyt: boolean;
};

type Steg = "kamera" | "analyserer" | "resultat" | "feil";

export function TellFlyt(p: Props) {
  const [steg, setSteg] = useState<Steg>("kamera");
  const [bilde, setBilde] = useState<string | null>(null);
  const [forslag, setForslag] = useState<Forslag | null>(null);
  const [feil, setFeil] = useState("");
  const [fremdrift, setFremdrift] = useState(0);
  const [sekunder, setSekunder] = useState(0);

  // Avbryter tellingen som pågår (Avbryt-knappen eller tidsavbrudd).
  const avbryter = useRef<AbortController | null>(null);

  const tell = useCallback(
    async (dataUrl: string | null, demo = false) => {
      avbryter.current?.abort();
      const kontroll = new AbortController();
      avbryter.current = kontroll;
      setBilde(dataUrl);
      setSteg("analyserer");
      setFremdrift(1);
      setSekunder(0);
      const start = Date.now();
      const tikk = setInterval(() => setSekunder(Math.round((Date.now() - start) / 1000)), 500);
      // Litt over serverens grense (60 s), så skjermen aldri henger.
      const tidsur = setTimeout(() => kontroll.abort("tidsavbrudd"), 70_000);
      try {
        const res = await fetch("/api/tell", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hylle: p.hylle.id, bilde: dataUrl ?? undefined, demo }),
          signal: kontroll.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.feil ?? "Tellingen feilet");
        setFremdrift(2);
        await new Promise((r) => setTimeout(r, 700));
        if (kontroll.signal.aborted) return;
        setForslag(data.forslag);
        setSteg("resultat");
      } catch (e) {
        if (kontroll.signal.aborted && kontroll.signal.reason !== "tidsavbrudd") return; // brukeren trykket Avbryt
        setFeil(kontroll.signal.aborted ? "Serveren svarte ikke på 70 sekunder. Prøv igjen" : e instanceof Error ? e.message : "Noe gikk galt");
        setSteg("feil");
      } finally {
        clearInterval(tikk);
        clearTimeout(tidsur);
      }
    },
    [p.hylle.id],
  );

  const avbryt = () => {
    avbryter.current?.abort("avbrutt");
    setSteg("kamera");
  };

  if (steg === "kamera") return <Kamera {...p} onBilde={(b) => tell(b)} onDemo={() => tell(null, true)} />;
  if (steg === "analyserer") return <Analyserer {...p} bilde={bilde} fremdrift={fremdrift} sekunder={sekunder} onAvbryt={avbryt} />;
  if (steg === "feil")
    return (
      <div className="flex min-h-dvh flex-col gap-4 px-5 pt-10">
        <span className="font-mono text-xs text-dempet">HYLLE {p.hylle.id}</span>
        <h1 className="display text-[30px]">Tellingen gikk ikke</h1>
        <p className="text-[15px] text-dempet">{feil}</p>
        <button className="knapp-gul mt-auto" onClick={() => setSteg("kamera")}>Ta nytt bilde</button>
        <button className="mb-8 h-10 text-sm text-dempet" onClick={() => tell(null, true)}>Bruk demotelling</button>
      </div>
    );
  return <Resultat {...p} forslag={forslag!} bilde={bilde} onNyttBilde={() => setSteg("kamera")} />;
}

// ---------------- Kamera ----------------

function Kamera({ hylle, forrige, ekteTeller, onBilde, onDemo }: Props & { onBilde: (b: string) => void; onDemo: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const fil = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [lys, setLys] = useState(false);
  const strom = useRef<MediaStream | null>(null);

  useEffect(() => {
    let avbrutt = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (avbrutt) return s.getTracks().forEach((t) => t.stop());
        strom.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => undefined);
          setLive(true);
        }
      } catch {
        setLive(false); // Ingen tilgang: vi bruker filvelgeren i stedet.
      }
    })();
    return () => {
      avbrutt = true;
      strom.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const blits = async () => {
    const spor = strom.current?.getVideoTracks()[0];
    if (!spor) return;
    try {
      await spor.applyConstraints({ advanced: [{ torch: !lys } as MediaTrackConstraintSet] });
      setLys(!lys);
    } catch {
      /* lommelykt støttes ikke på denne telefonen */
    }
  };

  const knips = () => {
    if (live && video.current) {
      const b = tilJpeg(video.current);
      strom.current?.getTracks().forEach((t) => t.stop());
      onBilde(b);
    } else {
      fil.current?.click();
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-mork text-white">
      <header className="flex items-center justify-between px-3 pt-4 pb-2">
        <Link href="/tell" aria-label="Lukk kamera" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Ikon navn="lukk" />
        </Link>
        <span className="rounded-full bg-gul px-2.5 py-[5px] font-mono text-xs text-tekst">Hylle {hylle.id}</span>
        <button type="button" onClick={blits} aria-label="Blits" className={`flex h-11 w-11 items-center justify-center rounded-full ${lys ? "bg-gul text-tekst" : "bg-white/10"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
        </button>
      </header>

      <div className="relative mx-4 my-2 flex-1 overflow-hidden rounded-[18px] bg-skifer">
        <video ref={video} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${live ? "" : "hidden"}`} />
        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[#C9D1CE]">
            <Ikon navn="kamera" size={40} />
            Trykk på utløseren for å åpne kameraet
          </div>
        )}
        {(["left-3 top-3 border-l-4 border-t-4 rounded-tl-lg", "right-3 top-3 border-r-4 border-t-4 rounded-tr-lg", "left-3 bottom-3 border-l-4 border-b-4 rounded-bl-lg", "right-3 bottom-3 border-r-4 border-b-4 rounded-br-lg"] as const).map((c) => (
          <div key={c} className={`absolute h-[34px] w-[34px] border-gul ${c}`} />
        ))}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3.5 py-2 text-[13px]">
          Få med hele hylla, rett forfra
        </div>
      </div>

      <footer className="flex items-center justify-between px-9 pt-4 pb-9">
        <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[10px] border-2 border-white/40 bg-[#3A4144] font-mono text-[10px] text-[#C9D1CE]">
          {forrige?.bilde ? <img src={forrige.bilde} alt="Forrige bilde" className="h-full w-full object-cover" /> : forrige?.tid ?? "–"}
        </div>
        <button type="button" onClick={knips} aria-label="Ta bilde" className="flex h-[78px] w-[78px] items-center justify-center rounded-full border-[5px] border-white">
          <span className="block h-[60px] w-[60px] rounded-full bg-white" />
        </button>
        <button type="button" onClick={() => fil.current?.click()} className="w-[52px] text-center text-[11px] leading-tight text-[#C9D1CE]">
          Velg<br />bilde
        </button>
      </footer>
      <input
        ref={fil}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onBilde(await filTilJpeg(f));
        }}
      />
      <button onClick={onDemo} className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-white/40 underline">
        {ekteTeller ? "Bruk demotelling" : "Demomodus: bruk demotelling"}
      </button>
    </div>
  );
}

// ---------------- Analyserer ----------------

function Analyserer({ hylle, forrige, bilde, fremdrift, sekunder, onAvbryt }: Props & { bilde: string | null; fremdrift: number; sekunder: number; onAvbryt: () => void }) {
  const tid = new Date().toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });
  const steg = [
    "Bildet er lastet opp",
    fremdrift >= 2 ? "Varene er telt" : "Kjenner igjen og teller varer",
    forrige ? `Sammenligner med tellingen kl. ${forrige.tid}` : "Sammenligner med lagerloggen",
  ];
  const status = (i: number) => (i < fremdrift ? "ferdig" : i === fremdrift ? "aktiv" : "venter");
  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-7 pb-8">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-dempet">HYLLE {hylle.id} · {tid}</span>
        <h1 className="display text-[32px]">Teller varene på hylla …</h1>
      </div>
      <div className="relative h-[330px] overflow-hidden rounded-[18px] bg-skifer">
        {bilde ? (
          <img src={bilde} alt="Hyllebildet" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-white/50">DEMOTELLING</div>
        )}
        <div className="skannelinje absolute inset-x-0 h-[3px] bg-gul shadow-[0_0_18px_6px_rgba(244,196,48,.55)]" />
      </div>
      <ol className="flex flex-col gap-3 text-[15px]">
        {steg.map((t, i) => {
          const st = status(i);
          return (
            <li key={i} className={`flex items-center gap-3 ${st === "aktiv" ? "font-semibold" : st === "venter" ? "text-dempet" : ""}`}>
              {st === "ferdig" ? (
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gronn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                </span>
              ) : st === "aktiv" ? (
                <span className="h-[26px] w-[26px] animate-pulse rounded-full border-[3px] border-gul bg-gullys" />
              ) : (
                <span className="h-[26px] w-[26px] rounded-full border-2 border-[#C9D1CE]" />
              )}
              {t}
            </li>
          );
        })}
      </ol>
      <span className="mt-auto text-center text-xs text-dempet">Tar vanligvis 3–8 sekunder · {sekunder} s</span>
      {sekunder >= 3 && (
        <button onClick={onAvbryt} className="flex h-12 items-center justify-center rounded-xl border border-kant bg-white text-[15px] font-semibold">
          Avbryt
        </button>
      )}
    </div>
  );
}

// ---------------- Resultat ----------------

const ETIKETT: Record<string, { tekst: string; farge: string; bg: string }> = {
  mottak: { tekst: "MOTTAK", farge: "text-gronn", bg: "bg-gronnlys" },
  plukk: { tekst: "PLUKK", farge: "text-dempet", bg: "bg-graa" },
  mulig_svinn: { tekst: "MULIG SVINN", farge: "text-rod", bg: "bg-rodlys" },
  korrigering: { tekst: "KORRIGERING", farge: "text-dempet", bg: "bg-graa" },
};

function justert(e: ForslagEndring, valgt: number | undefined): ForslagEndring {
  if (valgt === undefined || valgt === e.na) return e;
  const delta = valgt - e.na;
  const deler = e.deler.map((d) => ({ ...d }));
  const siste = deler.findLast((d) => d.type === "mulig_svinn" || d.type === "korrigering");
  if (siste) siste.endring += delta;
  else if (delta !== 0) deler.push({ type: delta < 0 ? "mulig_svinn" : "korrigering", endring: delta, aarsak: delta < 0 ? "Ingen plukkordre forklarer dette" : "Flere enn ventet" });
  return { ...e, na: valgt, deler: deler.filter((d) => d.endring !== 0) };
}

function Resultat({ hylle, forslag, bilde, sporNaarUsikker, svarHoyt, onNyttBilde }: Props & { forslag: Forslag; bilde: string | null; onNyttBilde: () => void }) {
  const router = useRouter();
  const [valg, setValg] = useState<Record<string, number>>({});
  const [lagrer, setLagrer] = useState(false);
  const [lagreFeil, setLagreFeil] = useState("");
  // «Tell igjen» vises alltid. Vanlige usikre tall bare når «Spør når usikker» er på.
  const usikre = forslag.endringer.filter((e) => e.tellIgjen || (sporNaarUsikker && e.alternativ !== null && e.sikkerhet < 0.8));
  // Usikkert svinn som ikke er bekreftet, lagres ikke. Det vises bare i den gule boksen.
  const venter = (e: ForslagEndring) => !!e.tellIgjen && valg[e.sku] === undefined;
  const antallVenter = forslag.endringer.filter(venter).length;
  const endringer = forslag.endringer.filter((e) => !venter(e)).map((e) => justert(e, valg[e.sku])).filter((e) => e.deler.length > 0);
  const tid = new Date(forslag.tid).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });
  const snittSikkerhet = forslag.endringer.length ? Math.round((forslag.endringer.reduce((s, e) => s + e.sikkerhet, 0) / forslag.endringer.length) * 100) : 100;

  const lagre = async () => {
    // Må skje i selve trykket, ellers stopper mobilnettleseren opplesningen etterpå.
    const lyd = svarHoyt ? klargjorLyd() : null;
    setLagrer(true);
    setLagreFeil("");
    try {
      const liten = bilde ? await dataUrlTilJpeg(bilde, 720) : undefined;
      const res = await fetch("/api/tell/lagre", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forslag, korrigert: valg, bilde: liten, kilde: "mobil", medLyd: svarHoyt }),
      });
      const data = (await res.json().catch(() => ({}))) as { oppsummering?: string; lyd?: string; feil?: string };
      if (!res.ok) throw new Error(data.feil ?? "Klarte ikke å lagre tellingen");
      // Hylla sier selv hva hyllebildet endret (og varsler om mulig svinn).
      if (svarHoyt && data.oppsummering) siHoyt(data.oppsummering, data.lyd, lyd);
      router.push("/logg?lagret=1");
      router.refresh();
    } catch (e) {
      setLagreFeil(e instanceof Error ? e.message : "Klarte ikke å lagre tellingen");
      setLagrer(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 px-3 pt-4 pb-1">
        <button onClick={onNyttBilde} aria-label="Ta nytt bilde" className="flex h-11 w-11 items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="flex flex-col">
          <span className="font-mono text-[11px] text-dempet">HYLLE {hylle.id} · {tid} · {forslag.sekunder.toLocaleString("nb-NO")} SEK</span>
          <h1 className="display text-[26px]">
            {endringer.length === 0
              ? antallVenter > 0 ? "Tell igjen" : "Ingen endringer"
              : `${endringer.length} ${endringer.length === 1 ? "endring" : "endringer"} funnet`}
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-2.5 px-5 pt-2 pb-3">
        {endringer.length === 0 && antallVenter === 0 && (
          <div className="kort p-4 text-[15px]">Hylla stemmer med lagerloggen. Lagre for å registrere at {hylle.id} er talt.</div>
        )}
        {endringer.map((e) => {
          const sum = e.deler.reduce((s, d) => s + d.endring, 0);
          const svinn = e.deler.some((d) => d.type === "mulig_svinn");
          return (
            <div key={e.sku} className={`flex flex-col gap-2.5 rounded-[14px] bg-white p-3.5 ${svinn ? "border-[1.5px] border-rodkant" : "border border-kant"}`}>
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 shrink-0 rounded-[10px] border border-kant" style={{ background: e.swatch }} />
                <span className="flex-1">
                  <b className="text-[15px] font-semibold">{e.navn}</b>
                  <br />
                  <span className="text-xs text-dempet">{e.nivaa[0].toUpperCase() + e.nivaa.slice(1)} · {e.forrige} → {e.na}</span>
                </span>
                <span className={`display text-[26px] ${sum > 0 ? "text-gronn" : "text-rod"}`} style={{ fontStretch: "100%" }}>{fortegn(sum)}</span>
              </div>
              {e.deler.map((d, i) => {
                const et = ETIKETT[d.type] ?? ETIKETT.korrigering;
                return (
                  <div key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-xs ${et.bg}`}>
                    <span className={`font-mono font-medium ${et.farge}`}>{et.tekst}</span>
                    <span className="flex-1">{d.aarsak}</span>
                    {e.deler.length > 1 && <span className="font-mono">{fortegn(d.endring)}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}

        {usikre.map((e) => {
          const valgene = e.alternativ !== null ? [Math.min(e.na, e.alternativ), Math.max(e.na, e.alternativ)] : [e.na];
          const navn = e.navn.charAt(0).toLowerCase() + e.navn.slice(1);
          return (
          <div key={`u-${e.sku}`} className="flex flex-col gap-2.5 rounded-[14px] bg-gullys p-3.5">
            <div className="text-sm">
              <b className="font-semibold">{e.tellIgjen ? `Tell igjen: ${navn}.` : `Usikker på ${navn}.`}</b>{" "}
              {e.tellIgjen && <>{e.tellIgjen} </>}
              {valgene.length === 2 ? `Ser du ${valgene[0]} eller ${valgene[1]}?` : `Stemmer ${valgene[0]}?`}
            </div>
            <div className="flex gap-2">
              {valgene.map((n) => {
                // Ved «tell igjen» er ingenting valgt før brukeren trykker.
                const aktiv = (valg[e.sku] ?? (e.tellIgjen ? undefined : e.na)) === n;
                return (
                  <button
                    key={n}
                    onClick={() => setValg({ ...valg, [e.sku]: n })}
                    className={`h-10 flex-1 rounded-[10px] border-[1.5px] border-tekst font-semibold ${aktiv ? "bg-tekst text-white" : "bg-white"}`}
                  >
                    {n}
                  </button>
                );
              })}
              <button onClick={onNyttBilde} className="h-10 flex-[2] text-[13px] underline">Ta nytt bilde</button>
            </div>
          </div>
          );
        })}

        <div className="flex justify-between px-1 text-xs text-dempet">
          <span>Uendret: {forslag.uendret} {forslag.uendret === 1 ? "vare" : "varer"}</span>
          <span className="font-mono">{forslag.teller} · sikkerhet {snittSikkerhet} %</span>
        </div>
        {forslag.ukjente.length > 0 && (
          <div className="kort p-3 text-xs text-dempet">Ukjente varer på bildet: {forslag.ukjente.join(", ")}</div>
        )}
      </main>

      <div className="flex flex-col gap-2 px-5 pt-2 pb-8">
        {lagreFeil && <div className="rounded-xl bg-rodlys px-3 py-2.5 text-[13px] text-rod">{lagreFeil}. Prøv igjen.</div>}
        <button className="knapp-gul" onClick={lagre} disabled={lagrer}>{lagrer ? "Lagrer …" : "Lagre i loggen"}</button>
        <Link href="/" className="flex h-10 items-center justify-center text-sm text-dempet">Forkast</Link>
      </div>
    </div>
  );
}
