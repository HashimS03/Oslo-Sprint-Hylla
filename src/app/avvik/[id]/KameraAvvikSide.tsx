import Link from "next/link";
import { vare } from "@/lib/lager";
import { klokke, kortDato } from "@/lib/format";
import { avvikTittel } from "@/lib/matcher-tekst";
import { UTFALL_TEKST, valgFor } from "@/lib/kameraavvik";
import type { MatcherAvvik, State } from "@/lib/types";
import { Innhold, Panel, Topp } from "@/components/dash";
import { KameraAvvikValg } from "./KameraAvvikValg";

/** Ett avvik fra kameraet: hva som skjedde, og valgene for å avklare det. Samme valg som i appen. */
export function KameraAvvikSide({ s, a }: { s: State; a: MatcherAvvik }) {
  const v = a.sku ? vare(s, a.sku) : undefined;
  const apen = a.status === "apen";
  const historikk = s.hendelser
    .filter((h) => h.sku === a.sku && h.hylle === a.sone && Math.abs(Date.parse(h.tid) - Date.parse(a.tid)) < 2 * 36e5)
    .sort((x, y) => y.tid.localeCompare(x.tid))
    .slice(0, 6);
  return (
    <>
      <Topp tittel={`${avvikTittel(a.type)}${v ? `: ${v.navn}` : ""}`} under={`${a.sone} · ${kortDato(a.tid)} ${klokke(a.tid)}`} tilbake={{ href: "/avvik", navn: "Avvik" }} />
      <Innhold>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel tittel="Hva kameraet så">
            <div className="flex flex-col gap-3 p-4">
              {a.bilde && <img src={a.bilde} alt={`Kamerabilde fra ${a.sone}`} className="max-h-72 w-full rounded-xl object-cover" />}
              <p className="text-[15px]">{a.tekst}</p>
              {v && <Link href={`/varer/${encodeURIComponent(v.sku)}`} className="text-[13px] underline underline-offset-2">Gå til {v.navn}</Link>}
              <span className="text-[13px] text-dempet">{apen ? (a.tattAv ? `${a.tattAv} sjekker nå i appen.` : "Ligger som oppgave i appen.") : `Avklart${a.utfall ? ` som «${UTFALL_TEKST[a.utfall].toLowerCase()}»` : ""}${a.loestAv ? ` av ${a.loestAv}` : ""}${a.loestTid ? ` ${klokke(a.loestTid)}` : ""}.`}</span>
              {historikk.length > 0 && (
                <ul className="mt-1 divide-y divide-linje rounded-xl border border-kant">
                  {historikk.map((h) => (
                    <li key={h.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                      <span className="font-mono text-[12px] text-dempet">{klokke(h.tid)}</span>
                      <span className="flex-1">{h.aarsak}</span>
                      <span className="font-mono">{h.endring > 0 ? `+${h.endring}` : h.endring}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
          <Panel tittel={apen ? "Avklar avviket" : "Avklart"}>
            <div className="p-4">
              {apen ? <KameraAvvikValg id={a.id} valg={valgFor(a)} /> : <p className="text-[14px] text-dempet">Avviket er lukket og ligger i loggen.</p>}
            </div>
          </Panel>
        </div>
      </Innhold>
    </>
  );
}
