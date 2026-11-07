import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { avvikVisning } from "@/lib/visning";
import { lukkAvvik } from "@/lib/lager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = avvikVisning(await hentState(), (await params).id);
  return a ? NextResponse.json(a) : NextResponse.json({ feil: "Fant ikke avviket" }, { status: 404 });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { handling } = (await req.json()) as { handling: "funnet" | "svinn" | "salg" };
  if (!["funnet", "svinn", "salg"].includes(handling)) return NextResponse.json({ feil: "Ukjent handling" }, { status: 400 });
  try {
    const h = await endreState((s) => lukkAvvik(s, id, handling));
    return NextResponse.json({ hendelse: h });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
