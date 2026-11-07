import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { AKTIVE, alleOppdrag, oppdragVisning, sendOppdrag } from "@/lib/oppdrag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Oppdragslisten skanneren henter.
 * ?status=aktive (standard) | alle | sendt | mottatt | pagar | ferdig | avbrutt
 * ?skanner=navn  gir oppdrag sendt til den skanneren pluss de som er sendt til alle.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "aktive";
  const skanner = url.searchParams.get("skanner")?.trim().toLowerCase();
  const s = await hentState();
  const liste = alleOppdrag(s)
    .filter((o) => (status === "alle" ? true : status === "aktive" ? AKTIVE.includes(o.status) : o.status === status))
    .filter((o) => !skanner || !o.til || o.til.toLowerCase() === skanner)
    .map((o) => oppdragVisning(s, o));
  return NextResponse.json({ oppdrag: liste });
}

/** Send et avvik til skannerne. Body: { avvikId, melding?, til? } */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { avvikId?: string; melding?: string; til?: string };
  if (!b.avvikId) return NextResponse.json({ feil: "avvikId mangler" }, { status: 400 });
  try {
    const o = await endreState((s) => oppdragVisning(s, sendOppdrag(s, b.avvikId!, b)));
    return NextResponse.json({ oppdrag: o }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
