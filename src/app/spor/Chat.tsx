"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Kort } from "@/lib/types";
import { KortVisning } from "@/components/KortVisning";
import { Ikon } from "@/components/ui";

export type Melding = { id: number; rolle: "bruker" | "hylla"; tekst: string; kort?: Kort[] };
export type Sender = (tekst: string) => void;

// ElevenLabs lastes bare når stemmeagenten er satt opp.
const ElevenLabsStemme = dynamic(() => import("./ElevenLabsStemme").then((m) => m.ElevenLabsStemme), { ssr: false });

const FORSLAG = ["Hvor mange av den svarte t-skjorten vi bestilte forrige uke har vi igjen?", "Hva er mulig svinn i dag?", "Når kom PO-2291?"];

let nesteId = 1;

export function Chat({ stemme }: { stemme: boolean }) {
  const [meldinger, setMeldinger] = useState<Melding[]>([]);
  const [tenker, setTenker] = useState(false);
  const bunn = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bunn.current?.scrollIntoView({ behavior: "smooth" });
  }, [meldinger, tenker]);

  const leggTil = useCallback((m: Omit<Melding, "id">) => setMeldinger((ms) => [...ms, { ...m, id: nesteId++ }]), []);
  const leggTilKort = useCallback(
    (k: Kort) =>
      setMeldinger((ms) => {
        const siste = ms.findLast((m) => m.rolle === "hylla");
        if (!siste) return [...ms, { id: nesteId++, rolle: "hylla", tekst: "", kort: [k] }];
        return ms.map((m) => (m === siste ? { ...m, kort: [...(m.kort ?? []), k] } : m));
      }),
    [],
  );

  /** Tekstsvar via Claude (/api/spor). Brukes når ElevenLabs ikke er i gang. */
  const sporTekst = useCallback(
    async (tekst: string, lesHoyt: boolean) => {
      const historikk = [...meldinger, { rolle: "bruker" as const, tekst }].filter((m) => m.tekst).map((m) => ({ rolle: m.rolle, tekst: m.tekst }));
      leggTil({ rolle: "bruker", tekst });
      setTenker(true);
      try {
        const res = await fetch("/api/spor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ historikk }) });
        const data = await res.json();
        const svar = data.svar ?? data.feil ?? "Noe gikk galt.";
        leggTil({ rolle: "hylla", tekst: svar, kort: data.kort });
        if (lesHoyt) les(svar);
      } finally {
        setTenker(false);
      }
    },
    [meldinger, leggTil],
  );

  const innhold = (sender: Sender | null, knapp: React.ReactNode) => (
    <>
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <h1 className="display text-[26px]">Spør Hylla</h1>
        <span className="rounded-full bg-graa px-2.5 py-1 font-mono text-[11px] text-dempet">norsk · {stemme ? "ElevenLabs" : "stemme"}</span>
      </header>
      <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-2">
        {meldinger.length === 0 && (
          <div className="flex flex-col gap-3 pt-4">
            <p className="text-[15px] text-dempet">Spør om beholdning, innkjøp, plukk eller svinn. Hylla svarer høyt og viser tallene her.</p>
          </div>
        )}
        {meldinger.map((m) => (
          <div key={m.id} className="flex flex-col gap-3">
            {m.tekst && (
              <div
                className={
                  m.rolle === "bruker"
                    ? "max-w-[280px] self-end rounded-[16px_16px_4px_16px] bg-tekst px-3.5 py-2.5 text-sm leading-snug text-bg"
                    : "max-w-[300px] self-start rounded-[16px_16px_16px_4px] border border-kant bg-white px-3.5 py-2.5 text-sm leading-snug"
                }
              >
                {m.tekst}
              </div>
            )}
            {m.kort?.map((k, i) => <KortVisning key={i} kort={k} />)}
          </div>
        ))}
        {tenker && <div className="self-start rounded-2xl border border-kant bg-white px-3.5 py-2.5 text-sm text-dempet">Slår opp …</div>}
        <div className="flex flex-wrap gap-1.5">
          {FORSLAG.map((f) => (
            <button key={f} onClick={() => (sender ?? ((t: string) => sporTekst(t, false)))(f)} className="rounded-full border border-kant bg-white px-2.5 py-1.5 text-left text-xs">
              {f}
            </button>
          ))}
        </div>
        <div ref={bunn} />
      </main>
      <TekstFelt onSend={(t) => (sender ?? ((x: string) => sporTekst(x, false)))(t)} />
      {knapp}
    </>
  );

  if (stemme) {
    return (
      <ElevenLabsStemme leggTil={leggTil} leggTilKort={leggTilKort} render={innhold} />
    );
  }
  return innhold(null, <NettleserStemme onTekst={(t) => sporTekst(t, true)} opptatt={tenker} />);
}

