import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { sikreTakkamera } from "@/lib/kameraoppsett";

export const runtime = "nodejs";

// Setter opp takkameraet (sone T1, T2 og gang) uten varer. Trygt å kalle flere ganger.
export async function POST() {
  try {
    return NextResponse.json(await endreState((s) => sikreTakkamera(s)));
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 500 });
  }
}
