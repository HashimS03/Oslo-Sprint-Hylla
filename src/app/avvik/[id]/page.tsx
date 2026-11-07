import { notFound } from "next/navigation";
import Link from "next/link";
import { hentState } from "@/lib/store";
import { vare } from "@/lib/lager";
import { klokke, kortDato } from "@/lib/format";
import { Tilbake } from "@/components/ui";
import { AvvikHandlinger } from "./AvvikHandlinger";

export const dynamic = "force-dynamic";

export default async function Avvik({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await hentState();
  const h = s.hendelser.find((x) => x.id === id);
  if (!h || (h.type !== "mulig_svinn" && h.type !== "svinn")) notFound();
  const v = vare(s, h.sku);
  const etter = s.tellinger.find((t) => t.id === h.tellingId);
  const for_ = s.tellinger.find((t) => t.id === h.avvik?.forrigeTellingId);
  const antallFor = for_?.antall[h.sku];
  const antallEtter = etter?.antall[h.sku];
  const status = h.avvik?.status ?? "apen";
  const n = Math.abs(h.endring);
  const plass = s.hyller.find((x) => x.id === h.hylle)?.innhold.find((i) => i.sku === h.sku)?.nivaa;
  const ordrer = s.ordrer.filter((o) => o.sku === h.sku);

  const Bilde = ({ t, antall, rod }: { t?: typeof etter; antall?: number; rod?: boolean }) => (
    <div className="flex flex-col gap-1">
      <div className={`flex h-[120px] items-center justify-center overflow-hidden rounded-xl bg-skifer ${rod ? "outline-[2.5px] outline-rodkant -outline-offset-[2.5px] outline" : ""}`}>
        {t?.bilde ? <img src={t.bilde} alt="" className="h-full w-full object-cover" /> : <span className="font-mono text-[11px] text-white/50">ingen bilde</span>}
      </div>
      <span className={`font-mono text-[11px] ${rod ? "text-rod" : "text-dempet"}`}>
        {t ? klokke(t.tid) : "–"}{antall !== undefined ? ` · ${antall} stk` : ""}
      </span>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Tilbake href="/logg">
        <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${status === "apen" ? "bg-rodlys text-rod" : status === "funnet" ? "bg-gronnlys text-gronn" : "bg-graa text-dempet"}`}>
          {status === "apen" ? "MULIG SVINN" : status === "funnet" ? "FUNNET" : "REGISTRERT SVINN"}
        </span>
      </Tilbake>
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-1 pb-3">
        <div>
          <h1 className="display text-[30px]">{n} stk mangler</h1>
          <div className="mt-1 text-[15px] font-semibold">{v?.navn}</div>
          <div className="mt-1.5 text-[13px] text-dempet">
            Hylle {h.hylle}{plass ? `, ${plass}` : ""} · {for_ ? `mellom ${klokke(for_.tid)} og ${klokke(h.tid)}` : kortDato(h.tid)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Bilde t={for_} antall={antallFor} />
          <Bilde t={etter} antall={antallEtter} rod />
        </div>
        <div className="kort flex flex-col gap-1 px-3.5 py-3 text-[13px] leading-normal">
          <b className="text-sm font-semibold">Hvorfor Hylla flagget dette</b>
          <span>{ordrer.length === 0 ? "Ingen plukkordre eller retur på denne varen i tidsrommet." : `Åpne plukkordrer forklarte bare en del av nedgangen.`}</span>
          <span>Lagerloggen sa {(antallEtter ?? 0) + n}, bildet viste {antallEtter ?? "?"}.</span>
          {etter && <span className="text-dempet">Talt av {etter.teller === "claude" ? "Claude" : etter.teller}{etter.kilde === "kamera" ? " fra kameratelefonen" : ""}.</span>}
        </div>
        {status !== "apen" && (
          <div className="rounded-xl bg-graa px-3 py-2.5 text-[13px]">Avviket ble lukket {h.avvik?.lukketTid ? klokke(h.avvik.lukketTid) : ""}.</div>
        )}
      </main>
      <div className="flex flex-col gap-2 px-5 pt-1 pb-8">
        <Link href={`/tell/${h.hylle}`} className="knapp-gul">Tell på nytt</Link>
        {status === "apen" && <AvvikHandlinger id={h.id} />}
      </div>
    </div>
  );
}
