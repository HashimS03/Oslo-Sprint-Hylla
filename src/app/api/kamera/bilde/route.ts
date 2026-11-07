import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { lagForslag, lagreForslag } from "@/lib/lager";
import { velgTeller } from "@/lib/teller";

export const runtime = "nodejs";
export const maxDuration = 60;

// Kameratelefonen sender et bilde hit. Telles og lagres med en gang hvis noe har endret seg.
export async function POST(req: Request) {
  const { kameraId, hylle: hylleId, bilde, liten, demo } = (await req.json()) as { kameraId: string; hylle: string; bilde: string; liten?: string; demo?: boolean };
  const state = await hentState();
  const hylle = state.hyller.find((h) => h.id === hylleId);
  if (!hylle) return NextResponse.json({ feil: `Ukjent hylle ${hylleId}` }, { status: 404 });
  const teller = velgTeller(!!demo);
  const start = Date.now();
  try {
    const resultat = await teller.tell({ state, hylle, bilde });
    const res = await endreState((s) => {
      const forslag = lagForslag(s, hylle.id, resultat, teller.navn, (Date.now() - start) / 1000);
      const kam = s.kameraer.find((k) => k.id === kameraId);
      if (kam) {
        kam.sistSett = new Date().toISOString();
        kam.bilderIdag += 1;
        kam.sisteBilde = liten;
      }
      const endret = forslag.endringer.some((e) => e.deler.length > 0);
      const lagret = lagreForslag(s, forslag, { kilde: "kamera", bilde: liten });
      return { forslag, lagret, endret };
    });
    return NextResponse.json(res);
  } catch (e) {
    console.error("Kameratelling feilet", e);
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Tellingen feilet" }, { status: 502 });
  }
}
