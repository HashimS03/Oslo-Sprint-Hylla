import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { sporHylla, type ChatMelding } from "@/lib/spor";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { historikk } = (await req.json()) as { historikk: ChatMelding[] };
  try {
    const svar = await sporHylla(await hentState(), historikk.slice(-12));
    return NextResponse.json(svar);
  } catch (e) {
    console.error("Spør Hylla feilet", e);
    return NextResponse.json({ feil: "Hylla klarte ikke å svare akkurat nå." }, { status: 502 });
  }
}