// ---------------- Nettleserens egen tale (reserve uten ElevenLabs) ----------------

type Gjenkjenner = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
};

function les(tekst: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(tekst);
  u.lang = "nb-NO";
  const stemme = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("nb") || v.lang.startsWith("no"));
  if (stemme) u.voice = stemme;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function NettleserStemme({ onTekst, opptatt }: { onTekst: (t: string) => void; opptatt: boolean }) {
  const [lytter, setLytter] = useState(false);
  const [stottes, setStottes] = useState(true);
  const [delvis, setDelvis] = useState("");
  const rec = useRef<Gjenkjenner | null>(null);
  const tekst = useRef("");
  const cb = useRef(onTekst);
  cb.current = onTekst;

  useEffect(() => {
    const W = window as unknown as { SpeechRecognition?: new () => Gjenkjenner; webkitSpeechRecognition?: new () => Gjenkjenner };
    const Klasse = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Klasse) return setStottes(false);
    const r = new Klasse();
    r.lang = "nb-NO";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      tekst.current = Array.from(e.results).map((x) => x[0].transcript).join(" ");
      setDelvis(tekst.current);
    };
    r.onend = () => {
      setLytter(false);
      const t = tekst.current.trim();
      tekst.current = "";
      setDelvis("");
      if (t) cb.current(t);
    };
    r.onerror = () => setLytter(false);
    rec.current = r;
  }, []);

  const start = () => {
    if (!rec.current || lytter) return;
    window.speechSynthesis?.cancel();
    tekst.current = "";
    try {
      rec.current.start();
      setLytter(true);
    } catch {
      /* allerede i gang */
    }
  };
  const stopp = () => lytter && rec.current?.stop();

  if (!stottes) return <div className="px-5 pb-3 text-center text-xs text-dempet">Talegjenkjenning støttes ikke i denne nettleseren. Skriv spørsmålet over.</div>;
  return (
    <MikrofonKnapp
      aktiv={lytter}
      bolge={lytter}
      tekst={lytter ? delvis || "Lytter …" : opptatt ? "Slår opp …" : "Hold inne og snakk"}
      onPointerDown={start}
      onPointerUp={stopp}
    />
  );
}

// ---------------- Felles ----------------

export function MikrofonKnapp({ aktiv, bolge, tekst, onClick, onPointerDown, onPointerUp }: {
  aktiv: boolean; bolge: boolean; tekst: string;
  onClick?: () => void; onPointerDown?: () => void; onPointerUp?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 pt-2 pb-3">
      <div className={`bolge flex h-6 items-center gap-1 ${bolge ? "" : "opacity-0"}`}>
        {[8, 16, 24, 12, 20, 10, 6].map((h, i) => (
          <span key={i} className="w-1 rounded-sm bg-gul" style={{ height: h, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <button
        type="button"
        aria-label={tekst}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex h-[76px] w-[76px] touch-none select-none items-center justify-center rounded-full border-4 border-gul transition ${aktiv ? "scale-110 bg-gul text-tekst" : "bg-tekst text-gul"}`}
      >
        <Ikon navn="mikrofon" size={30} />
      </button>
      <span className="max-w-[300px] text-center text-xs text-dempet">{tekst}</span>
    </div>
  );
}

function TekstFelt({ onSend }: { onSend: (t: string) => void }) {
  const [t, setT] = useState("");
  return (
    <form
      className="flex gap-2 px-5 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (t.trim()) onSend(t.trim());
        setT("");
      }}
    >
      <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Eller skriv spørsmålet …" className="h-11 flex-1 rounded-xl border border-kant bg-white px-3 text-sm outline-none" />
      <button type="submit" aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-xl bg-tekst text-bg">
        <Ikon navn="pil" size={18} />
      </button>
    </form>
  );
}
