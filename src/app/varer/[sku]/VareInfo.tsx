"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vare } from "@/lib/types";
import { Panel } from "@/components/dash";
import { SkannStrekkode } from "./SkannStrekkode";

type Felt = { k: keyof Skjema; navn: string; hint?: string; mono?: boolean };
type Skjema = { navn: string; farge: string; storrelse: string; leverandor: string; beskrivelse: string; strekkode: string; prompt: string };

const FELT: Felt[] = [
  { k: "navn", navn: "Navn" },
  { k: "farge", navn: "Farge" },
  { k: "storrelse", navn: "Størrelse" },
  { k: "leverandor", navn: "Leverandør" },
  { k: "beskrivelse", navn: "Beskrivelse" },
  { k: "strekkode", navn: "Strekkode (EAN)", hint: "Tallene under strekene på pakken. Skannerappen kobler den også selv første gang varen skannes.", mono: true },
  { k: "prompt", navn: "Kameraet leter etter (engelsk)", hint: "Kort beskrivelse på engelsk, for eksempel «red instant noodle packet»." },
];

const fraVare = (v: Vare): Skjema => ({
  navn: v.navn, farge: v.farge, storrelse: v.storrelse, leverandor: v.leverandor ?? "",
  beskrivelse: v.beskrivelse ?? "", strekkode: v.strekkode ?? "", prompt: v.prompt ?? "",
});

/** Vareinformasjon med en Rediger-knapp. I redigering kan alt unntatt SKU endres. */
export function VareInfo({ vare, forslag, topp }: { vare: Vare; forslag: string; topp: React.ReactNode }) {
  const router = useRouter();
  const [redigerer, setRedigerer] = useState(false);
  const [skjema, setSkjema] = useState<Skjema>(() => fraVare(vare));
  const [lagrer, setLagrer] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  const lagre = async () => {
    setLagrer(true);
    setFeil(null);
    const r = await fetch(`/api/varer/${encodeURIComponent(vare.sku)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(skjema),
    }).catch(() => null);
    setLagrer(false);
    if (r?.ok) {
      setRedigerer(false);
      router.refresh();
    } else {
      setFeil((await r?.json().catch(() => null))?.feil ?? "Fikk ikke lagret");
    }
  };

  const verdi = (f: Felt) => (f.k === "prompt" ? vare.prompt || `${forslag} (automatisk)` : fraVare(vare)[f.k]);

  const knapper = redigerer ? (
    <div className="flex items-center gap-2">
      <button onClick={() => { setSkjema(fraVare(vare)); setRedigerer(false); setFeil(null); }} className="h-8 rounded-lg border border-kant px-3 text-[13px] font-semibold">Avbryt</button>
      <button onClick={lagre} disabled={lagrer} className="h-8 rounded-lg bg-gul px-3 text-[13px] font-semibold text-[#1B2226] disabled:opacity-50">{lagrer ? "Lagrer …" : "Lagre"}</button>
    </div>
  ) : (
    <button onClick={() => { setSkjema(fraVare(vare)); setRedigerer(true); }} className="text-[13px] underline underline-offset-2">Rediger</button>
  );

  return (
    <Panel tittel="Vareinformasjon" handling={knapper}>
      {redigerer ? (
        <div className="flex flex-col gap-3 p-4">
          {feil && <span className="text-[13px] font-semibold text-rod">{feil}</span>}
          {FELT.map((f) => (
            <label key={f.k} className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold">{f.navn}</span>
              <input
                value={skjema[f.k]}
                onChange={(e) => setSkjema({ ...skjema, [f.k]: e.target.value })}
                placeholder={f.k === "prompt" ? forslag : ""}
                inputMode={f.k === "strekkode" ? "numeric" : undefined}
                className={`h-10 rounded-xl border border-kant bg-kort px-3 text-[14px] ${f.mono ? "font-mono" : ""}`}
              />
              {f.hint && <span className="text-[12px] text-dempet">{f.hint}</span>}
            </label>
          ))}
        </div>
      ) : (
        <>
          {topp}
          {FELT.filter((f) => f.k !== "navn" && f.k !== "beskrivelse").map((f) => (
            <div key={f.k} className="flex justify-between gap-4 border-t border-kant px-4 py-2.5 text-[13.5px] first-of-type:border-0">
              <span className="text-dempet">{f.navn}</span>
              <span className={`text-right ${verdi(f) ? "font-semibold" : "text-dempet"} ${f.mono ? "font-mono" : ""}`}>{verdi(f) || "Ikke oppgitt"}</span>
            </div>
          ))}
          <SkannStrekkode sku={vare.sku} />
        </>
      )}
    </Panel>
  );
}
