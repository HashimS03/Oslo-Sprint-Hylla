import { hentState } from "@/lib/store";
import { NyttProduktSkjema } from "./NyttProduktSkjema";

export const dynamic = "force-dynamic";

export default async function NyttProdukt() {
  const s = await hentState();
  return <NyttProduktSkjema hyller={s.hyller.map((h) => h.id)} />;
}
