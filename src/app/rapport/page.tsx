import Link from "next/link";
import { hentState } from "@/lib/store";
import { PERIODER, lesPeriode, rapport } from "@/lib/rapport";
import { fortegn } from "@/lib/format";
import { Innhold, Kpi, Panel, PeriodeVelger, Prikk, Tabell, TomRad, Topp } from "@/components/dash";

export const dynamic = "force-dynamic";

const prosent = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
const dagNavn = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo", weekday: "short", day: "numeric", month: "short" });

export default async function Rapport({ searchParams }: { searchParams: Promise<{ dager?: string }> }) {
  const dager = lesPeriode((await searchParams).dager, 7);
  const s = await hentState();
  const r = rapport(s, dager);
  const t = r.totalt;
  const periode = PERIODER.find((p) => p.dager === dager)!.navn.toLowerCase();
  const varer = [...r.varer].sort((a, b) => b.svinn + b.muligSvinn - (a.svinn + a.muligSvinn) || b.solgt - a.solgt);
  const csv = (hva: string) => `/api/rapport?format=csv&hva=${hva}&dager=${dager}`;

  return (
    <>
      <Topp tittel="Rapport" under={dager ? `Bevegelser og svinn, ${periode === "i dag" ? "i dag" : `siste ${periode}`}.` : "Bevegelser og svinn for hele historikken."}>
        <PeriodeVelger valgt={dager} lag={(d) => `/rapport?dager=${d}`} />
        <a href={csv("varer")} className="rounded-lg border border-kant bg-white px-3.5 py-2 text-[13.5px] font-semibold hover:border-tekst">Last ned CSV</a>
      </Topp>
      <Innhold>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Kpi etikett="Mottatt" verdi={`+${t.mottatt}`} tone="gronn" under="stk inn på lager" />
          <Kpi etikett="Solgt" verdi={t.solgt} under="stk plukket" />
          <Kpi etikett="Bekreftet svinn" verdi={t.svinn} under="stk" tone={t.svinn ? "rod" : undefined} />
          <Kpi etikett="Uavklart" verdi={t.muligSvinn} under="stk i åpne avvik" href="/avvik" />
          <Kpi etikett="Funnet igjen" verdi={t.funnet} under="stk satt tilbake" />
          <Kpi etikett="Svinnrate" verdi={prosent(r.svinnrate)} under="svinn og uavklart av alt som gikk ut" />
        </div>

        <Panel tittel="Per vare" handling={<a href={csv("varer")} className="text-[13px] underline underline-offset-2">CSV</a>}>
          <Tabell hode={["Vare", "Mottatt", "Solgt", "Svinn", "Uavklart", "Funnet", "Korr.", "Netto", "Svinnrate", "På lager nå"]} hoyre={[1, 2, 3, 4, 5, 6, 7, 8, 9]}>
            {varer.map((v) => (
              <tr key={v.sku}>
                <td><Link href={`/varer/${encodeURIComponent(v.sku)}`} className="flex items-center gap-2 whitespace-nowrap hover:underline"><Prikk farge={v.swatch} />{v.navn}</Link></td>
                <td className="text-right font-mono">{v.mottatt || "–"}</td>
                <td className="text-right font-mono">{v.solgt || "–"}</td>
                <td className={`text-right font-mono ${v.svinn ? "font-semibold text-rod" : ""}`}>{v.svinn || "–"}</td>
                <td className={`text-right font-mono ${v.muligSvinn ? "text-rod" : ""}`}>{v.muligSvinn || "–"}</td>
                <td className="text-right font-mono">{v.funnet || "–"}</td>
                <td className="text-right font-mono">{v.korrigering ? fortegn(v.korrigering) : "–"}</td>
                <td className="text-right font-mono">{fortegn(v.netto)}</td>
                <td className={`text-right font-mono ${v.svinnrate > 0.05 ? "font-semibold text-rod" : "text-dempet"}`}>{v.svinnrate ? prosent(v.svinnrate) : "–"}</td>
                <td className="text-right font-mono font-semibold">{v.beholdning}</td>
              </tr>
            ))}
            {varer.length === 0 && <TomRad kolonner={10}>Ingen varer registrert.</TomRad>}
          </Tabell>
        </Panel>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Panel tittel="Per lokasjon">
            <Tabell hode={["Lokasjon", "Mottatt", "Solgt", "Svinn", "Uavklart", "Svinnrate"]} hoyre={[1, 2, 3, 4, 5]}>
              {r.hyller.map((h) => (
                <tr key={h.id}>
                  <td><Link href={`/lokasjoner#${h.id}`} className="hover:underline"><b className="font-semibold">{h.id}</b> <span className="text-dempet">{h.navn}</span></Link></td>
                  <td className="text-right font-mono">{h.mottatt || "–"}</td>
                  <td className="text-right font-mono">{h.solgt || "–"}</td>
                  <td className={`text-right font-mono ${h.svinn ? "font-semibold text-rod" : ""}`}>{h.svinn || "–"}</td>
                  <td className="text-right font-mono">{h.muligSvinn || "–"}</td>
                  <td className="text-right font-mono text-dempet">{h.svinnrate ? prosent(h.svinnrate) : "–"}</td>
                </tr>
              ))}
              {r.hyller.length === 0 && <TomRad kolonner={6}>Ingen lokasjoner.</TomRad>}
            </Tabell>
          </Panel>
          <Panel tittel="Per dag">
            <Tabell hode={["Dag", "Mottatt", "Solgt", "Svinn", "Uavklart", "Netto"]} hoyre={[1, 2, 3, 4, 5]}>
              {r.perDag.map((d) => (
                <tr key={d.dag}>
                  <td className="whitespace-nowrap">{dagNavn(d.dag)}</td>
                  <td className="text-right font-mono">{d.mottatt || "–"}</td>
                  <td className="text-right font-mono">{d.solgt || "–"}</td>
                  <td className={`text-right font-mono ${d.svinn ? "font-semibold text-rod" : ""}`}>{d.svinn || "–"}</td>
                  <td className="text-right font-mono">{d.muligSvinn || "–"}</td>
                  <td className="text-right font-mono">{fortegn(d.netto)}</td>
                </tr>
              ))}
              {r.perDag.length === 0 && <TomRad kolonner={6}>Ingen bevegelser i perioden.</TomRad>}
            </Tabell>
          </Panel>
        </div>
        <p className="text-[12.5px] text-dempet">
          Svinn er varer som er kontrollert og bekreftet borte. Uavklart er åpne avvik som ennå ikke er kontrollert, og regnes ikke som svinn før noen har bekreftet det.
        </p>
      </Innhold>
    </>
  );
}
