import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { meldAvvik, type AvvikMelding } from "@/lib/oppgaver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * En ansatt melder avvik fra scannerappen.
 * Body: { sku, hylle?, grunn: "mangler" | "skadet" | "feil_plass" | "annet", antall?, notat?, meldtAv? }
 * Blir en mulig_svinn-hendelse med åpent avvik. Den vises i dashbordet, ikke i appen.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as AvvikMelding;
  try {
    const h = await endreState((s) => meldAvvik(s, b));
    return NextResponse.json({ ok: true, id: h.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
