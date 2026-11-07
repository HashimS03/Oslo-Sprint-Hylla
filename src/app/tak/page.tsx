import { hentState } from "@/lib/store";
import { TakTest } from "./TakTest";

export const dynamic = "force-dynamic";

// Testside for takkamera: viser kamerabildet med sonene lagt over, og hva kameraet melder per sone.
export default async function Tak({ searchParams }: { searchParams: Promise<{ kamera?: string }> }) {
  const { kamera = "kam_tak" } = await searchParams;
  const s = await hentState();
  const soner = s.hyller
    .filter((h) => h.sone?.kamera === kamera)
    .map((h) => ({ id: h.id, navn: h.navn, sone: h.sone!, skuer: h.innhold.map((p) => p.sku), varer: h.innhold.map((p) => s.varer.find((v) => v.sku === p.sku)?.navn ?? p.sku) }));
  const katalog = s.varer.map((v) => ({ sku: v.sku, navn: v.navn }));
  return <TakTest kameraId={kamera} soner={soner} katalog={katalog} />;
}
