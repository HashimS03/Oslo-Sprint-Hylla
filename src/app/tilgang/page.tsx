import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, harTilgang, pinAktiv } from "@/lib/tilgang";
import { PinSkjema } from "./PinSkjema";

export const dynamic = "force-dynamic";

/** Bare interne stier er lov som «neste», så lenken ikke kan sende brukeren til en annen side. */
function tryggNeste(neste?: string): string {
  return neste && neste.startsWith("/") && !neste.startsWith("//") ? neste : "/";
}

export default async function Tilgang({ searchParams }: { searchParams: Promise<{ neste?: string }> }) {
  const neste = tryggNeste((await searchParams).neste);
  // Allerede låst opp på denne enheten (eller ingen PIN satt): gå rett videre.
  if (!pinAktiv() || (await harTilgang(await headers(), (await cookies()).get(COOKIE)?.value))) redirect(neste);
  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-14 pb-8">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-dempet">HYLLA</span>
        <h1 className="display text-[32px]">Skriv inn PIN-koden</h1>
        <p className="text-[15px] text-dempet">Lageret er låst. Spør den som satte opp Hylla om koden. Du trenger den bare én gang på denne enheten.</p>
      </div>
      <PinSkjema neste={neste} />
    </div>
  );
}
