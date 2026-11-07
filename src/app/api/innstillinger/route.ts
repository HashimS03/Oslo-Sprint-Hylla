import { NextResponse } from "next/server";
import { endreState, hentState, lagringstype } from "@/lib/store";
import type { Innstillinger } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await hentState();
  return NextResponse.json({
    innstillinger: s.innstillinger,
    reoler: new Set(s.hyller.map((h) => h.reol)).size,
    hyller: s.hyller.length,
    teller: process.env.HYLLA_TELLER ?? (process.env.SAM3_URL ? "sam3" : process.env.ANTHROPIC_API_KEY ? "claude" : process.env.YOLO_URL ? "yolo" : "demo"),
    stemme: process.env.ELEVENLABS_API_KEY ? "ElevenLabs" : "telefonen",
    lagring: lagringstype(),
  });
}

export async function POST(req: Request) {
  const endring = (await req.json()) as Partial<Innstillinger>;
  const innstillinger = await endreState((s) => {
    s.innstillinger = { ...s.innstillinger, ...endring };
    return s.innstillinger;
  });
  return NextResponse.json({ innstillinger });
}
