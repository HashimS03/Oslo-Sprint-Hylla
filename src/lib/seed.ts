import type { State, Hendelse } from "./types";

// Demodata som passer med demomanuset:
// B3 øverst: 13 svarte t-skjorter M ved tellingen 08:12 (45 mottatt på PO-2291, 32 plukket).
// B3 nederst: 16 hvite t-skjorter M. Ingen åpne plukkordrer på hvit M.
// Når demobildet telles: svart 18 (+5 restlevering), hvit 14 (−2 mulig svinn).

/** Tidspunkt i norsk tid (CET, UTC+1 i november) `dager` dager tilbake. */
export function osloTid(t: number, m: number, dager = 0): string {
  const now = new Date();
  const oslo = new Date(now.getTime() + 60 * 60 * 1000);
  const d = new Date(
    Date.UTC(oslo.getUTCFullYear(), oslo.getUTCMonth(), oslo.getUTCDate() - dager, t - 1, m),
  );
  return d.toISOString();
}

let n = 0;
const id = (p: string) => `${p}_${(++n).toString(36)}`;

function h(
  dager: number,
  t: number,
  m: number,
  hylle: string,
  sku: string,
  endring: number,
  type: Hendelse["type"],
  aarsak: string,
  ref?: string,
): Hendelse {
  return { id: id("h"), tid: osloTid(t, m, dager), hylle, sku, endring, type, aarsak, ref };
}

