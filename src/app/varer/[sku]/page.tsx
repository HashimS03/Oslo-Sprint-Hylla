import { notFound } from "next/navigation";
import { hentState } from "@/lib/store";
import { beholdning, beholdningPerHylle, innkjopForVare, vare } from "@/lib/lager";
import { fortegn, klokke, kortDato, dagTittel, typeFarge } from "@/lib/format";
import { Side } from "@/components/Nav";
import { Tilbake } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VareSide({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const s = await hentState();
  const v = vare(s, decodeURIComponent(sku));
  if (!v) notFound();
  const totalt = beholdning(s, v.sku);
  const hyller = beholdningPerHylle(s, v.sku);
  const po = innkjopForVare(s, v.sku)[0];
  const historikk = s.hendelser.filter((h) => h.sku === v.sku).sort((a, b) => b.tid.localeCompare(a.tid)).slice(0, 8);
  const plass = (id: string) => s.hyller.find((h) => h.id === id)?.innhold.find((i) => i.sku === v.sku)?.nivaa;
  const mottakPo = po ? s.hendelser.filter((h) => h.ref === po.id && h.type === "mottak") : [];

  return (
    <Side>
      <Tilbake href="/varer"><span className="font-mono text-xs text-dempet">{v.sku}</span></Tilbake>
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-1 pb-4">
        <div className="flex items-center gap-3.5">
          <span className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[14px] border border-kant" style={{ background: v.swatch }}>
            {v.bilder[0] && <img src={v.bilder[0]} alt="" className="h-full w-full object-cover" />}
          </span>
          <div>
            <h1 className="display text-[28px]">{v.navn}</h1>
            <div className="mt-1 text-[13px] text-dempet">Størrelse {v.storrelse} · {v.farge}{v.leverandor ? ` · ${v.leverandor}` : ""}</div>
          </div>
        </div>

        <div className="flex items-baseline justify-between rounded-2xl bg-tekst px-4 py-3.5 text-bg">
          <span className="text-[13px] text-[#C9D1CE]">På lager nå</span>
          <span className="display text-[40px] text-gul" style={{ fontStretch: "100%" }}>{totalt}</span>
        </div>

        <section className="flex flex-col gap-1.5">
          <span className="etikett">Per hylle</span>
          <div className="kort overflow-hidden">
            {hyller.map((h, i) => (
              <div key={h.hylle} className={`flex justify-between px-3 py-2.5 text-sm ${i ? "border-t border-kant" : ""} ${h.antall === 0 ? "text-dempet" : ""}`}>
                <span><b className="font-semibold">{h.hylle}</b> {plass(h.hylle)}</span>
                <span className="font-mono">{h.antall}</span>
              </div>
            ))}
          </div>
        </section>

        {po && (
          <section className="flex flex-col gap-1.5">
            <span className="etikett">Innkjøp {po.id}</span>
            <div className="kort flex flex-col gap-2 p-3">
              <div className="flex justify-between text-[13px]"><span>Bestilt {kortDato(po.bestiltDato)}</span><b className="font-semibold">{po.bestilt}</b></div>
              <div className="flex h-2 overflow-hidden rounded bg-graa"><span className="bg-gronn" style={{ width: `${Math.min(100, (po.mottatt / po.bestilt) * 100)}%` }} /></div>
              <div className="flex justify-between text-xs text-dempet">
                <span>{mottakPo.map((h) => `${h.endring} kom ${dagTittel(h.tid).toLowerCase()}`).join(", ") || `${po.mottatt} mottatt`}</span>
                <span className={po.mottatt >= po.bestilt ? "font-semibold text-gronn" : ""}>{po.mottatt >= po.bestilt ? "fullført" : `${po.bestilt - po.mottatt} gjenstår`}</span>
              </div>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-1.5">
          <span className="etikett">Historikk</span>
          <div className="kort overflow-hidden text-[13px]">
            {historikk.map((h, i) => (
              <div key={h.id} className={`flex gap-2.5 px-3 py-[9px] ${i ? "border-t border-kant" : ""}`}>
                <span className="w-[74px] shrink-0 font-mono text-[11px] text-dempet">{dagTittel(h.tid) === "I dag" ? `i dag ${klokke(h.tid)}` : kortDato(h.tid)}</span>
                <span className="flex-1">{h.aarsak}</span>
                <span className={`font-mono ${typeFarge(h.type, h.endring)}`}>{fortegn(h.endring)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Side>
  );
}
