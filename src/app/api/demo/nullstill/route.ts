import { NextResponse } from "next/server";
import { nullstill } from "@/lib/store";

export const runtime = "nodejs";

/** POST {} gir demodataene tilbake. POST { "tom": true } tømmer lageret helt. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { tom?: boolean };
  await nullstill(b.tom === true);
  return NextResponse.json({ ok: true, tom: b.tom === true });
}