export function lagSeed(): State {
  n = 0;
  const hendelser: Hendelse[] = [
    // Svart t-skjorte M
    h(3, 10, 5, "B3", "TS-BLK-M", 45, "mottak", "Mottak PO-2291", "PO-2291"),
    h(2, 13, 20, "B3", "TS-BLK-M", -14, "plukk", "Plukk, 6 ordrer", "10440–10445"),
    h(1, 11, 40, "B3", "TS-BLK-M", -12, "plukk", "Plukk, 5 ordrer", "10458–10462"),
    h(1, 16, 20, "B3", "TS-BLK-M", -6, "plukk", "Plukk, 3 ordrer", "10469–10471"),
    // Hvit t-skjorte M
    h(12, 9, 30, "B3", "TS-WHT-M", 40, "mottak", "Mottak PO-2264", "PO-2264"),
    h(6, 14, 0, "B3", "TS-WHT-M", -24, "plukk", "Plukk, 11 ordrer", "10380–10390"),
    // B2
    h(9, 9, 0, "B2", "TS-WHT-S", 20, "mottak", "Mottak PO-2270", "PO-2270"),
    h(2, 12, 0, "B2", "TS-WHT-S", -8, "plukk", "Plukk, 4 ordrer", "10450–10453"),
    h(0, 8, 40, "B2", "TS-WHT-S", -3, "plukk", "Plukk, ordre 10479", "10479"),
    h(9, 9, 0, "B2", "TS-BLK-L", 15, "mottak", "Mottak PO-2270", "PO-2270"),
    h(2, 12, 30, "B2", "TS-BLK-L", -12, "plukk", "Plukk, 7 ordrer", "10446–10452"),
    // A4
    h(14, 10, 0, "A4", "LU-BLK", 30, "mottak", "Mottak PO-2251", "PO-2251"),
    h(3, 15, 0, "A4", "LU-BLK", -7, "plukk", "Plukk, 4 ordrer", "10430–10433"),
    h(0, 8, 55, "A4", "LU-BLK", -1, "plukk", "Plukk, ordre 10482", "10482"),
    h(14, 10, 0, "A4", "SK-RED", 15, "mottak", "Mottak PO-2251", "PO-2251"),
    h(1, 9, 30, "A4", "SK-RED", -4, "plukk", "Plukk, 2 ordrer", "10464–10466"),
    // C1
    h(1, 11, 5, "C1", "HG-GRY-L", 12, "mottak", "Mottak PO-2288", "PO-2288"),
  ];

  return {
    versjon: 1,
    varer: [
      { sku: "TS-BLK-M", navn: "Svart t-skjorte M", farge: "svart", storrelse: "M", leverandor: "Nordtex", swatch: "#1E1E20", bilder: [], beskrivelse: "Svart bomulls t-skjorte, brettet og stablet" },
      { sku: "TS-WHT-M", navn: "Hvit t-skjorte M", farge: "hvit", storrelse: "M", leverandor: "Nordtex", swatch: "#E8E6E1", bilder: [], beskrivelse: "Hvit bomulls t-skjorte, brettet og stablet" },
      { sku: "TS-WHT-S", navn: "Hvit t-skjorte S", farge: "hvit", storrelse: "S", leverandor: "Nordtex", swatch: "#E8E6E1", bilder: [], beskrivelse: "Hvit bomulls t-skjorte, brettet" },
      { sku: "TS-BLK-L", navn: "Svart t-skjorte L", farge: "svart", storrelse: "L", leverandor: "Nordtex", swatch: "#1E1E20", bilder: [], beskrivelse: "Svart bomulls t-skjorte, brettet" },
      { sku: "LU-BLK", navn: "Lue, sort", farge: "sort", storrelse: "One size", leverandor: "Fjellstrikk", swatch: "#2B3134", bilder: [], beskrivelse: "Strikket sort lue" },
      { sku: "SK-RED", navn: "Skjerf, rød", farge: "rød", storrelse: "One size", leverandor: "Fjellstrikk", swatch: "#B3362A", bilder: [], beskrivelse: "Rødt strikkeskjerf, rullet" },
      { sku: "HG-GRY-L", navn: "Hettegenser grå L", farge: "grå", storrelse: "L", leverandor: "Nordtex", swatch: "#9AA3A6", bilder: [], beskrivelse: "Grå hettegenser, brettet" },
    ],
    hyller: [
      { id: "B3", reol: "B", navn: "Reol B, hylle 3", innhold: [{ sku: "TS-BLK-M", nivaa: "øverst" }, { sku: "TS-WHT-M", nivaa: "nederst" }] },
      { id: "B2", reol: "B", navn: "Reol B, hylle 2", innhold: [{ sku: "TS-WHT-S", nivaa: "øverst" }, { sku: "TS-BLK-L", nivaa: "nederst" }] },
      { id: "A4", reol: "A", navn: "Reol A, hylle 4", innhold: [{ sku: "LU-BLK", nivaa: "venstre" }, { sku: "SK-RED", nivaa: "høyre" }] },
      { id: "C1", reol: "C", navn: "Reol C, hylle 1", innhold: [{ sku: "HG-GRY-L", nivaa: "hele hylla" }] },
    ],
    hendelser,
    tellinger: [
      { id: "t_b3_0812", tid: osloTid(8, 12), hylle: "B3", kilde: "mobil", antall: { "TS-BLK-M": 13, "TS-WHT-M": 16 }, teller: "demo" },
      { id: "t_b2_0840", tid: osloTid(8, 40), hylle: "B2", kilde: "mobil", antall: { "TS-WHT-S": 9, "TS-BLK-L": 3 }, teller: "demo" },
      { id: "t_a4_0855", tid: osloTid(8, 55), hylle: "A4", kilde: "kamera", antall: { "LU-BLK": 22, "SK-RED": 11 }, teller: "demo" },
    ],
    innkjop: [
      { id: "PO-2291", sku: "TS-BLK-M", hylle: "B3", bestilt: 50, mottatt: 45, bestiltDato: osloTid(9, 0, 5), leverandor: "Nordtex" },
      { id: "PO-2264", sku: "TS-WHT-M", hylle: "B3", bestilt: 40, mottatt: 40, bestiltDato: osloTid(9, 0, 15), leverandor: "Nordtex" },
      { id: "PO-2288", sku: "HG-GRY-L", hylle: "C1", bestilt: 12, mottatt: 12, bestiltDato: osloTid(9, 0, 4), leverandor: "Nordtex" },
    ],
    ordrer: [
      { id: "10490", sku: "TS-BLK-L", hylle: "B2", antall: 1, tid: osloTid(9, 10), status: "apen" },
    ],
    kameraer: [
      { id: "kam_b3", navn: "B3 · iPhone 11", hylle: "B3", sistSett: osloTid(9, 0), bilderIdag: 0, lader: true },
      { id: "kam_a4", navn: "A4 · Samsung A52", hylle: "A4", sistSett: osloTid(8, 57), bilderIdag: 9, lader: false, batteri: 4 },
    ],
    innstillinger: {
      lager: "Lager Nydalen",
      svinnTerskel: 1,
      sporNaarUsikker: true,
      svarHoyt: true,
      kameraIntervallMin: 5,
    },
  };
}
