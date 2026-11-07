import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { hyllerVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ hyller: hyllerVisning(await hentState()) }); }

/** Lager en tom hylle. `id` som «T1» (bokstaven er reolen), `navn` er valgfritt («Bord 1»). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { id?: string; navn?: string };
  const id = (b.id ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-ZÆØÅ][A-ZÆØÅ0-9-]{0,9}$/.test(id)) {
    return NextResponse.json({ feil: "Hylla trenger en kort ID som starter med en bokstav, f.eks. T1" }, { status: 400 });
  }
  try {
    await endreState((s) => {
      if (s.hyller.some((h) => h.id === id)) throw new Error(`Hylle ${id} finnes allerede`);
      const nr = id.slice(1).replace(/^-/, "");
      s.hyller.push({ id, reol: id[0], navn: b.navn?.trim() || (nr ? `Reol ${id[0]}, hylle ${nr}` : `Reol ${id[0]}`), innhold: [] });
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
