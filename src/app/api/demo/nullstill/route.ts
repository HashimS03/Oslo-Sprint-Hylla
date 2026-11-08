import { NextResponse } from "next/server";
import { nullstill } from "@/lib/store";
import { demomodus } from "@/lib/vern";

export const runtime = "nodejs";

/**
 * POST {} gir demodataene tilbake. POST { "tom": true } tømmer lageret helt.
 * Begge sletter dataene, så de er av på Vercel. Sett HYLLA_DEMOMODUS=1 der for å slå dem på (f.eks. under en demo).
 */
export async function POST(req: Request) {
  if (!demomodus()) {
    return NextResponse.json({ feil: "Nullstilling er slått av på denne serveren (sett HYLLA_DEMOMODUS=1 for å slå den på)." }, { status: 403 });
  }
  const b = (await req.json().catch(() => ({}))) as { tom?: boolean };
  await nullstill(b.tom === true);
  return NextResponse.json({ ok: true, tom: b.tom === true });
}
