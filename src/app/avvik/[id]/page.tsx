import { notFound } from "next/navigation";
import Link from "next/link";
import { hentState } from "@/lib/store";
import { beholdning, vare } from "@/lib/lager";
import { klokke, kortDato } from "@/lib/format";
import { AvvikChip, Innhold, Panel, Topp } from "@/components/dash";
import { AvvikHandlinger } from "./AvvikHandlinger";

export const dynamic = "force-dynamic";

export default async function Avvik({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await hentState();
  const h = s.hendelser.find((x) => x.id === id);
  if (!h || !(h.avvik || h.type === "mulig_svinn" || h.type === "svinn")) notFound();
  const v = vare(s, h.sku);
  const etter = s.tellinger.find((t) => t.id === h.tellingId);
  const for_ = s.tellinger.find((t) => t.id === h.avvik?.forrigeTellingId);
  const antallFor = for_?.antall[h.sku];
  const antallEtter = etter?.antall[h.sku];
  const status = h.avvik?.status ?? (h.type === "svinn" ? "svinn" : "apen");
  const n = Math.abs(h.endring);
  const plass = s.hyller.find((x) => x.id === h.hylle)?.innhold.find((i) => i.sku === h.sku)?.nivaa;
  const ordrer = s.ordrer.filter((o) => o.sku === h.sku && o.status === "apen");
  const relaterte = s.hendelser
    .filter((x) => x.sku === h.sku && x.hylle === h.hylle && x.id !== h.id && Math.abs(new Date(x.tid).getTime() - new Date(h.tid).getTime()) < 24 * 36e5)
    .sort((a, b) => b.tid.localeCompare(a.tid))
    .slice(0, 6);

  const Bilde = ({ t, antall, tittel, rod }: { t?: typeof etter; antall?: number; tittel: string; rod?: boolean }) => (
    <div className="flex flex-col gap-1.5">
      <span className="etikett">{tittel}</span>
      <div className={`flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-skifer ${rod ? "outline outline-[2.5px] -outline-offset-[2.5px] outline-rodkant" : ""}`}>
        {t?.bilde ? <img src={t.bilde} alt={`${tittel}: ${antall ?? "?"} stk`} className="h-full w-full object-cover" /> : <span className="font-mono text-[11px] text-white/50">ingen bilde</span>}
      </div>
      <span className={`font-mono text-[12px] ${rod ? "text-rod" : "text-dempet"}`}>
        {t ? `${kortDato(t.tid)} ${klokke(t.tid)}` : "–"}{antall !== undefined ? ` · ${antall} stk` : ""}
      </span>
    </div>
  );

  return (
    <>
      <Topp
        tittel={`${n} stk ${status === "funnet" ? "funnet igjen" : status === "svinn" ? "registrert som svinn" : status === "lukket" ? "var salg" : "mangler"}`}
        under={<>{v?.navn ?? h.sku} · lokasjon {h.hylle}{plass ? `, ${plass}` : ""} · oppdaget {kortDato(h.tid)} {klokke(h.tid)}</>}
        tilbake={{ href: "/avvik", navn: "Avvik" }}
      >
        <AvvikChip status={status} />
      </Topp>
      <Innhold>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-5">
            <Panel tittel="Observasjon">
              <div className="grid grid-cols-2 gap-4 p-4">
                <Bilde t={for_} antall={antallFor} tittel="Før" />
                <Bilde t={etter} antall={antallEtter} tittel="Etter" rod={status === "apen"} />
              </div>
            </Panel>
            <Panel tittel="Hendelser rundt avviket">
              <ul className="divide-y divide-kant text-[13.5px]">
                {relaterte.map((r) => (
                  <li key={r.id} className="flex gap-3 px-4 py-2.5">
                    <span className="w-[92px] shrink-0 font-mono text-[12px] text-dempet">{kortDato(r.tid)} {klokke(r.tid)}</span>
                    <span className="flex-1">{r.aarsak}{r.ref ? <span className="ml-2 font-mono text-[11.5px] text-dempet">{r.ref}</span> : null}</span>
                    <span className="font-mono">{r.endring > 0 ? `+${r.endring}` : r.endring}</span>
                  </li>
                ))}
                {relaterte.length === 0 && <li className="px-4 py-6 text-center text-dempet">Ingen andre hendelser på denne varen og lokasjonen det siste døgnet.</li>}
              </ul>
            </Panel>
          </div>

          <div className="flex flex-col gap-5">
            <Panel tittel="Hvorfor Hylla flagget dette">
              <div className="flex flex-col gap-2 p-4 text-[13.5px] leading-normal">
                <span>{ordrer.length === 0 ? "Ingen åpen plukkordre på varen forklarer nedgangen." : `${ordrer.length} åpen plukkordre forklarte bare en del av nedgangen.`}</span>
                {antallEtter !== undefined && <span>Lagerloggen forventet {antallEtter + n}, observasjonen viste {antallEtter}.</span>}
                {etter && <span className="text-dempet">Kilde: {etter.kilde === "kamera" ? "hyllekamera" : etter.kilde === "manuell" ? "manuell telling" : "telling"} ({etter.teller}).</span>}
                <span className="text-dempet">Beholdning nå: {beholdning(s, h.sku, h.hylle)} stk på {h.hylle}.</span>
              </div>
            </Panel>
            <Panel tittel={status === "apen" ? "Avklar avviket" : "Avklart"}>
              <div className="p-4">
                {status === "apen" ? (
                  <AvvikHandlinger id={h.id} />
                ) : (
                  <p className="text-[13.5px]">
                    Lukket {h.avvik?.lukketTid ? `${kortDato(h.avvik.lukketTid)} ${klokke(h.avvik.lukketTid)}` : ""}.{" "}
                    {status === "funnet" ? "Antallet er satt tilbake i loggen." : status === "svinn" ? "Varene er trukket fra som svinn." : "Nedgangen er ført som salg."}
                  </p>
                )}
              </div>
            </Panel>
            <Link href={`/varer/${encodeURIComponent(h.sku)}`} className="text-[13px] underline underline-offset-2">Se varen {v?.navn ?? h.sku}</Link>
          </div>
        </div>
      </Innhold>
    </>
  );
}
