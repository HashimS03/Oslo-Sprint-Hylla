import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { svarForesporsel, visForesporsel } from "@/lib/strekkode";
import type { StrekkodeForesporsel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET → status for én forespørsel (dashboardet venter på svar).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const f = visForesporsel(await hentState(), (await params).id);
  return f ? NextResponse.json(f) : NextResponse.json({ feil: "Fant ikke forespørselen" }, { status: 404 });
}

// POST { status, kode? } → skanneren godtar, avviser eller sender koden. Dashboardet kan avbryte.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const b = (await req.json().catch(() => ({}))) as { status?: StrekkodeForesporsel["status"]; kode?: string };
  if (!b.status || !["godtatt", "ferdig", "avvist", "avbrutt"].includes(b.status)) {
    return NextResponse.json({ feil: "Ugyldig status" }, { status: 400 });
  }
  try {
    return NextResponse.json(await endreState((s) => svarForesporsel(s, id, { status: b.status!, kode: b.kode })));
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
