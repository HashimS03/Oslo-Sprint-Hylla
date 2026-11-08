import { NextResponse } from "next/server";
import { ferdigTelt, vurder } from "@/lib/ramme";
import { tellOgLagre } from "@/lib/kameratelling";
import { KameraBildeSkjema } from "@/lib/skjema";
import { begrens, demomodus, lesJson } from "@/lib/vern";

export const runtime = "nodejs";
export const maxDuration = 60;

// Live-modus: kameratelefonen sender et bilde hvert par sekund. Vi teller bare når noe har endret seg
// og bildet har roet seg, og lagrer endringene i loggen med en gang.
export async function POST(req: Request) {
  const stopp = begrens(req, "kamera");
  if (stopp) return stopp;
  const b = await lesJson(req, KameraBildeSkjema);
  if ("svar" in b) return b.svar;
  const { kameraId, hylle, bilde, liten, tving } = b.data;
  const demo = demomodus() && b.data.demo;
  const v = await vurder(kameraId, bilde, tving);
  const mal = { bevegelse: v.bevegelse, endring: v.endring };
  if (!v.skalTelle) return NextResponse.json({ status: v.status, ...mal });
  // Bare bilder som faktisk telles, går til den betalte AI-tjenesten. De teller mot AI-grensen.
  const aiStopp = begrens(req, "ai");
  if (aiStopp) {
    await ferdigTelt(kameraId, bilde, false);
    return aiStopp;
  }
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
