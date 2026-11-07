import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { nyId } from "@/lib/lager";
import { varerVisning } from "@/lib/visning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ varer: varerVisning(await hentState()) });
}

export async function POST(req: Request) {
  const b = (await req.json()) as {
    sku: string; navn: string; farge: string; storrelse: string; swatch: string;
    hylle: string; nivaa?: string; bilder?: string[]; beskrivelse?: string;
    /** Hvor mange som ligger på hylla nå. Blir startbeholdningen som tellingene sammenlignes med. */
    antall?: number;
    /** Kort engelsk beskrivelse for SAM («red soda can»). */
    prompt?: string;
  };
  if (!b.sku || !b.navn || !b.hylle) return NextResponse.json({ feil: "Navn, SKU og hylle må fylles ut" }, { status: 400 });
  const sku = b.sku.trim().toUpperCase();
  try {
    await endreState((s) => {
      if (s.varer.some((v) => v.sku === sku)) throw new Error(`SKU ${sku} finnes allerede`);
      s.varer.push({
        sku, navn: b.navn.trim(), farge: b.farge, storrelse: b.storrelse, swatch: b.swatch,
        bilder: (b.bilder ?? []).slice(0, 3), beskrivelse: b.beskrivelse,
        ...(b.prompt?.trim() ? { prompt: b.prompt.trim() } : {}),
      });
      const hylleId = b.hylle.trim().toUpperCase();
      let hylle = s.hyller.find((h) => h.id === hylleId);
      if (!hylle) {
        hylle = { id: hylleId, reol: hylleId[0], navn: `Reol ${hylleId[0]}, hylle ${hylleId.slice(1)}`, innhold: [] };
        s.hyller.push(hylle);
      }
      hylle.innhold.push({ sku, nivaa: b.nivaa || "hele hylla" });
      const antall = Math.max(0, Math.round(Number(b.antall) || 0));
      if (antall > 0) {
        s.hendelser.push({
          id: nyId("h"), tid: new Date().toISOString(), hylle: hylleId, sku,
          endring: antall, type: "start", aarsak: `Registrert med ${antall} stk`,
        });
      }
    });
    return NextResponse.json({ sku });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
