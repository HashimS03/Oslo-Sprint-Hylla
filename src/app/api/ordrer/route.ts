import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await hentState();
  return NextResponse.json({ ordrer: s.ordrer.filter((o) => o.status === "apen") });
}

/**
 * Registrerer et salg (en åpen ordre). Når neste telling viser at varen er borte,
 * forklares nedgangen med denne ordren i stedet for å bli mulig svinn.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { sku?: string; antall?: number; hylle?: string };
  const sku = (b.sku ?? "").trim().toUpperCase();
  const antall = Math.round(Number(b.antall) || 0);
  if (!sku || antall < 1) return NextResponse.json({ feil: "Velg vare og antall" }, { status: 400 });
  try {
    const ordre = await endreState((s) => {
      if (!s.varer.some((v) => v.sku === sku)) throw new Error(`Fant ikke ${sku}`);
      const hylle = b.hylle?.trim().toUpperCase() || s.hyller.find((h) => h.innhold.some((i) => i.sku === sku))?.id;
      if (!hylle) throw new Error(`${sku} ligger ikke på noen hylle`);
      const nr = Math.max(1000, ...s.ordrer.map((o) => Number(o.id.replace(/\D/g, "")) || 0)) + 1;
      const o = { id: String(nr), sku, hylle, antall, tid: new Date().toISOString(), status: "apen" as const };
      s.ordrer.push(o);
      return o;
    });
    return NextResponse.json({ ordre });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
