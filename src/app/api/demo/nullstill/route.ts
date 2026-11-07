import { NextResponse } from "next/server";
import { nullstill } from "@/lib/store";
import { pinAktiv } from "@/lib/tilgang";

export const runtime = "nodejs";

/**
 * POST {} gir demodataene tilbake. POST { "tom": true } tømmer lageret helt.
 * På en offentlig deploy (Vercel produksjon) krever dette at HYLLA_PIN er satt, så ikke hvem som helst
 * kan slette lageret. Selve PIN-sjekken skjer i middleware.
 */
export async function POST(req: Request) {
  if (process.env.VERCEL_ENV === "production" && !pinAktiv()) {
    return NextResponse.json(
      { feil: "Nullstilling er skrudd av på den offentlige appen til HYLLA_PIN er satt i Vercel." },
      { status: 403 },
    );
  }
  const b = (await req.json().catch(() => ({}))) as { tom?: unknown };
  const tom = b.tom === true;
  await nullstill(tom);
  return NextResponse.json({ ok: true, tom });
}
