import Link from "next/link";
import { hentState } from "@/lib/store";
import { apneAvvik, beholdning, hylleStatus, sisteTelling, totalBeholdning, vare } from "@/lib/lager";
import { fortegn, hilsen, klokke, kortDato, dagTittel, typeFarge } from "@/lib/format";
import { lavBeholdning, rapport } from "@/lib/rapport";
import { AvvikChip, Innhold, Kpi, Panel, PanelLenke, Prikk, Tabell, TomRad, Topp, TypeChip } from "@/components/dash";
import { StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

const tidTekst = (iso: string) => (dagTittel(iso) === "I dag" ? klokke(iso) : `${kortDato(iso)} ${klokke(iso)}`);

export default async function Oversikt() {
  const s = await hentState();
  const avvik = apneAvvik(s);
  const lav = lavBeholdning(s);
  const uke = rapport(s, 7);
  const idag = rapport(s, 1);
  const siste = [...s.hendelser].sort((a, b) => b.tid.localeCompare(a.tid)).slice(0, 8);
  const dato = new Date().toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <Topp
        tittel={`${hilsen()} ${avvik.length ? `${avvik.length} ${avvik.length === 1 ? "avvik venter" : "avvik venter"}.` : "Ingen åpne avvik."}`}
        under={<span className="first-letter:uppercase">{dato} · {s.innstillinger.lager}</span>}
      >
        <Link href="/rapport" className="rounded-lg border border-kant bg-white px-3.5 py-2 text-[13.5px] font-semibold hover:border-tekst">Se rapport</Link>
      </Topp>
      <Innhold>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Kpi etikett="På lager" verdi={totalBeholdning(s)} under={`${s.varer.length} varetyper`} href="/varer" />
          <Kpi etikett="Åpne avvik" verdi={avvik.length} under={avvik.length ? `${avvik.reduce((n, a) => n - a.endring, 0)} stk uavklart` : "Alt er avklart"} tone={avvik.length ? "rod" : undefined} href="/avvik" />
          <Kpi etikett="Svinn, 7 dager" verdi={uke.totalt.svinn} under={uke.totalt.muligSvinn ? `+ ${uke.totalt.muligSvinn} stk uavklart` : "bekreftet etter kontroll"} href="/rapport?dager=7" />
          <Kpi etikett="Bevegelser i dag" verdi={idag.antallHendelser} under={`+${idag.totalt.mottatt} inn · −${idag.totalt.solgt} solgt`} href="/logg?dager=1" />
          <Kpi etikett="Lav beholdning" verdi={lav.length} under="varer med 3 eller færre" tone={lav.length ? "gul" : undefined} href="/varer?status=lav" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel tittel="Åpne avvik" handling={<PanelLenke href="/avvik">Alle avvik</PanelLenke>}>
            <Tabell hode={["Oppdaget", "Lokasjon", "Vare", "Mangler", "Status", ""]} hoyre={[3]}>
              {avvik.slice(0, 6).map((a) => (
                <tr key={a.id} className="hover:bg-bg">
                  <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{tidTekst(a.tid)}</td>
                  <td className="font-semibold">{a.hylle}</td>
                  <td>{vare(s, a.sku)?.navn ?? a.sku}</td>
                  <td className="text-right font-mono font-semibold text-rod">{Math.abs(a.endring)} stk</td>
                  <td><AvvikChip status="apen" /></td>
                  <td className="text-right"><Link href={`/avvik/${a.id}`} className="text-[13px] font-semibold underline underline-offset-2">Behandle</Link></td>
                </tr>
              ))}
              {avvik.length === 0 && <TomRad kolonner={6}>Ingen åpne avvik. Nye avvik dukker opp her så snart de oppdages.</TomRad>}
            </Tabell>
          </Panel>

          <Panel tittel="Lav beholdning" handling={<PanelLenke href="/varer?status=lav">Se varer</PanelLenke>}>
            <ul className="divide-y divide-kant">
              {lav.slice(0, 6).map((v) => (
                <li key={v.sku}>
                  <Link href={`/varer/${encodeURIComponent(v.sku)}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg">
                    <Prikk farge={v.swatch} />
                    <span className="flex-1 text-[13.5px]">{v.navn}<span className="ml-2 font-mono text-[11px] text-dempet">{v.sku}</span></span>
                    <span className={`display text-[20px] ${v.antall <= 1 ? "text-rod" : ""}`} style={{ fontStretch: "100%" }}>{v.antall}</span>
                  </Link>
                </li>
              ))}
              {lav.length === 0 && <li className="px-4 py-8 text-center text-[13.5px] text-dempet">Ingen varer er nede på 3 eller færre.</li>}
            </ul>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel tittel="Siste hendelser" handling={<PanelLenke href="/logg">Hele loggen</PanelLenke>}>
            <Tabell hode={["Tid", "Type", "Lokasjon", "Vare", "Endring", "Årsak"]} hoyre={[4]}>
              {siste.map((h) => (
                <tr key={h.id}>
                  <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{tidTekst(h.tid)}</td>
                  <td><TypeChip type={h.type} /></td>
                  <td className="font-semibold">{h.hylle}</td>
                  <td><Link href={`/varer/${encodeURIComponent(h.sku)}`} className="hover:underline">{vare(s, h.sku)?.navn ?? h.sku}</Link></td>
                  <td className={`text-right font-mono font-medium ${typeFarge(h.type, h.endring)}`}>{fortegn(h.endring)}</td>
                  <td className="max-w-[240px] truncate text-[12.5px] whitespace-nowrap text-dempet" title={h.aarsak}>{h.aarsak}</td>
                </tr>
              ))}
              {siste.length === 0 && <TomRad kolonner={6}>Ingen hendelser ennå.</TomRad>}
            </Tabell>
          </Panel>

          <Panel tittel="Lokasjoner" handling={<PanelLenke href="/lokasjoner">Alle lokasjoner</PanelLenke>}>
            <ul className="divide-y divide-kant">
              {s.hyller.map((hy) => {
                const t = sisteTelling(s, hy.id);
                const stk = hy.innhold.reduce((n, i) => n + beholdning(s, i.sku, hy.id), 0);
                return (
                  <li key={hy.id}>
                    <Link href={`/lokasjoner#${hy.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg">
                      <span className="flex h-9 w-11 items-center justify-center rounded-md border border-[#EAD58A] bg-gullys font-display text-[15px] font-extrabold">{hy.id}</span>
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
