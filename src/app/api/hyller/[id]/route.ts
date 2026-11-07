import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { hylleVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const h = hylleVisning(await hentState(), (await params).id);
  return h ? NextResponse.json(h) : NextResponse.json({ feil: "Fant ikke hylla" }, { status: 404 });
}

// Innstillinger for en kamerasone: hvilke varer sonen skal klassifisere (T1 = Red Bull, T2 = Coca-Cola).
// PATCH { skuer: string[] }. Kameraet nullstiller utgangspunktet for sonen, så endringen ikke blir en falsk hendelse.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const { skuer } = (await req.json()) as { skuer?: string[] };
  if (!Array.isArray(skuer)) return NextResponse.json({ feil: "skuer må være en liste" }, { status: 400 });
  try {
    const ut = await endreState((s) => {
      const hylle = s.hyller.find((h) => h.id === id);
      if (!hylle) throw new Error("Fant ikke hylla");
      const ukjent = skuer.find((sku) => !s.varer.some((v) => v.sku === sku));
      if (ukjent) throw new Error(`Ukjent vare ${ukjent}`);
      hylle.innhold = skuer.map((sku) => ({ sku, nivaa: hylle.innhold.find((p) => p.sku === sku)?.nivaa ?? "hele hylla" }));
      s.soneStand ??= {};
      s.soneStand[id] = {};
      return hylle.innhold;
    });
    return NextResponse.json({ innhold: ut });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Noe gikk galt" }, { status: 404 });
  }
}
