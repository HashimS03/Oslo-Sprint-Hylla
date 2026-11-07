import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { vareVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ sku: string }> }) {
  const v = vareVisning(await hentState(), decodeURIComponent((await params).sku));
  return v ? NextResponse.json(v) : NextResponse.json({ feil: "Fant ikke varen" }, { status: 404 });
}
