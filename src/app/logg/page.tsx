import Link from "next/link";
import { hentState } from "@/lib/store";
import { vare } from "@/lib/lager";
import { dagNokkel, dagTittel, fortegn, klokke, typeFarge } from "@/lib/format";
import { Side } from "@/components/Nav";

export const dynamic = "force-dynamic";

const FILTER = [
  { id: "", navn: "Alle" },
  { id: "mottak", navn: "Mottak" },
  { id: "plukk", navn: "Plukk" },
  { id: "mulig_svinn", navn: "Svinn" },
];

export default async function Logg({ searchParams }: { searchParams: Promise<{ type?: string; lagret?: string }> }) {
  const { type = "", lagret } = await searchParams;
  const s = await hentState();
  const svinnTyper = ["mulig_svinn", "svinn"];
  const alle = [...s.hendelser].sort((a, b) => b.tid.localeCompare(a.tid));
  const rader = alle.filter((h) => !type || h.type === type || (type === "mulig_svinn" && svinnTyper.includes(h.type)));
  const antallSvinn = alle.filter((h) => h.type === "mulig_svinn" && h.avvik?.status === "apen").length;
  const dager = new Map<string, typeof rader>();
  for (const h of rader) {
    const k = dagNokkel(h.tid);
    dager.set(k, [...(dager.get(k) ?? []), h]);
  }

  return (
    <Side>
      <header className="flex flex-col gap-3 px-5 pt-5 pb-2">
        <h1 className="display text-[26px]">Lagerlogg</h1>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTER.map((f) => {
            const aktiv = f.id === type;
            const svinn = f.id === "mulig_svinn";
            return (
              <Link
                key={f.id}
                href={f.id ? `/logg?type=${f.id}` : "/logg"}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] ${aktiv ? "bg-tekst font-semibold text-bg" : svinn ? "border border-rodkant bg-white text-rod" : "border border-kant bg-white"}`}
              >
                {f.navn}{svinn && antallSvinn ? ` · ${antallSvinn}` : ""}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-2 px-5 pt-1 pb-4">
        {lagret && <div className="rounded-xl bg-gronnlys px-3 py-2.5 text-[13px] text-gronn">Tellingen er lagret i loggen.</div>}
        {[...dager.entries()].map(([dag, liste]) => (
          <section key={dag} className="flex flex-col gap-2">
            <span className="etikett mt-1.5">{dagTittel(liste[0].tid)}</span>
            <div className="kort overflow-hidden">
              {liste.map((h, i) => {
                const apen = h.type === "mulig_svinn" && h.avvik?.status === "apen";
                const href = h.type === "mulig_svinn" || h.type === "svinn" ? `/avvik/${h.id}` : `/varer/${h.sku}`;
                return (
                  <Link key={h.id} href={href} className={`flex items-center gap-2.5 px-3 py-[11px] ${i ? "border-t border-kant" : ""} ${apen ? "bg-rodlys" : ""}`}>
                    <span className="w-9 font-mono text-[11px] text-dempet">{klokke(h.tid)}</span>
                    <span className="flex-1 text-[13px]">
                      <b className="font-semibold">{h.hylle} · {vare(s, h.sku)?.navn ?? h.sku}</b>
                      <br />
                      <span className="text-[11.5px] text-dempet">{h.aarsak}</span>
                    </span>
                    <span className={`font-mono text-xs font-medium ${typeFarge(h.type, h.endring)}`}>{fortegn(h.endring)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {rader.length === 0 && <p className="py-10 text-center text-sm text-dempet">Ingen hendelser her ennå.</p>}
      </main>
    </Side>
  );
}
