import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { sporHylla } from "@/lib/spor";
import { MAKS_SPORSMAL, ryddHistorikk } from "@/lib/validering";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { historikk?: unknown } | null;
  const historikk = ryddHistorikk(body?.historikk);
  if (!historikk) {
    return NextResponse.json({ feil: `Spørsmålet må være tekst på høyst ${MAKS_SPORSMAL} tegn.` }, { status: 400 });
  }
  try {
    const svar = await sporHylla(await hentState(), historikk);
    return NextResponse.json(svar);
  } catch (e) {
    console.error("Spør Hylla feilet", e);
    return NextResponse.json({ feil: "Hylla klarte ikke å svare akkurat nå." }, { status: 502 });
  }
}
