import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";

export const runtime = "nodejs";

// Kobler en strekkode til en vare, første gang den skannes. POST { kode, sku }.
export async function POST(req: Request) {
  const { kode, sku } = (await req.json()) as { kode?: string; sku?: string };
  if (!kode || !sku) return NextResponse.json({ feil: "kode og sku må være med" }, { status: 400 });
  try {
    await endreState((s) => {
      const v = s.varer.find((x) => x.sku === sku);
      if (!v) throw new Error("Ukjent vare");
      for (const andre of s.varer) if (andre.strekkode === kode) andre.strekkode = undefined;
      v.strekkode = kode;
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 400 });
  }
}
