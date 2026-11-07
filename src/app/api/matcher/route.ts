import { NextResponse } from "next/server";
import { matcherOversikt } from "@/lib/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dashboard for driftsleder: avvik, nøkkeltall, tell-liste og lagerkart.
export async function GET() {
  return NextResponse.json(await matcherOversikt());
}
