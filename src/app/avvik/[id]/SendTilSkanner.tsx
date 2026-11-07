"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OppdragStatus } from "@/lib/types";

type Oppdrag = { id: string; status: OppdragStatus; sendt: string; oppdatert: string; melding?: string; til?: string; tattAv?: string; svar?: string; statusTekst: string };

const STEG: { id: OppdragStatus; navn: string }[] = [
  { id: "sendt", navn: "Sendt" },
  { id: "mottatt", navn: "Mottatt" },
  { id: "pagar", navn: "Sjekker" },
  { id: "ferdig", navn: "Ferdig" },
];

const tid = (iso: string) => new Date(iso).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });

export function SendTilSkanner({ avvikId, oppdrag, apen }: { avvikId: string; oppdrag?: Oppdrag; apen: boolean }) {
  const router = useRouter();
  const [melding, setMelding] = useState("");
  const [til, setTil] = useState("");
  const [venter, setVenter] = useState(false);
  const [feil, setFeil] = useState("");

  const kall = async (url: string, method: string, body: object) => {
    setVenter(true);
    setFeil("");
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) setFeil(((await r.json().catch(() => ({}))) as { feil?: string }).feil ?? "Noe gikk galt. Prøv igjen.");
    router.refresh();
    setVenter(false);
  };
  const status = (s: OppdragStatus, ekstra: object = {}) => oppdrag && kall(`/api/oppdrag/${oppdrag.id}`, "PATCH", { status: s, ...ekstra });

  const aktiv = oppdrag && ["sendt", "mottatt", "pagar"].includes(oppdrag.status);

  if (aktiv || (oppdrag && !apen)) {
    const steg = STEG.findIndex((x) => x.id === oppdrag!.status);
    return (
      <div className="flex flex-col gap-3 text-[13.5px]">
        {oppdrag!.status === "avbrutt" ? (
          <span className="text-dempet">Oppdraget ble trukket tilbake {tid(oppdrag!.oppdatert)}.</span>
        ) : (
          <ol className="grid grid-cols-4 gap-1.5">
            {STEG.map((x, i) => (
              <li key={x.id} className="flex flex-col gap-1">
                <span className={`h-1.5 rounded-full ${i <= steg ? (oppdrag!.status === "ferdig" ? "bg-gronn" : "bg-gul") : "bg-linje"}`} />
                <span className={`text-[11.5px] ${i === steg ? "font-semibold text-tekst" : "text-dempet"}`}>{x.navn}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{oppdrag!.statusTekst}</span>
          <span className="text-[12.5px] text-dempet">
            Sendt {tid(oppdrag!.sendt)} til {oppdrag!.til ?? "alle skannere"}
            {oppdrag!.tattAv ? ` · tatt av ${oppdrag!.tattAv}` : ""}
          </span>
          {oppdrag!.melding && <span className="mt-1 rounded-lg bg-graa px-3 py-2 text-[13px]">«{oppdrag!.melding}»</span>}
          {oppdrag!.svar && <span className="mt-1 rounded-lg bg-gronnlys px-3 py-2 text-[13px]">Svar: «{oppdrag!.svar}»</span>}
        </div>
        {aktiv && (
          <>
            <button disabled={venter} onClick={() => status("avbrutt")} className="self-start text-[13px] font-semibold text-rod underline underline-offset-2 disabled:opacity-50">
              Trekk tilbake
            </button>
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-kant p-3">
              <span className="etikett">Plassholder for skanneren</span>
              <span className="text-[12.5px] text-dempet">Skanner-appen er ikke koblet på ennå. Knappene gjør det skanneren skal gjøre, så flyten kan vises i demoen.</span>
              <div className="flex flex-wrap gap-2">
                {oppdrag!.status === "sendt" && (
                  <button disabled={venter} onClick={() => status("mottatt", { tattAv: "Skanner 1" })} className="h-9 rounded-lg border border-kant bg-kort px-3 text-[13px] font-semibold hover:border-tekst">Skanner mottar</button>
                )}
                {oppdrag!.status !== "pagar" && (
                  <button disabled={venter} onClick={() => status("pagar", { tattAv: oppdrag!.tattAv ?? "Skanner 1" })} className="h-9 rounded-lg border border-kant bg-kort px-3 text-[13px] font-semibold hover:border-tekst">Ansatt går for å sjekke</button>
                )}
                {oppdrag!.status === "pagar" && (
                  <button disabled={venter} onClick={() => status("pagar", { svar: "Fant ikke varene på hylla" })} className="h-9 rounded-lg border border-kant bg-kort px-3 text-[13px] font-semibold hover:border-tekst">Ansatt svarer</button>
                )}
              </div>
            </div>
          </>
        )}
        {feil && <span role="alert" className="text-[13px] text-rod">{feil}</span>}
      </div>
    );
  }

  if (!apen) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] text-dempet">Be en ansatt med skanner gå til lokasjonen og sjekke. Oppdraget dukker opp på skannerne med en gang.</span>
      <label className="flex flex-col gap-1">
        <span className="etikett">Melding (valgfritt)</span>
        <textarea value={melding} onChange={(e) => setMelding(e.target.value)} rows={2} placeholder="F.eks. sjekk bak på hylla og i returkassa" className="rounded-lg border border-kant bg-kort px-3 py-2 text-[13.5px] outline-none focus:border-tekst" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="etikett">Til (valgfritt)</span>
        <input value={til} onChange={(e) => setTil(e.target.value)} placeholder="Alle skannere" className="h-10 rounded-lg border border-kant bg-kort px-3 text-[13.5px] outline-none focus:border-tekst" />
      </label>
      <button disabled={venter} onClick={() => kall("/api/oppdrag", "POST", { avvikId, melding, til })} className="knapp-gul mt-1 !h-11 !rounded-lg !border-2">
        {venter ? "Sender …" : oppdrag ? "Send på nytt" : "Send til skanner"}
      </button>
      {feil && <span role="alert" className="text-[13px] text-rod">{feil}</span>}
    </div>
  );
}
