import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { kjorVerktoy } from "@/lib/verktoy";
import { likeTrygt, pin } from "@/lib/tilgang";

export const runtime = "nodejs";

// Webhook-verktøy for ElevenLabs-agenten: POST /api/verktoy/hent_beholdning med JSON-body.
// Sett samme hemmelighet i ElevenLabs (header x-hylla-secret) og i HYLLA_WEBHOOK_SECRET.
// Uten HYLLA_WEBHOOK_SECRET kreves PIN-en (HYLLA_PIN) i samme header. Bare når ingen av dem er satt
// (lokal utvikling) er verktøyene åpne.
export async function POST(req: Request, { params }: { params: Promise<{ navn: string }> }) {
  const secret = process.env.HYLLA_WEBHOOK_SECRET || pin();
  if (secret && !likeTrygt(req.headers.get("x-hylla-secret") ?? "", secret)) {
    return NextResponse.json({ feil: "Ikke tilgang" }, { status: 401 });
  }
  const { navn } = await params;
  const input = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { resultat } = kjorVerktoy(await hentState(), navn, input);
  return NextResponse.json(resultat);
}
