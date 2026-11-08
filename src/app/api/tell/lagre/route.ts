import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { lagreForslag } from "@/lib/lager";
import { TellLagreSkjema } from "@/lib/skjema";
import { lesJson } from "@/lib/vern";

export const runtime = "nodejs";

// Lagrer en godkjent telling. Fra klienten brukes bare hylla, tallene og hvilken teller som telte.
// Forklaringene (plukk, mottak, mulig svinn) regner serveren ut på nytt fra loggen.
export async function POST(req: Request) {
  const b = await lesJson(req, TellLagreSkjema);
  if ("svar" in b) return b.svar;
  const { forslag, korrigert, bilde, kilde } = b.data;

  try {
    const res = await endreState((s) => {
      const hylle = s.hyller.find((h) => h.id === forslag.hylle);
      if (!hylle) throw new Error(`Ukjent hylle ${forslag.hylle}`);
      const lovlige = new Set(hylle.innhold.map((i) => i.sku));
      for (const sku of [...Object.keys(forslag.antall), ...Object.keys(korrigert ?? {})]) {
        if (!lovlige.has(sku)) throw new Error(`${sku} ligger ikke på hylle ${hylle.id}`);
      }
      const forrigeTellingId = s.tellinger.some((t) => t.id === forslag.forrigeTellingId) ? forslag.forrigeTellingId : undefined;
      return lagreForslag(s, { ...forslag, forrigeTellingId }, { kilde: kilde ?? "mobil", bilde, korrigert });
    });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Kunne ikke lagre" }, { status: 400 });
  }
}
