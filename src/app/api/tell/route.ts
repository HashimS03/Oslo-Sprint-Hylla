import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { lagForslag } from "@/lib/lager";
import { velgTeller } from "@/lib/teller";
import { TellSkjema } from "@/lib/skjema";
import { begrens, demomodus, lesJson } from "@/lib/vern";

export const runtime = "nodejs";
export const maxDuration = 60;

// Teller en hylle fra et bilde og returnerer et forslag. Ingenting lagres før /api/tell/lagre.
export async function POST(req: Request) {
  const stopp = begrens(req, "ai");
  if (stopp) return stopp;
  const b = await lesJson(req, TellSkjema);
  if ("svar" in b) return b.svar;
  const { hylle: hylleId, bilde } = b.data;
  const demo = demomodus() && b.data.demo;
  const state = await hentState();
  const hylle = state.hyller.find((h) => h.id === hylleId);
  if (!hylle) return NextResponse.json({ feil: `Ukjent hylle ${hylleId}` }, { status: 404 });
  if (!bilde && !demo) return NextResponse.json({ feil: "Mangler bilde" }, { status: 400 });

  const teller = velgTeller(demo || !bilde);
  const start = Date.now();
  try {
    const resultat = await teller.tell({ state, hylle, bilde: bilde ?? "" });
    const forslag = lagForslag(state, hylle.id, resultat, teller.navn, Math.round((Date.now() - start) / 100) / 10);
    return NextResponse.json({ forslag });
  } catch (e) {
    console.error("Telling feilet", e);
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Tellingen feilet" }, { status: 502 });
  }
}
