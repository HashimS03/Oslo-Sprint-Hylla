import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { lagForslag } from "@/lib/lager";
import { claudeTeller, velgTeller } from "@/lib/teller";

export const runtime = "nodejs";
export const maxDuration = 60;

// Teller en hylle fra et bilde og returnerer et forslag. Ingenting lagres før /api/tell/lagre.
export async function POST(req: Request) {
  const { hylle: hylleId, bilde, demo } = (await req.json()) as { hylle: string; bilde?: string; demo?: boolean };
  const state = await hentState();
  const hylle = state.hyller.find((h) => h.id === hylleId);
  if (!hylle) return NextResponse.json({ feil: `Ukjent hylle ${hylleId}` }, { status: 404 });
  if (!bilde && !demo) return NextResponse.json({ feil: "Mangler bilde" }, { status: 400 });

  let teller = velgTeller(demo || !bilde);
  const start = Date.now();
  try {
    let resultat;
    try {
      resultat = await teller.tell({ state, hylle, bilde: bilde ?? "" });
    } catch (e) {
      // Reserve: hvis SAM 3- eller YOLO-tjenesten er nede eller treg, teller Claude i stedet.
      const harClaude = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
      if ((teller.navn !== "sam3" && teller.navn !== "yolo") || !harClaude || !bilde) throw e;
      console.error(`${teller.navn} feilet, bruker Claude:`, e);
      teller = claudeTeller;
      resultat = await teller.tell({ state, hylle, bilde });
    }
    const forslag = lagForslag(state, hylle.id, resultat, teller.navn, Math.round((Date.now() - start) / 100) / 10);
    return NextResponse.json({ forslag });
  } catch (e) {
    console.error("Telling feilet", e);
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Tellingen feilet" }, { status: 502 });
  }
}
