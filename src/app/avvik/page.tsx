import Link from "next/link";
import { hentState } from "@/lib/store";
import { klokke, kortDato } from "@/lib/format";
import { avvikListe } from "@/lib/rapport";
import { AvvikChip, Filter, Innhold, Kpi, Panel, Tabell, TomRad, Topp } from "@/components/dash";

export const dynamic = "force-dynamic";

const VALG = [
  { id: "apne", navn: "Åpne" },
  { id: "lukket", navn: "Lukket" },
  { id: "alle", navn: "Alle" },
];

export default async function AvvikListe({ searchParams }: { searchParams: Promise<{ vis?: string }> }) {
  const { vis = "apne" } = await searchParams;
  const filter = (["apne", "lukket", "alle"].includes(vis) ? vis : "apne") as "apne" | "lukket" | "alle";
  const s = await hentState();
  const rader = avvikListe(s, filter);
  const alle = avvikListe(s, "alle");
  const apne = alle.filter((a) => a.status === "apen");
  const tell = (st: string) => alle.filter((a) => a.status === st).reduce((n, a) => n + a.antall, 0);

  return (
    <>
      <Topp tittel="Avvik" under="Når det som er observert ikke stemmer med det lagerloggen forventer. Et avvik blir først svinn når noen har kontrollert det.">
        <Filter valg={VALG} valgt={filter} lag={(id) => `/avvik?vis=${id}`} merke={{ apne: apne.length }} />
      </Topp>
      <Innhold>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi etikett="Åpne" verdi={apne.length} under={`${tell("apen")} stk uavklart`} tone={apne.length ? "rod" : undefined} />
          <Kpi etikett="Funnet igjen" verdi={tell("funnet")} under="stk satt tilbake" tone="gronn" />
          <Kpi etikett="Bekreftet svinn" verdi={tell("svinn")} under="stk trukket fra" />
          <Kpi etikett="Var salg" verdi={tell("lukket")} under="stk ført som salg" />
        </div>
        <Panel tittel={VALG.find((v) => v.id === filter)!.navn + " avvik"}>
          <Tabell hode={["Oppdaget", "Lokasjon", "Vare", "Antall", "Status", "Lukket", ""]} hoyre={[3]}>
            {rader.map((a) => (
              <tr key={a.id} className={a.status === "apen" ? "bg-rodlys/40" : ""}>
                <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{kortDato(a.tid)} {klokke(a.tid)}</td>
                <td className="font-semibold">{a.hylle}</td>
                <td><Link href={`/varer/${encodeURIComponent(a.sku)}`} className="hover:underline">{a.navn}</Link></td>
                <td className="text-right font-mono font-semibold">{a.antall} stk</td>
                <td><AvvikChip status={a.status} /></td>
                <td className="font-mono text-[12px] text-dempet">{a.lukketTid ? `${kortDato(a.lukketTid)} ${klokke(a.lukketTid)}` : "–"}</td>
                <td className="text-right"><Link href={`/avvik/${a.id}`} className="text-[13px] font-semibold underline underline-offset-2">{a.status === "apen" ? "Behandle" : "Detaljer"}</Link></td>
              </tr>
            ))}
            {rader.length === 0 && <TomRad kolonner={7}>{filter === "apne" ? "Ingen åpne avvik akkurat nå." : "Ingen avvik her ennå."}</TomRad>}
          </Tabell>
        </Panel>
      </Innhold>
    </>
  );
}
