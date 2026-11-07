import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { finnVare, registrerSkann } from "@/lib/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class UkjentKode extends Error {
  constructor(public kode: string) {
    super("Ukjent strekkode");
  }
}

// Generell skanner (simulator eller ekte): POST { kode | sku, antall?, type: "plukk" | "plassering" }. Ingen hylle.
// 404 med ukjentKode betyr at strekkoden ikke er koblet til en vare ennå (se /api/skanner/koble).
// Svaret har varsler hvis kameraet allerede har sett en annen vare bli tatt.
export async function POST(req: Request) {
  const inn = (await req.json()) as { sku?: string; kode?: string; antall?: number; type?: "plukk" | "plassering" };
  if (!inn.sku && !inn.kode) return NextResponse.json({ feil: "sku eller kode må være med" }, { status: 400 });
  try {
    const res = await endreState((s) => {
      const sku = inn.sku ?? finnVare(s, inn.kode!)?.sku;
      if (!sku) throw new UkjentKode(inn.kode!);
      return registrerSkann(s, { sku, antall: inn.antall, type: inn.type ?? "plukk" });
    });
    // Samme form som /api/skanner/varsel, så klientene kan bruke samme kode.
    const varsler = res.varsler.map((a) => ({ id: a.id, tid: a.tid, melding: a.varsel!.melding, type: a.type }));
    return NextResponse.json({ skann: res.skann, varsler });
  } catch (e) {
    if (e instanceof UkjentKode) return NextResponse.json({ feil: "Ukjent strekkode", ukjentKode: e.kode }, { status: 404 });
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 400 });
  }
}

export async function GET() {
  const s = await hentState();
  // Varene en skanner kan lese: de som kameraet kontrollerer (ligger i en kamerasone).
  const skuer = [...new Set(s.hyller.filter((h) => h.sone && h.sone.type !== "gang").flatMap((h) => h.innhold.map((p) => p.sku)))];
  const varer = skuer.map((sku) => ({ sku, navn: s.varer.find((v) => v.sku === sku)?.navn ?? sku }));
  return NextResponse.json({ varer, skanninger: [...(s.skanninger ?? [])].reverse().slice(0, 30) });
}
