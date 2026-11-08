import { NextResponse } from "next/server";
import { finnEnhet, kreverKobling, nokkelFra } from "@/lib/enheter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Forteller appen om denne enheten er koblet til. Er åpen, så appen kan spørre før den er koblet.
export async function GET(req: Request) {
  const enhet = await finnEnhet(nokkelFra(req));
  return NextResponse.json({
    kreverKobling: kreverKobling(),
    koblet: !!enhet,
    enhet: enhet ? { id: enhet.id, navn: enhet.navn } : undefined,
  });
}
