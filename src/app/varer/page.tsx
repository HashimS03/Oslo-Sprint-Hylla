import Link from "next/link";
import { hentState } from "@/lib/store";
import { apneAvvik, beholdning, totalBeholdning } from "@/lib/lager";
import { LAV_BEHOLDNING } from "@/lib/rapport";
import { Innhold, Topp } from "@/components/dash";
import { Ikon } from "@/components/ui";
import { VareSok } from "./VareSok";

export const dynamic = "force-dynamic";

export default async function Varer({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const s = await hentState();
  const avvik = apneAvvik(s);
  const varer = s.varer.map((v) => {
    const antall = beholdning(s, v.sku);
    return {
      sku: v.sku,
      navn: v.navn,
      swatch: v.swatch,
      variant: [v.farge, v.storrelse].filter(Boolean).join(" · "),
      leverandor: v.leverandor ?? "",
      hylle: s.hyller.filter((h) => h.innhold.some((i) => i.sku === v.sku) || beholdning(s, v.sku, h.id) > 0).map((h) => h.id).join(", "),
      antall,
      apneSalg: s.ordrer.filter((o) => o.sku === v.sku && o.status === "apen").reduce((n, o) => n + o.antall, 0),
      avvik: avvik.filter((a) => a.sku === v.sku).reduce((n, a) => n - a.endring, 0),
      lav: antall <= LAV_BEHOLDNING,
    };
  });
  return (
    <>
      <Topp tittel="Varer" under={`${s.varer.length} varetyper · ${totalBeholdning(s)} stk på lager`}>
        <Link href="/varer/ny" className="knapp-gul !h-10 !w-auto !rounded-lg !border-2 px-4 !text-[14px]"><Ikon navn="pluss" size={16} />Ny vare</Link>
      </Topp>
      <Innhold>
        <VareSok varer={varer} startStatus={["lav", "avvik"].includes(status) ? status : ""} />
      </Innhold>
    </>
  );
}
