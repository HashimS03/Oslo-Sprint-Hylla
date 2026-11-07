import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { lukkAvvik } from "@/lib/lager";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { handling } = (await req.json()) as { handling: "funnet" | "svinn" };
  try {
    const h = await endreState((s) => lukkAvvik(s, id, handling));
    return NextResponse.json({ hendelse: h });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
