import { avvikTittel } from "@/lib/matcher";
import { klokke, kortDato } from "@/lib/format";
import type { MatcherAvvik } from "@/lib/types";
import Link from "next/link";
import { UTFALL_TEKST } from "@/lib/kameraavvik";

const ROD = new Set(["feil_vare", "feil_plass"]);

/** Én rad for et avvik fra matcheren. Brukes på Kamera, Avvik og Oversikt. */
export function KameraAvvikRad({ a, knapper = true }: { a: MatcherAvvik; knapper?: boolean }) {
  const apen = a.status === "apen";
  return (
    <li id={a.id} className={`flex scroll-mt-24 flex-wrap items-center gap-3 px-4 py-3 ${apen ? "bg-rodlys" : "opacity-60"}`}>
      {a.bilde ? (
        <img src={a.bilde} alt={`Kamerabilde fra ${a.sone}`} className="h-14 w-20 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-skifer font-mono text-[10px] text-white/50">{a.sone}</span>
      )}
      <Link href={`/avvik/${a.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5 hover:opacity-80">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-[3px] font-mono text-[10.5px] tracking-[.04em] uppercase ${ROD.has(a.type) ? "bg-rod text-bg" : "bg-gullys text-gultekst"}`}>{avvikTittel(a.type)}</span>
          <span className="text-[14px] font-semibold">{a.sone}{a.sone2 ? ` → ${a.sone2}` : ""}</span>
          <span className="font-mono text-[11.5px] text-dempet">{kortDato(a.tid)} {klokke(a.tid)}</span>
          {!apen && <span className="font-mono text-[11px] text-dempet uppercase">{a.utfall ? UTFALL_TEKST[a.utfall].toLowerCase() : a.status === "loest" ? "løst" : "falsk alarm"}{a.loestAv ? ` av ${a.loestAv}` : ""}{a.loestTid ? ` ${klokke(a.loestTid)}` : ""}</span>}
        </span>
        <span className="text-[13.5px]">{a.tekst}</span>
        {apen && <span className="text-[12px] font-semibold text-gultekst">{a.tattAv ? `${a.tattAv} sjekker nå` : "Sendt som oppgave til appen"}</span>}
        {a.varsel && <span className="text-[12px] text-dempet">Varslet på skanneren</span>}
      </Link>
      {knapper && (
        <Link href={`/avvik/${a.id}`} className={`flex h-10 shrink-0 items-center rounded-[9px] px-4 text-[13px] font-bold hover:opacity-90 ${apen ? "bg-rod text-bg" : "border border-kant bg-kort"}`}>
          {apen ? "Behandle" : "Detaljer"}
        </Link>
      )}
    </li>
  );
}
