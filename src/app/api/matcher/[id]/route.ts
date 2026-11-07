import { NextResponse } from "next/server";
import { settAvvikStatus } from "@/lib/matcher";

export const runtime = "nodejs";

// PATCH { status: "loest" | "falsk_alarm" | "apen" }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { status } = (await req.json()) as { status?: "apen" | "loest" | "falsk_alarm" };
  if (status !== "apen" && status !== "loest" && status !== "falsk_alarm") return NextResponse.json({ feil: "Ugyldig status" }, { status: 400 });
  try {
    return NextResponse.json(await settAvvikStatus((await params).id, status));
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 404 });
  }
}
