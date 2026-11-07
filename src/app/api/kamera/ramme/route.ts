import { NextResponse } from "next/server";
import { ferdigTelt, vurder } from "@/lib/ramme";
import { tellOgLagre } from "@/lib/kameratelling";

export const runtime = "nodejs";
export const maxDuration = 60;

// Live-modus: kameratelefonen sender et bilde hvert par sekund. Vi teller bare når noe har endret seg
// og bildet har roet seg, og lagrer endringene i loggen med en gang.
export async function POST(req: Request) {
  const { kameraId, hylle, bilde, liten, demo, tving } = (await req.json()) as {
    kameraId: string; hylle: string; bilde: string; liten?: string; demo?: boolean; tving?: boolean;
  };
  const v = await vurder(kameraId, bilde, tving);
  const mal = { bevegelse: v.bevegelse, endring: v.endring };
  if (!v.skalTelle) return NextResponse.json({ status: v.status, ...mal });
  try {
    const res = await tellOgLagre({ kameraId, hylle, bilde, liten, demo });
    await ferdigTelt(kameraId, bilde, true);
    return NextResponse.json({ status: "talt", ...mal, ...res });
  } catch (e) {
    console.error("Kameratelling feilet", e);
    await ferdigTelt(kameraId, bilde, false);
    return NextResponse.json({ status: "feil", ...mal, feil: e instanceof Error ? e.message : "Tellingen feilet" }, { status: 502 });
  }
}
