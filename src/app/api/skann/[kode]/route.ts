import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { kodeTilSku, skannerVare } from "@/lib/oppgaver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Slår opp en scannet kode («HYLLA:SKU» eller bare SKU). 404 betyr ukjent kode. */
export async function GET(_: Request, { params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  const s = await hentState();
  const sku = kodeTilSku(s, kode);
  const v = sku ? skannerVare(s, sku) : null;
  return v ? NextResponse.json({ vare: v }) : NextResponse.json({ feil: "Ukjent kode" }, { status: 404 });
}
