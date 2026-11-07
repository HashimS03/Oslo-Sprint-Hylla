import { NextResponse } from "next/server";
import { tellOgLagre } from "@/lib/kameratelling";

export const runtime = "nodejs";
export const maxDuration = 60;

// Kameratelefonen sender et bilde hit. Telles og lagres med en gang hvis noe har endret seg.
export async function POST(req: Request) {
  const { kameraId, hylle, bilde, liten, demo } = (await req.json()) as { kameraId: string; hylle: string; bilde: string; liten?: string; demo?: boolean };
  try {
    return NextResponse.json(await tellOgLagre({ kameraId, hylle, bilde, liten, demo }));
  } catch (e) {
    console.error("Kameratelling feilet", e);
    const feil = e instanceof Error ? e.message : "Tellingen feilet";
    return NextResponse.json({ feil }, { status: feil.startsWith("Ukjent hylle") ? 404 : 502 });
  }
}
