import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { sikreTakkamera } from "@/lib/kameraoppsett";

export const runtime = "nodejs";

// Setter opp takkameraet (T1 Red Bull, T2 Cola, gang) uten å slette noe. Trygt å kalle flere ganger.
export async function POST() {
  try {
    return NextResponse.json(await endreState((s) => sikreTakkamera(s)));
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 500 });
  }
}
