import Link from "next/link";
import { hentState } from "@/lib/store";
import { beholdning, totalBeholdning } from "@/lib/lager";
import { Side } from "@/components/Nav";
import { Ikon } from "@/components/ui";
import { VareSok } from "./VareSok";

export const dynamic = "force-dynamic";

export default async function Varer() {
  const s = await hentState();
  const varer = s.varer.map((v) => ({
    sku: v.sku,
    navn: v.navn,
    swatch: v.swatch,
    hylle: s.hyller.filter((h) => h.innhold.some((i) => i.sku === v.sku)).map((h) => h.id).join(", "),
    antall: beholdning(s, v.sku),
  }));
  return (
    <Side>
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <h1 className="display text-[26px]">Varer</h1>
        <span className="font-mono text-xs text-dempet">{s.varer.length} varer · {totalBeholdning(s)} stk</span>
      </header>
      <main className="flex flex-1 flex-col gap-3 px-5 pt-1 pb-3">
        <VareSok varer={varer} />
      </main>
      <div className="px-5 pb-3">
        <Link href="/varer/ny" className="knapp-gul"><Ikon navn="pluss" size={18} />Legg til produkt</Link>
      </div>
    </Side>
  );
}
