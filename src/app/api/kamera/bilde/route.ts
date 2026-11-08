import { NextResponse } from "next/server";
import { tellOgLagre } from "@/lib/kameratelling";
import { KameraBildeSkjema } from "@/lib/skjema";
import { begrens, demomodus, lesJson } from "@/lib/vern";

export const runtime = "nodejs";
export const maxDuration = 60;

// Kameratelefonen sender et bilde hit. Telles og lagres med en gang hvis noe har endret seg.
export async function POST(req: Request) {
  const stopp = begrens(req, "ai");
  if (stopp) return stopp;
  const b = await lesJson(req, KameraBildeSkjema);
  if ("svar" in b) return b.svar;
  const { kameraId, hylle, bilde, liten } = b.data;
  const demo = demomodus() && b.data.demo;
  try {
    return NextResponse.json(await tellOgLagre({ kameraId, hylle, bilde, liten, demo }));
  } catch (e) {
    console.error("Kameratelling feilet", e);
    const feil = e instanceof Error ? e.message : "Tellingen feilet";
    return NextResponse.json({ feil }, { status: feil.startsWith("Ukjent hylle") ? 404 : 502 });
  }
}
