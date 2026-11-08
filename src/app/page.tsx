import Link from "next/link";
import { hentState } from "@/lib/store";
import { apneAvvik, apneKameraAvvik, beholdning, hylleStatus, sisteTelling, totalBeholdning, vare } from "@/lib/lager";
import { fortegn, hilsen, klokke, kortDato, dagTittel, typeFarge } from "@/lib/format";
import { lavBeholdning, rapport } from "@/lib/rapport";
import { erAktiv, oppdragFor } from "@/lib/oppdrag";
import { Innhold, Kpi, Ruter, Panel, PanelLenke, Prikk, Tabell, TomRad, Topp, TypeChip } from "@/components/dash";
import { StatusChip } from "@/components/ui";
import { KameraAvvikRad } from "./kamera/KameraAvvikRad";
import { alleRader } from "@/lib/kamerafeed";
import { DemoBestillinger } from "./DemoBestillinger";

export const dynamic = "force-dynamic";

const tidTekst = (iso: string) => (dagTittel(iso) === "I dag" ? klokke(iso) : `${kortDato(iso)} ${klokke(iso)}`);

export default async function Oversikt() {
  const s = await hentState();
  const avvik = apneAvvik(s);
  const kamera = apneKameraAvvik(s);
  const totalt = avvik.length + kamera.length;
  const lav = lavBeholdning(s);
  const uke = rapport(s, 7);
  const idag = rapport(s, 1);
  const siste = alleRader(s).slice(0, 8);
  const grense = Date.now() - 12 * 3600e3;
  const bestillinger = s.ordrer
    .filter((o) => o.status === "apen" || (o.plukketTid && Date.parse(o.plukketTid) > grense))
    .sort((a, b) => Number(a.status !== "apen") - Number(b.status !== "apen") || b.tid.localeCompare(a.tid))
    .slice(0, 8);
  const dato = new Date().toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <Topp
        tittel={`${hilsen()} ${totalt ? `${totalt} avvik venter.` : "Ingen åpne avvik."}`}
        under={<span className="first-letter:uppercase">{dato} · {s.innstillinger.lager}</span>}
      >
        <Link href="/rapport" className="knapp-gul !h-11 !w-auto !rounded-[10px] !border-2 px-5 !text-[14px]">Se rapport</Link>
      </Topp>
      <Innhold>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Kpi etikett="På lager" verdi={totalBeholdning(s)} under={`${s.varer.length} varetyper`} href="/varer" />
          <Kpi etikett="Åpne avvik" verdi={totalt} under={totalt ? `${avvik.length} fra telling · ${kamera.length} fra kamera` : "Alt er avklart"} tone={totalt ? "rod" : undefined} href="/avvik" />
          <Kpi etikett="Svinn, 7 dager" verdi={uke.totalt.svinn} under={uke.totalt.muligSvinn ? `+ ${uke.totalt.muligSvinn} stk uavklart` : "bekreftet etter kontroll"} href="/rapport?dager=7" />
          <Kpi etikett="Bevegelser i dag" verdi={idag.antallHendelser} under={`+${idag.totalt.mottatt} inn · −${idag.totalt.solgt} solgt`} tone={idag.antallHendelser ? "gronn" : undefined} href="/logg?dager=1" />
          <Kpi etikett="Lav beholdning" verdi={lav.length} under="varer med 3 eller færre" tone={lav.length ? "gul" : undefined} href="/varer?status=lav" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel tittel="Åpne avvik" handling={<PanelLenke href="/avvik">Alle avvik</PanelLenke>}>
            <ul className="divide-y divide-linje">
              {avvik.slice(0, 5).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-4 bg-rodlys px-4 py-3.5">
                  <span className="display w-12 text-[30px] text-rod" style={{ fontStretch: "100%" }}>−{Math.abs(a.endring)}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{vare(s, a.sku)?.navn ?? a.sku} · {a.hylle}</span>
                    <span className="text-[12.5px] text-dempet">{a.aarsak} · {tidTekst(a.tid)}{(() => { const o = oppdragFor(s, a.id); return o && erAktiv(o) ? <span className="ml-1 font-semibold text-gultekst">· sendt til skanner</span> : null; })()}</span>
                  </span>
                  <Link href={`/avvik/${a.id}`} className="flex h-10 items-center rounded-[9px] bg-rod px-4 text-[13px] font-bold text-bg hover:opacity-90">Behandle</Link>
                </li>
              ))}
              {kamera.slice(0, 5).map((a) => <KameraAvvikRad key={a.id} a={a} />)}
              {kamera.length > 5 && <li className="px-4 py-3 text-[13px] text-dempet">{kamera.length - 5} til fra kameraet. <Link href="/kamera" className="underline underline-offset-2">Se alle</Link></li>}
              {totalt === 0 && <li className="px-4 py-8 text-center text-[13.5px] text-dempet">Ingen åpne avvik. Nye avvik dukker opp her så snart de oppdages.</li>}
              {avvik.length > 5 && <li className="px-4 py-3 text-[13px] text-dempet">{avvik.length - 5} til. <Link href="/avvik" className="underline underline-offset-2">Se alle</Link></li>}
            </ul>
          </Panel>

          <Panel tittel="Lav beholdning" handling={<PanelLenke href="/varer?status=lav">Se varer</PanelLenke>}>
            <ul className="divide-y divide-linje">
              {lav.slice(0, 6).map((v) => (
                <li key={v.sku}>
                  <Link href={`/varer/${encodeURIComponent(v.sku)}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-graa">
                    <Prikk farge={v.swatch} />
                    <span className="flex-1 text-[13.5px]">{v.navn}<span className="ml-2 font-mono text-[11px] text-dempet">{v.sku}</span></span>
                    <Ruter antall={v.antall} />
                    <span className={`display w-7 text-right text-[20px] ${v.antall <= 2 ? "text-rod" : "text-gultekst"}`} style={{ fontStretch: "100%" }}>{v.antall}</span>
                  </Link>
                </li>
              ))}
              {lav.length === 0 && <li className="px-4 py-8 text-center text-[13.5px] text-dempet">Ingen varer er nede på 3 eller færre.</li>}
            </ul>
          </Panel>
        </div>

        <Panel tittel="Bestillinger til pakking" handling={<DemoBestillinger />}>
          <Tabell hode={["Ordre", "Vare", "Lokasjon", "Skannet ut", "Status"]} hoyre={[3]}>
            {bestillinger.map((o) => {
              const ferdig = o.status === "plukket";
              return (
                <tr key={o.id}>
                  <td className="font-mono text-[12.5px]">{o.id}<div className="text-[11.5px] text-dempet">{tidTekst(o.tid)}</div></td>
                  <td><Link href={`/varer/${encodeURIComponent(o.sku)}`} className="hover:underline">{vare(s, o.sku)?.navn ?? o.sku}</Link></td>
                  <td className="font-semibold">{o.hylle}</td>
                  <td className="text-right font-mono">{o.plukket ?? 0} / {o.antall}</td>
                  <td className={`text-[13px] ${ferdig ? "font-semibold text-gronn" : o.tattAv ? "font-semibold text-gultekst" : "text-dempet"}`}>
                    {ferdig ? `Pakket${o.plukketTid ? ` ${klokke(o.plukketTid)}` : ""}, ført som salg` : o.tattAv ? `${o.tattAv} pakker` : "Venter i appen"}
                  </td>
                </tr>
              );
            })}
            {bestillinger.length === 0 && <TomRad kolonner={5}>Ingen bestillinger å pakke. Trykk «Lag demo-bestillinger» for å legge inn noen.</TomRad>}
          </Tabell>
        </Panel>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel tittel="Siste hendelser og kamera" handling={<PanelLenke href="/logg">Hele loggen</PanelLenke>}>
            <Tabell hode={["Tid", "Type", "Lokasjon", "Vare", "Endring", "Årsak"]} hoyre={[4]}>
              {siste.map((h) => (
                <tr key={h.id}>
                  <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{tidTekst(h.tid)}</td>
                  <td><TypeChip type={h.type} /></td>
                  <td className="font-semibold">{h.hylle}</td>
                  <td>{h.sku ? <Link href={`/varer/${encodeURIComponent(h.sku)}`} className="hover:underline">{h.navn}</Link> : h.navn}</td>
                  <td className={`text-right font-mono font-medium ${h.kamera ? "text-dempet" : typeFarge(h.type, h.endring)}`}>{h.endring ? fortegn(h.endring) : "–"}</td>
                  <td className="max-w-[240px] truncate text-[12.5px] whitespace-nowrap text-dempet" title={h.aarsak}>{h.aarsak}</td>
                </tr>
              ))}
              {siste.length === 0 && <TomRad kolonner={6}>Ingen hendelser ennå.</TomRad>}
            </Tabell>
          </Panel>

          <Panel tittel="Lokasjoner" handling={<PanelLenke href="/lokasjoner">Alle lokasjoner</PanelLenke>}>
            <ul className="divide-y divide-linje">
              {s.hyller.map((hy) => {
                const t = sisteTelling(s, hy.id);
                const stk = hy.innhold.reduce((n, i) => n + beholdning(s, i.sku, hy.id), 0);
                return (
                  <li key={hy.id}>
                    <Link href={`/lokasjoner#${hy.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-graa">
                      <span className="flex h-9 w-11 items-center justify-center rounded-md border border-gulkant bg-gullys font-display text-[15px] font-extrabold">{hy.id}</span>
                      <span className="flex flex-1 flex-col text-[13.5px]">
                        <span className="font-semibold">{hy.navn}</span>
                        <span className="text-[12px] text-dempet">{hy.innhold.length} varetyper · {stk} stk{t ? ` · sist kontrollert ${tidTekst(t.tid)}` : ""}</span>
                      </span>
                      <StatusChip status={hylleStatus(s, hy.id)} />
                    </Link>
                  </li>
                );
              })}
              {s.hyller.length === 0 && <li className="px-4 py-8 text-center text-[13.5px] text-dempet">Ingen lokasjoner registrert.</li>}
            </ul>
          </Panel>
        </div>
      </Innhold>
    </>
  );
}
