import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { hylleVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const h = hylleVisning(await hentState(), (await params).id);
  return h ? NextResponse.json(h) : NextResponse.json({ feil: "Fant ikke hylla" }, { status: 404 });
}
