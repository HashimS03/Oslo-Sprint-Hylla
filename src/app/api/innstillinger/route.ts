import { NextResponse } from "next/server";
import { endreState, hentState, lagringstype } from "@/lib/store";
import type { Innstillinger } from "@/lib/types";
import { InnstillingerSkjema } from "@/lib/skjema";
import { lesJson } from "@/lib/vern";

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
  const b = await lesJson(req, InnstillingerSkjema);
  if ("svar" in b) return b.svar;
  const endring: Partial<Innstillinger> = b.data;
  const innstillinger = await endreState((s) => {
    s.innstillinger = { ...s.innstillinger, ...endring };
    return s.innstillinger;
  });
  return NextResponse.json({ innstillinger });
}
