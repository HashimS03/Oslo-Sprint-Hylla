import Link from "next/link";
import { alleRader } from "@/lib/kamerafeed";
import { notFound } from "next/navigation";
import { hentState } from "@/lib/store";
import { apneAvvik, beholdning, beholdningPerHylle, innkjopForVare, plukketSiden, vare } from "@/lib/lager";
import { fortegn, klokke, kortDato, typeFarge } from "@/lib/format";
import { LAV_BEHOLDNING, rapport } from "@/lib/rapport";
import { SlettVare } from "./SlettVare";
import { VareInfo } from "./VareInfo";
import { samPrompt } from "@/lib/prompt";
import { Innhold, Kpi, Panel, Tabell, TomRad, Topp, TypeChip } from "@/components/dash";

export const dynamic = "force-dynamic";

export default async function VareSide({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const s = await hentState();
  const v = vare(s, decodeURIComponent(sku));
  if (!v) notFound();
  const totalt = beholdning(s, v.sku);
  const hyller = beholdningPerHylle(s, v.sku);
  const innkjop = innkjopForVare(s, v.sku);
  const historikk = alleRader(s).filter((h) => h.sku === v.sku).slice(0, 25);
  const refOg = new Map(s.hendelser.map((h) => [h.id, h]));
  const plass = (id: string) => s.hyller.find((h) => h.id === id)?.innhold.find((i) => i.sku === v.sku)?.nivaa;
  const avvik = apneAvvik(s).filter((a) => a.sku === v.sku);
  const apneSalg = s.ordrer.filter((o) => o.sku === v.sku && o.status === "apen");
  const r30 = rapport(s, 30).varer.find((x) => x.sku === v.sku);

  return (
    <>
      <Topp tittel={v.navn} under={<span className="font-mono">{v.sku}</span>} tilbake={{ href: "/varer", navn: "Varer" }}>
        <SlettVare sku={v.sku} navn={v.navn} />
      </Topp>
      <Innhold>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi etikett="På lager" verdi={totalt} under={totalt <= LAV_BEHOLDNING ? "Lav beholdning" : `fordelt på ${hyller.length} lokasjon${hyller.length === 1 ? "" : "er"}`} tone={totalt <= LAV_BEHOLDNING ? "rod" : undefined} />
          <Kpi etikett="Åpne ordrer" verdi={apneSalg.reduce((n, o) => n + o.antall, 0)} under={`${apneSalg.length} ordre${apneSalg.length === 1 ? "" : "r"} venter på plukk`} />
          <Kpi etikett="Åpne avvik" verdi={avvik.reduce((n, a) => n - a.endring, 0)} under={avvik.length ? "stk uavklart" : "Ingen"} tone={avvik.length ? "rod" : undefined} href={avvik[0] ? `/avvik/${avvik[0].id}` : undefined} />
          <Kpi etikett="Svinn, 30 dager" verdi={r30?.svinn ?? 0} under={`${r30?.solgt ?? 0} solgt · ${r30?.mottatt ?? 0} mottatt`} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-5">
            <VareInfo
              vare={v}
              forslag={samPrompt({ navn: v.navn, farge: v.farge })}
              topp={
                <div className="flex items-center gap-4 border-b border-kant p-4">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-kant" style={{ background: v.swatch }}>
                    {v.bilder[0] && <img src={v.bilder[0]} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="text-[13.5px] text-dempet">{v.beskrivelse || "Ingen beskrivelse"}</span>
                </div>
              }
            />

            <Panel tittel="Beholdning per lokasjon">
              <Tabell hode={["Lokasjon", "Plassering", "Antall"]} hoyre={[2]}>
                {hyller.map((h) => (
                  <tr key={h.hylle}>
                    <td className="font-semibold"><Link href={`/lokasjoner#${h.hylle}`} className="hover:underline">{h.hylle}</Link></td>
                    <td className="text-dempet">{plass(h.hylle) ?? "Ikke oppgitt"}</td>
                    <td className="text-right font-mono">{h.antall}</td>
                  </tr>
                ))}
                {hyller.length === 0 && <TomRad kolonner={3}>Varen er ikke plassert på noen lokasjon.</TomRad>}
              </Tabell>
            </Panel>

            <Panel tittel="Innkjøp">
              <Tabell hode={["PO", "Bestilt", "Mottatt", "Plukket siden", "Status"]} hoyre={[1, 2, 3]}>
                {innkjop.map((po) => (
                  <tr key={po.id}>
                    <td className="font-mono text-[12.5px]">{po.id}<div className="text-[11.5px] text-dempet">{kortDato(po.bestiltDato)} · {po.leverandor}</div></td>
                    <td className="text-right font-mono">{po.bestilt}</td>
                    <td className="text-right font-mono">{po.mottatt}</td>
                    <td className="text-right font-mono">{plukketSiden(s, v.sku, po.bestiltDato)}</td>
                    <td className={po.mottatt >= po.bestilt ? "font-semibold text-gronn" : "text-dempet"}>{po.mottatt >= po.bestilt ? "Fullført" : `${po.bestilt - po.mottatt} gjenstår`}</td>
                  </tr>
                ))}
                {innkjop.length === 0 && <TomRad kolonner={5}>Ingen innkjøp registrert.</TomRad>}
              </Tabell>
            </Panel>
          </div>

          <Panel tittel="Historikk" handling={<Link href={`/logg?q=${encodeURIComponent(v.sku)}`} className="text-[13px] underline underline-offset-2">I hendelsesloggen</Link>}>
            <Tabell hode={["Tid", "Type", "Lokasjon", "Endring", "Årsak", "Ref"]} hoyre={[3]}>
              {historikk.map((h) => (
                <tr key={h.id}>
                  <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{kortDato(h.tid)} {klokke(h.tid)}</td>
                  <td><TypeChip type={h.type} /></td>
                  <td className="font-semibold">{h.hylle}</td>
                  <td className={`text-right font-mono font-medium ${h.kamera ? "text-dempet" : typeFarge(h.type, h.endring)}`}>{h.endring ? fortegn(h.endring) : "–"}</td>
                  <td className="text-[12.5px]">{h.type === "mulig_svinn" || h.type === "svinn" ? <Link href={`/avvik/${h.id}`} className="underline underline-offset-2">{h.aarsak}</Link> : h.kamera && h.avvik ? <Link href={`/avvik#${h.avvik}`} className="underline underline-offset-2">{h.aarsak}</Link> : h.aarsak}</td>
                  <td className="font-mono text-[12px] text-dempet">{refOg.get(h.id)?.ref ?? ""}</td>
                </tr>
              ))}
              {historikk.length === 0 && <TomRad kolonner={6}>Ingen hendelser for denne varen.</TomRad>}
            </Tabell>
          </Panel>
        </div>
      </Innhold>
    </>
  );
}
