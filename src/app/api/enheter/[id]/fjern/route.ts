import { NextResponse } from "next/server";
import { fjernEnhet } from "@/lib/enheter";

export const runtime = "nodejs";

// Fjerner en enhet, f.eks. en telefon som er mistet. Den mister tilgangen innen et halvt minutt.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await fjernEnhet((await params).id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 404 });
  }
}
