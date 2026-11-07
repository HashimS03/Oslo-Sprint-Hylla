import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";

export const runtime = "nodejs";

// Kameratelefonen melder at den lever (og kobler seg til en hylle første gang).
export async function POST(req: Request) {
  const { kameraId, navn, hylle, lader, batteri } = (await req.json()) as {
    kameraId: string; navn?: string; hylle: string; lader?: boolean; batteri?: number;
  };
  const kamera = await endreState((s) => {
    let k = s.kameraer.find((x) => x.id === kameraId);
    if (!k) {
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
}
