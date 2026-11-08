import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { aktiveForesporsler, nyForesporsel } from "@/lib/strekkode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET → ventende forespørsler om å skanne strekkode (skannerappen spør her).
export async function GET() {
  return NextResponse.json({ foresporsler: aktiveForesporsler(await hentState()) });
}

// POST { sku } → dashboardet ber skanneren skanne strekkoden til varen.
// POST { navn } → samme for en vare som ikke er lagret ennå; skjemaet henter koden fra svaret.
export async function POST(req: Request) {
  const { sku, navn } = (await req.json().catch(() => ({}))) as { sku?: string; navn?: string };
  try {
    return NextResponse.json(await endreState((s) => nyForesporsel(s, sku || undefined, navn)));
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
