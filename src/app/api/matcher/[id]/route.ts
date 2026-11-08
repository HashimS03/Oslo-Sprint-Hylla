import { NextResponse } from "next/server";
import { settAvvikStatus } from "@/lib/matcher";
import { endreState } from "@/lib/store";
import { losKameraAvvik, type KameraUtfall } from "@/lib/kameraavvik";

export const runtime = "nodejs";

// PATCH { utfall: "funnet" | "salg" | "svinn" | "falsk_alarm" } → avklar avviket (samme som i appen).
// PATCH { status: "apen" } → åpne det igjen.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const b = (await req.json().catch(() => ({}))) as { status?: "apen" | "loest" | "falsk_alarm"; utfall?: KameraUtfall };
  try {
    if (b.utfall) return NextResponse.json(await endreState((s) => losKameraAvvik(s, id, b.utfall!)));
    if (b.status === "apen" || b.status === "loest" || b.status === "falsk_alarm") return NextResponse.json(await settAvvikStatus(id, b.status));
    return NextResponse.json({ feil: "Ugyldig status" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 400 });
  }
}
