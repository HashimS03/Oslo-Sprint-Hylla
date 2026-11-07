import { hentState } from "@/lib/store";
import { NyttProduktSkjema } from "./NyttProduktSkjema";

export const dynamic = "force-dynamic";

export default async function NyttProdukt() {
  const s = await hentState();
  return (
    <div className="w-full max-w-[640px] lg:px-3 lg:pt-4">
      <NyttProduktSkjema hyller={s.hyller.map((h) => h.id)} />
    </div>
  );
}
