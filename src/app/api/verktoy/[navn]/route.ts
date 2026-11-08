import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { kjorVerktoy } from "@/lib/verktoy";
import { likeHemmeligheter } from "@/lib/vern";

export const runtime = "nodejs";

// Webhook-verktøy for ElevenLabs-agenten: POST /api/verktoy/hent_beholdning med JSON-body.
// Sett samme hemmelighet i ElevenLabs (header x-hylla-secret) og i HYLLA_WEBHOOK_SECRET.
// Uten HYLLA_WEBHOOK_SECRET er ruten stengt.
export async function POST(req: Request, { params }: { params: Promise<{ navn: string }> }) {
  const secret = process.env.HYLLA_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ feil: "Webhook er ikke satt opp (mangler HYLLA_WEBHOOK_SECRET)" }, { status: 503 });
  }
  if (!likeHemmeligheter(req.headers.get("x-hylla-secret") ?? "", secret)) {
    return NextResponse.json({ feil: "Ikke tilgang" }, { status: 401 });
  }
  const { navn } = await params;
  const input = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { resultat } = kjorVerktoy(await hentState(), navn, input ?? {});
  return NextResponse.json(resultat);
}
