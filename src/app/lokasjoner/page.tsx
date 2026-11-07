import Link from "next/link";
import { hentState } from "@/lib/store";
import { apneAvvik, beholdning, hylleStatus, sisteTelling, vare } from "@/lib/lager";
import { klokke, kortDato } from "@/lib/format";
import { Innhold, Panel, Prikk, Tabell, TomRad, Topp } from "@/components/dash";
import { StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Lokasjoner() {
  const s = await hentState();
  const avvik = apneAvvik(s);
  const reoler = [...new Set(s.hyller.map((h) => h.reol))].sort();
  const medAvvik = s.hyller.filter((h) => hylleStatus(s, h.id) === "avvik").length;

  return (
    <>
      <Topp tittel="Lokasjoner" under={`${reoler.length} reol${reoler.length === 1 ? "" : "er"} · ${s.hyller.length} lokasjoner · ${medAvvik} med åpent avvik`} />
      <Innhold>
        {s.hyller.length === 0 && <div className="kort px-4 py-10 text-center text-dempet">Ingen lokasjoner registrert ennå. De opprettes når varer legges inn.</div>}
        {reoler.map((reol) => (
          <section key={reol} className="flex flex-col gap-3">
            <span className="etikett">Reol {reol}</span>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {s.hyller.filter((h) => h.reol === reol).map((hy) => {
                const t = sisteTelling(s, hy.id);
                const apne = avvik.filter((a) => a.hylle === hy.id);
                const sum = hy.innhold.reduce((n, i) => n + beholdning(s, i.sku, hy.id), 0);
                return (
                  <div key={hy.id} id={hy.id} className="scroll-mt-24">
                    <Panel
                      tittel={`${hy.id} · ${hy.navn}`}
                      handling={<StatusChip status={hylleStatus(s, hy.id)} />}
                    >
                      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-kant bg-bg px-4 py-2.5 text-[12.5px] text-dempet">
                        <span><b className="font-semibold text-tekst">{sum}</b> stk</span>
                        <span><b className="font-semibold text-tekst">{hy.innhold.length}</b> varetyper</span>
                        <span>Sist kontrollert {t ? `${kortDato(t.tid)} ${klokke(t.tid)}` : "aldri"}</span>
                        {apne.length > 0 && <Link href={`/avvik/${apne[0].id}`} className="font-semibold text-rod underline underline-offset-2">{apne.length} åpent avvik</Link>}
                      </div>
                      <Tabell hode={["Vare", "Plassering", "Forventet", "Sist observert"]} hoyre={[2, 3]}>
                        {hy.innhold.map((i) => {
                          const v = vare(s, i.sku);
                          const forventet = beholdning(s, i.sku, hy.id);
                          const observert = t?.antall[i.sku];
                          const ulik = observert !== undefined && observert !== forventet;
                          return (
                            <tr key={i.sku}>
                              <td><Link href={`/varer/${encodeURIComponent(i.sku)}`} className="flex items-center gap-2 hover:underline"><Prikk farge={v?.swatch ?? "#999"} />{v?.navn ?? i.sku}</Link></td>
                              <td className="text-dempet">{i.nivaa || "Ikke oppgitt"}</td>
                              <td className="text-right font-mono">{forventet}</td>
                              <td className={`text-right font-mono ${ulik ? "font-semibold text-rod" : "text-dempet"}`}>{observert ?? "–"}</td>
                            </tr>
                          );
                        })}
                        {hy.innhold.length === 0 && <TomRad kolonner={4}>Ingen varer på denne lokasjonen.</TomRad>}
                      </Tabell>
                    </Panel>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </Innhold>
    </>
  );
}
