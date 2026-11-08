import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { sporHylla } from "@/lib/spor";
import { SporSkjema } from "@/lib/skjema";
import { begrens, lesJson } from "@/lib/vern";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const stopp = begrens(req, "ai");
  if (stopp) return stopp;
  const b = await lesJson(req, SporSkjema);
  if ("svar" in b) return b.svar;
  try {
    const svar = await sporHylla(await hentState(), b.data.historikk.slice(-12));
    return NextResponse.json(svar);
  } catch (e) {
    console.error("Spør Hylla feilet", e);
    return NextResponse.json({ feil: "Hylla klarte ikke å svare akkurat nå." }, { status: 502 });
  }
}
