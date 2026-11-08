import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { nyId } from "@/lib/lager";
import { varerVisning } from "@/lib/visning";
import { NyVareSkjema } from "@/lib/skjema";
import { lesJson } from "@/lib/vern";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Øvre grenser, så ingen kan fylle databasen med falske varer og hyller. */
const MAKS_VARER = 2000;
const MAKS_HYLLER = 500;

export async function GET() {
  return NextResponse.json({ varer: varerVisning(await hentState()) });
}

// Body: { sku, navn, swatch, hylle, farge?, storrelse?, nivaa?, bilder?, beskrivelse?,
//         antall? (startbeholdning), prompt? (kort engelsk beskrivelse for SAM), strekkode? }
export async function POST(req: Request) {
  const b = await lesJson(req, NyVareSkjema);
  if ("svar" in b) return b.svar;
  const { sku, navn, farge, storrelse, swatch, hylle: hylleId, nivaa, bilder, beskrivelse, prompt } = b.data;
  const strekkode = b.data.strekkode || undefined;
  try {
    await endreState((s) => {
      if (s.varer.some((v) => v.sku === sku)) throw new Error(`SKU ${sku} finnes allerede`);
      if (s.varer.length >= MAKS_VARER) throw new Error("Det er for mange varer");
      const opptatt = strekkode && s.varer.find((v) => v.strekkode === strekkode);
      if (opptatt) throw new Error(`Strekkoden ${strekkode} hører allerede til ${opptatt.navn}`);
      let hylle = s.hyller.find((h) => h.id === hylleId);
      if (!hylle) {
        if (s.hyller.length >= MAKS_HYLLER) throw new Error("Det er for mange hyller");
        hylle = { id: hylleId, reol: hylleId[0], navn: `Reol ${hylleId[0]}, hylle ${hylleId.slice(1)}`, innhold: [] };
        s.hyller.push(hylle);
      }
      s.varer.push({
        sku, navn, farge, storrelse, swatch, bilder: bilder ?? [], beskrivelse,
        ...(prompt ? { prompt } : {}),
        ...(strekkode ? { strekkode } : {}),
      });
      hylle.innhold.push({ sku, nivaa: nivaa || "hele hylla" });
      const antall = b.data.antall ?? 0;
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
