import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { kjorMatcher } from "@/lib/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Skanneren spør om varsler: GET ?etter=<ISO> → nye avvik med melding (pip + tekst).
export async function GET(req: Request) {
  await kjorMatcher();
  const etter = new URL(req.url).searchParams.get("etter") ?? "";
  const s = await hentState();
  const varsler = (s.matcherAvvik ?? []).filter((a) => a.varsel && a.tid > etter).map((a) => ({ id: a.id, tid: a.tid, melding: a.varsel!.melding, type: a.type }));
  return NextResponse.json({ varsler, na: new Date().toISOString() });
}
