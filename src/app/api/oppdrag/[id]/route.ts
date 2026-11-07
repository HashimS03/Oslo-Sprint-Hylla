import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { oppdaterOppdrag, oppdragVisning } from "@/lib/oppdrag";
import type { OppdragStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await hentState();
  const o = (s.oppdrag ?? []).find((x) => x.id === id);
  return o ? NextResponse.json({ oppdrag: oppdragVisning(s, o) }) : NextResponse.json({ feil: "Fant ikke oppdraget" }, { status: 404 });
}

/**
 * Skanneren (eller dashboardet) melder status. Body: { status?, tattAv?, svar? }
 * For å avklare selve avviket bruker skanneren POST /api/avvik/{avvikId} med { handling }.
 * Da settes oppdraget til «ferdig» automatisk.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { status?: OppdragStatus; tattAv?: string; svar?: string };
  try {
    const o = await endreState((s) => oppdragVisning(s, oppdaterOppdrag(s, id, b)));
    return NextResponse.json({ oppdrag: o });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
