import { NextResponse } from "next/server";
import { behandleTakbilde, hentKameraHendelser } from "@/lib/soner";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Takkamera: ett bilde som viser flere soner (hyller og gang). Sonene ligger på Hylle.sone (se seed).
// POST { kameraId, bilde, liten?, demo?, tving?, sone? } (sone: en telefon som bare følger med på én sone, hele bildet er sonen) → ett resultat per sone med funn og nye kamerahendelser.
export async function POST(req: Request) {
  const { kameraId, bilde, liten, demo, tving, demoTall, sone } = (await req.json()) as {
    kameraId: string; bilde: string; liten?: string; demo?: boolean; tving?: boolean; demoTall?: Record<string, Record<string, number>>; sone?: string;
  };
  if (!kameraId || !bilde) return NextResponse.json({ feil: "kameraId og bilde må være med" }, { status: 400 });
  try {
    return NextResponse.json(await behandleTakbilde({ kameraId, bilde, liten, demo, tving, demoTall, kunSone: sone }));
  } catch (e) {
    console.error("Takkamera feilet", e);
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 502 });
  }
}

// GET ?etter=<ISO>&sone=H1 → kamerahendelser som matcheren leser (uttak, plassering, gjenglemt).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const hendelser = await hentKameraHendelser({ etter: u.searchParams.get("etter") ?? undefined, sone: u.searchParams.get("sone") ?? undefined });
  return NextResponse.json({ hendelser });
}
