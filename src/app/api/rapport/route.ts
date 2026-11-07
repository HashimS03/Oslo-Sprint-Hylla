import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { vare } from "@/lib/lager";
import { dagNokkel, klokke, TYPE_NAVN } from "@/lib/format";
import { iPerioden, lesPeriode, rapport, tilCsv } from "@/lib/rapport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/rapport?dager=7                      → rapporten som JSON
// GET /api/rapport?dager=7&format=csv&hva=varer → per vare som CSV (åpnes i Excel)
// GET /api/rapport?dager=7&format=csv&hva=hendelser → alle hendelser i perioden som CSV
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dager = lesPeriode(url.searchParams.get("dager") ?? undefined, 7);
  const s = await hentState();
  const r = rapport(s, dager);
  if (url.searchParams.get("format") !== "csv") return NextResponse.json(r);

  const hva = url.searchParams.get("hva") === "hendelser" ? "hendelser" : "varer";
  const navn = `hylla-${hva}-${dager ? `${dager}d` : "alt"}-${dagNokkel(new Date().toISOString())}.csv`;
  const rader: (string | number)[][] =
    hva === "varer"
      ? [
          ["SKU", "Vare", "Mottatt", "Solgt", "Svinn", "Uavklart", "Funnet", "Korrigering", "Netto", "Svinnrate %", "På lager nå"],
          ...r.varer.map((v) => [v.sku, v.navn, v.mottatt, v.solgt, v.svinn, v.muligSvinn, v.funnet, v.korrigering, v.netto, (v.svinnrate * 100).toFixed(1).replace(".", ","), v.beholdning]),
        ]
      : [
          ["Dato", "Tid", "Type", "Lokasjon", "SKU", "Vare", "Endring", "Årsak", "Ref", "Avviksstatus"],
          ...s.hendelser
            .filter((h) => iPerioden(h, dager))
            .sort((a, b) => b.tid.localeCompare(a.tid))
            .map((h) => [dagNokkel(h.tid), klokke(h.tid), TYPE_NAVN[h.type] ?? h.type, h.hylle, h.sku, vare(s, h.sku)?.navn ?? "", h.endring, h.aarsak, h.ref ?? "", h.avvik?.status ?? ""]),
        ];
  return new NextResponse(tilCsv(rader), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${navn}"` },
  });
}
