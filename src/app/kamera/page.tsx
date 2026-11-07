import Link from "next/link";
import { hentState } from "@/lib/store";
import { matcherOversikt } from "@/lib/matcher";
import { erIdag, vare } from "@/lib/lager";
import { klokke, kortDato } from "@/lib/format";
import { Innhold, Kpi, Panel, Tabell, TomRad, Topp } from "@/components/dash";
import { AutoOppdater } from "@/components/Nav";
import { KameraAvvikRad } from "./KameraAvvikRad";

export const dynamic = "force-dynamic";

const HVA: Record<string, [string, string]> = {
  uttak: ["Uttak", "bg-blaalys text-blaa"],
  plassering: ["Plassering", "bg-gronnlys text-gronn"],
  feil_vare: ["Feil produkt", "bg-rodlys text-rod"],
  gjenglemt: ["Gjenglemt", "bg-gullys text-gultekst"],
};

const tidTekst = (iso: string) => (erIdag(iso) ? klokke(iso) : `${kortDato(iso)} ${klokke(iso)}`);
const siden = (iso?: string) => {
  if (!iso) return "aldri";
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  return s < 60 ? `${s} s siden` : s < 3600 ? `${Math.round(s / 60)} min siden` : tidTekst(iso);
};

export default async function Kamera() {
  const o = await matcherOversikt();
  const s = await hentState();
  const apne = o.avvik.filter((a) => a.status === "apen");
  const lukket = o.avvik.filter((a) => a.status !== "apen").slice(0, 5);
  const hendelser = [...(s.kameraHendelser ?? [])].sort((a, b) => b.tid.localeCompare(a.tid)).slice(0, 12);
  const iDag = (s.kameraHendelser ?? []).filter((k) => erIdag(k.tid)).length;
  const sistSett = Object.values(s.soneSett ?? {}).sort().at(-1);
  const levende = sistSett && Date.now() - Date.parse(sistSett) < 60_000;
  const m = s.matchet ?? {};

  return (
    <>
      <AutoOppdater sekunder={3} />
      <Topp
        tittel="Kamera"
        under={
          <span className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${levende ? "bg-gronn" : "bg-kant"}`} />
            {levende ? `Takkameraet er på · sist bilde ${siden(sistSett)}` : `Takkameraet er av · sist bilde ${siden(sistSett)}`} · avstemmes mot skanneren innen ±{o.vinduSek} s
          </span>
        }
      >
        <Link href="/tak" className="knapp-gul !h-11 !w-auto !rounded-[10px] !border-2 px-5 !text-[14px]">Åpne takkamera</Link>
      </Topp>
      <Innhold>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi etikett="Åpne kameraavvik" verdi={o.tall.apne} under={o.tall.apne ? "venter på kontroll" : "Alt stemmer"} tone={o.tall.apne ? "rod" : undefined} />
          <Kpi etikett="Løst i dag" verdi={o.tall.loestIdag} under="avvik lukket" tone="gronn" />
          <Kpi etikett="Kamera og skanner enige" verdi={o.tall.enighet === null ? "–" : `${o.tall.enighet} %`} under={`${o.tall.samsvar} uttak stemte`} />
          <Kpi etikett="Kamerahendelser i dag" verdi={iDag} under="uttak, plasseringer og funn" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel tittel="Avvik fra kameraet">
            <ul className="divide-y divide-linje">
              {apne.map((a) => <KameraAvvikRad key={a.id} a={a} />)}
              {apne.length === 0 && <li className="px-4 py-8 text-center text-[13.5px] text-dempet">Ingen åpne avvik. Når kameraet ser noe skanneren ikke har registrert, dukker det opp her av seg selv.</li>}
              {lukket.map((a) => <KameraAvvikRad key={a.id} a={a} />)}
            </ul>
          </Panel>

          <Panel tittel="Soner">
            <ul className="divide-y divide-linje">
              {o.kart.map((k) => (
                <li key={k.sone} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`flex h-9 w-14 items-center justify-center rounded-md border font-display text-[13px] font-extrabold ${k.rod ? "border-rodkant bg-rodlys text-rod" : k.apne ? "border-gulkant bg-gullys" : "border-kant bg-gronnlys text-gronn"}`}>{k.sone}</span>
                  <span className="flex flex-1 flex-col text-[13.5px]">
                    <span className="font-semibold">{k.navn}</span>
                    <span className="text-[12px] text-dempet">{k.vare || "Gang, skal være tom"} · sett {siden(s.soneSett?.[k.sone])}</span>
                  </span>
                  <span className={`text-[12.5px] ${k.apne ? "font-semibold text-rod" : "text-dempet"}`}>{k.apne ? `${k.apne} åpne` : "OK"}</span>
                </li>
              ))}
              {o.kart.length === 0 && <li className="px-4 py-8 text-center text-[13.5px] text-dempet">Ingen soner satt opp for kameraet.</li>}
            </ul>
          </Panel>
        </div>

        <Panel tittel="Siste fra kameraet">
          <Tabell hode={["Tid", "Sone", "Hva", "Vare", "Antall", "Sikkerhet", "Mot skanneren"]} hoyre={[4, 5]}>
            {hendelser.map((k) => {
              const [navn, cls] = HVA[k.type] ?? [k.type, "bg-graa text-dempet"];
              const r = m[k.id];
              return (
                <tr key={k.id}>
                  <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{tidTekst(k.tid)}</td>
                  <td className="font-semibold">{k.sone}</td>
                  <td><span className={`inline-block rounded-md px-2 py-[3px] font-mono text-[10.5px] tracking-[.04em] uppercase ${cls}`}>{navn}</span></td>
                  <td>{k.sku ? vare(s, k.sku)?.navn ?? k.sku : <span className="text-dempet">Ukjent</span>}</td>
                  <td className="text-right font-mono">{k.antall}</td>
                  <td className="text-right font-mono text-dempet">{Math.round(k.sikkerhet * 100)} %</td>
                  <td className="text-[12.5px]">
                    {!r ? <span className="text-dempet">Venter</span> : r === "ok" ? <span className="text-gronn">Stemmer</span> : r === "lukket" ? <span className="text-dempet">Lukket</span> : <a href={`#${r}`} className="font-semibold text-rod underline underline-offset-2">Avvik</a>}
                  </td>
                </tr>
              );
            })}
            {hendelser.length === 0 && <TomRad kolonner={7}>Ingen kamerahendelser ennå. Åpne takkameraet for å starte.</TomRad>}
          </Tabell>
        </Panel>
      </Innhold>
    </>
  );
}
