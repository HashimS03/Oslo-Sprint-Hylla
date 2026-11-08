import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { vareVisning } from "@/lib/visning";
import { slettVare } from "@/lib/kameraoppsett";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ sku: string }> }) {
  const v = vareVisning(await hentState(), decodeURIComponent((await params).sku));
  return v ? NextResponse.json(v) : NextResponse.json({ feil: "Fant ikke varen" }, { status: 404 });
}

type Endring = { navn?: string; farge?: string; storrelse?: string; leverandor?: string; beskrivelse?: string; strekkode?: string; prompt?: string };

/**
 * Endre en vare. Bare feltene som sendes med, endres. Tom tekst fjerner valgfrie felt
 * (leverandør, beskrivelse, strekkode, søketekst). Navn kan ikke være tomt. SKU kan ikke endres.
 */
async function endre(req: Request, { params }: { params: Promise<{ sku: string }> }) {
  const sku = decodeURIComponent((await params).sku);
  const b = (await req.json().catch(() => ({}))) as Endring;
  try {
    await endreState((s) => {
      const v = s.varer.find((x) => x.sku === sku);
      if (!v) throw new Error(`Fant ikke ${sku}`);
      const t = (x?: string) => (x ?? "").trim();
      if (b.navn !== undefined) {
        if (!t(b.navn)) throw new Error("Navnet kan ikke være tomt");
        v.navn = t(b.navn);
      }
      if (b.farge !== undefined) v.farge = t(b.farge);
      if (b.storrelse !== undefined) v.storrelse = t(b.storrelse);
      for (const k of ["leverandor", "beskrivelse", "prompt"] as const) {
        if (b[k] === undefined) continue;
        if (t(b[k])) v[k] = t(b[k]);
        else delete v[k];
      }
      if (b.strekkode !== undefined) {
        const kode = t(b.strekkode);
        if (kode) {
          // En strekkode hører til én vare. Har en annen vare den, flyttes den hit.
          for (const andre of s.varer) if (andre !== v && andre.strekkode === kode) delete andre.strekkode;
          v.strekkode = kode;
        } else delete v.strekkode;
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}

export { endre as POST, endre as PATCH };

/** Slett varen og alt som handler om den. */
export async function DELETE(_: Request, { params }: { params: Promise<{ sku: string }> }) {
  const sku = decodeURIComponent((await params).sku);
  try {
    await endreState((s) => slettVare(s, sku));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
