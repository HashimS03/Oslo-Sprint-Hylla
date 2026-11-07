import Link from "next/link";
import { hentState } from "@/lib/store";
import { vare } from "@/lib/lager";
import { fortegn, klokke, kortDato, typeFarge } from "@/lib/format";
import { iPerioden, lesPeriode } from "@/lib/rapport";
import { AvvikChip, Filter, Innhold, Panel, PeriodeVelger, Tabell, TomRad, Topp, TypeChip } from "@/components/dash";
import { Ikon } from "@/components/ui";

export const dynamic = "force-dynamic";

const TYPER = [
  { id: "", navn: "Alle" },
  { id: "mottak", navn: "Mottak" },
  { id: "plukk", navn: "Salg" },
  { id: "svinn", navn: "Svinn og avvik" },
  { id: "funnet", navn: "Funnet" },
  { id: "korrigering", navn: "Korrigering" },
];
const MAKS = 300;

type Sok = { type?: string; hylle?: string; dager?: string; q?: string };

export default async function Hendelser({ searchParams }: { searchParams: Promise<Sok> }) {
  const sp = await searchParams;
  const type = sp.type ?? "";
  const hylle = sp.hylle ?? "";
  const q = (sp.q ?? "").trim();
  const dager = lesPeriode(sp.dager, 0);
  const s = await hentState();
  const lenke = (endre: Partial<Sok>) => {
    const p = new URLSearchParams();
    const alle = { type, hylle, dager: String(dager), q, ...endre };
    for (const [k, v] of Object.entries(alle)) if (v && v !== "0") p.set(k, v);
    const t = p.toString();
    return t ? `/logg?${t}` : "/logg";
  };
  const rader = [...s.hendelser]
    .filter((h) => iPerioden(h, dager))
    .filter((h) => !type || h.type === type || (type === "svinn" && h.type === "mulig_svinn"))
    .filter((h) => !hylle || h.hylle === hylle)
    .filter((h) => !q || `${h.sku} ${vare(s, h.sku)?.navn ?? ""} ${h.ref ?? ""} ${h.aarsak}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.tid.localeCompare(a.tid));
  const sum = rader.reduce((n, h) => n + h.endring, 0);

  return (
    <>
      <Topp tittel="Hendelser" under="Lagerloggen er sannheten: beholdningen er summen av alle hendelsene.">
        <PeriodeVelger valgt={dager} lag={(d) => lenke({ dager: String(d) })} />
        <a href={`/api/rapport?format=csv&hva=hendelser&dager=${dager}`} className="rounded-lg border border-kant bg-kort px-3.5 py-2 text-[13.5px] font-semibold hover:border-tekst">Last ned CSV</a>
      </Topp>
      <Innhold>
        <div className="flex flex-wrap items-center gap-3">
          <Filter valg={TYPER} valgt={type} lag={(id) => lenke({ type: id })} />
          <form action="/logg" className="ml-auto flex items-center gap-2">
            {type && <input type="hidden" name="type" value={type} />}
            {dager ? <input type="hidden" name="dager" value={dager} /> : null}
            <label className="flex h-9 items-center gap-2 rounded-lg border border-kant bg-kort px-2.5">
              <Ikon navn="sok" size={15} className="text-dempet" />
              <input name="q" defaultValue={q} placeholder="Vare, SKU eller ref" aria-label="Søk i hendelser" className="w-44 bg-transparent text-[13.5px] outline-none" />
            </label>
            <select name="hylle" defaultValue={hylle} aria-label="Lokasjon" className="h-9 rounded-lg border border-kant bg-kort px-2 text-[13.5px]">
              <option value="">Alle lokasjoner</option>
              {s.hyller.map((h) => <option key={h.id} value={h.id}>{h.id}</option>)}
            </select>
            <button className="h-9 rounded-lg bg-tekst px-3 text-[13px] font-semibold text-bg">Filtrer</button>
          </form>
        </div>
        <Panel
          tittel={`${rader.length} hendelse${rader.length === 1 ? "" : "r"}`}
          handling={<span className="font-mono text-[12px] text-dempet">Netto {fortegn(sum)} stk</span>}
        >
          <Tabell hode={["Tid", "Type", "Lokasjon", "Vare", "Endring", "Årsak", "Ref", "Avvik"]} hoyre={[4]}>
            {rader.slice(0, MAKS).map((h) => (
              <tr key={h.id} className={h.type === "mulig_svinn" && h.avvik?.status === "apen" ? "bg-rodlys" : ""}>
                <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{kortDato(h.tid)} {klokke(h.tid)}</td>
                <td><TypeChip type={h.type} /></td>
                <td className="font-semibold">{h.hylle}</td>
                <td><Link href={`/varer/${encodeURIComponent(h.sku)}`} className="hover:underline">{vare(s, h.sku)?.navn ?? h.sku}</Link></td>
                <td className={`text-right font-mono font-medium ${typeFarge(h.type, h.endring)}`}>{fortegn(h.endring)}</td>
                <td className="text-[12.5px]">{h.aarsak}</td>
                <td className="font-mono text-[12px] text-dempet">{h.ref ?? ""}</td>
                <td>{h.avvik ? <Link href={`/avvik/${h.id}`}><AvvikChip status={h.avvik.status} /></Link> : null}</td>
              </tr>
            ))}
            {rader.length === 0 && <TomRad kolonner={8}>Ingen hendelser passer filteret.</TomRad>}
          </Tabell>
          {rader.length > MAKS && <p className="border-t border-kant px-4 py-2.5 text-[12.5px] text-dempet">Viser de {MAKS} nyeste. Last ned CSV for alle.</p>}
        </Panel>
      </Innhold>
    </>
  );
}
