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
export async function POST(req: Request) {
  const { sku } = (await req.json().catch(() => ({}))) as { sku?: string };
  if (!sku) return NextResponse.json({ feil: "sku må være med" }, { status: 400 });
  try {
    return NextResponse.json(await endreState((s) => nyForesporsel(s, sku)));
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
