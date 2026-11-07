import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { vareVisning } from "@/lib/visning";
import { slettVare } from "@/lib/kameraoppsett";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ sku: string }> }) {
  const v = vareVisning(await hentState(), decodeURIComponent((await params).sku));
  return v ? NextResponse.json(v) : NextResponse.json({ feil: "Fant ikke varen" }, { status: 404 });
}

/** Endre søketeksten kameraet bruker for varen (engelsk, f.eks. «water bottle»). */
export async function POST(req: Request, { params }: { params: Promise<{ sku: string }> }) {
  const sku = decodeURIComponent((await params).sku);
  const b = (await req.json().catch(() => ({}))) as { prompt?: string };
  try {
    await endreState((s) => {
      const v = s.varer.find((x) => x.sku === sku);
      if (!v) throw new Error(`Fant ikke ${sku}`);
      if (b.prompt?.trim()) v.prompt = b.prompt.trim();
      else delete v.prompt;
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}

/** Slett varen og alt som handler om den. */
export async function DELETE(_: Request, { params }: { params: Promise<{ sku: string }> }) {
  const sku = decodeURIComponent((await params).sku);
  try {
    await endreState((s) => slettVare(s, sku));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
