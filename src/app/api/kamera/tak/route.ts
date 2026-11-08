import { NextResponse } from "next/server";
import { behandleTakbilde, hentKameraHendelser } from "@/lib/soner";
import { TakbildeSkjema } from "@/lib/skjema";
import { begrens, demomodus, lesJson } from "@/lib/vern";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Takkamera: ett bilde som viser flere soner (hyller og gang). Sonene ligger på Hylle.sone (se seed).
// POST { kameraId, bilde, liten?, demo?, tving?, sone? } (sone: en telefon som bare følger med på én sone, hele bildet er sonen) → ett resultat per sone med funn og nye kamerahendelser.
// demo og demoTall (tall klienten oppgir selv) virker bare i demomodus, så ingen kan skrive inn falske tellinger.
export async function POST(req: Request) {
  const stopp = begrens(req, "kamera");
  if (stopp) return stopp;
  const b = await lesJson(req, TakbildeSkjema);
  if ("svar" in b) return b.svar;
  const { kameraId, bilde, liten, tving, sone } = b.data;
  const demo = demomodus() && b.data.demo;
  const demoTall = demomodus() ? b.data.demoTall : undefined;
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
