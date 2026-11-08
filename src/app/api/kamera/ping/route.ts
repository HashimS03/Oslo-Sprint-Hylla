import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { KameraPingSkjema } from "@/lib/skjema";
import { lesJson } from "@/lib/vern";

export const runtime = "nodejs";

/** Øvre grense, så ingen kan fylle databasen med falske kameraer. */
const MAKS_KAMERAER = 50;

// Kameratelefonen melder at den lever (og kobler seg til en hylle første gang).
export async function POST(req: Request) {
  const b = await lesJson(req, KameraPingSkjema);
  if ("svar" in b) return b.svar;
  const { kameraId, navn, hylle, lader, batteri } = b.data;
  try {
    const kamera = await endreState((s) => {
      let k = s.kameraer.find((x) => x.id === kameraId);
      if (!k) {
        if (s.kameraer.length >= MAKS_KAMERAER) throw new Error("Det er for mange kameraer. Fjern noen først.");
        k = { id: kameraId, navn: navn ?? `${hylle} · kameratelefon`, hylle, sistSett: new Date().toISOString(), bilderIdag: 0 };
        s.kameraer.push(k);
      }
      k.hylle = hylle;
      k.sistSett = new Date().toISOString();
      if (lader !== undefined) k.lader = lader;
      if (batteri !== undefined) k.batteri = batteri;
      return k;
    });
    return NextResponse.json({ kamera });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
