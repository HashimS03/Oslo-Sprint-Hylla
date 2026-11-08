import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { lagDemoOrdrer } from "@/lib/bestillinger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST → legger inn noen tilfeldige bestillinger til demoen. De dukker opp som pakkeoppgaver i appen.
export async function POST() {
  const ordrer = await endreState((s) => lagDemoOrdrer(s, 3));
  if (!ordrer.length) return NextResponse.json({ feil: "Fant ingen varer på lager uten åpen bestilling" }, { status: 400 });
  return NextResponse.json({ ordrer });
}
