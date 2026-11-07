import { hentState } from "@/lib/store";
import { Skanner } from "./Skanner";

export const dynamic = "force-dynamic";

// Generell skanner (simulator for en Zebra): skanner en vare, ikke en hylle.
// Varene er de som ligger i en kamerasone, siden det er dem kameraet kontrollerer.
export default async function Side() {
  const s = await hentState();
  const skuer = [...new Set(s.hyller.filter((h) => h.sone && h.sone.type !== "gang").flatMap((h) => h.innhold.map((p) => p.sku)))];
  const varer = skuer.map((sku) => ({ sku, navn: s.varer.find((v) => v.sku === sku)?.navn ?? sku }));
  return <Skanner varer={varer} />;
}
