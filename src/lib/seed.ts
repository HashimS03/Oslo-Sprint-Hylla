import type { State, Hendelse } from "./types";

// Demodata for bordet i pitchen: 10 produkter på ett bord (hylle BORD).
// Demoskript: ta bort en brusboks (plukkordre finnes, blir plukk), ta bort en penn (ingen ordre, mulig svinn),
// legg til to kaffekopper (restlevering på PO-3001).

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
  const T = "BORD";
  const hendelser: Hendelse[] = [
    h(6, 9, 0, T, "BRUS-RED", 8, "mottak", "Mottak PO-2990", "PO-2990"),
    h(2, 13, 0, T, "BRUS-RED", -4, "plukk", "Plukk, 3 ordrer", "20480–20482"),
    h(6, 9, 0, T, "VANN-KLAR", 6, "mottak", "Mottak PO-2990", "PO-2990"),
    h(3, 11, 0, T, "VANN-KLAR", -3, "plukk", "Plukk, 2 ordrer", "20470–20471"),
    h(6, 9, 0, T, "SJOK-MEL", 8, "mottak", "Mottak PO-2990", "PO-2990"),
    h(1, 14, 0, T, "SJOK-MEL", -3, "plukk", "Plukk, 3 ordrer", "20490–20492"),
    h(6, 9, 0, T, "KORN-PK", 4, "mottak", "Mottak PO-2990", "PO-2990"),
    h(2, 10, 0, T, "KORN-PK", -2, "plukk", "Plukk, 2 ordrer", "20483–20484"),
    h(4, 10, 0, T, "KAFFE-KOPP", 3, "mottak", "Mottak PO-3001", "PO-3001"),
    h(5, 9, 0, T, "KRUS-HVIT", 5, "mottak", "Mottak PO-2990", "PO-2990"),
    h(1, 12, 0, T, "KRUS-HVIT", -2, "plukk", "Plukk, 2 ordrer", "20493–20494"),
    h(5, 9, 0, T, "NOTAT-BLA", 6, "mottak", "Mottak PO-2990", "PO-2990"),
    h(2, 15, 0, T, "NOTAT-BLA", -2, "plukk", "Plukk, 2 ordrer", "20485–20486"),
    h(5, 9, 0, T, "PENN-SVART", 5, "mottak", "Mottak PO-2990", "PO-2990"),
    h(1, 10, 30, T, "PENN-SVART", -2, "plukk", "Plukk, 2 ordrer", "20495–20496"),
    h(3, 9, 0, T, "EPLE-GRONN", 6, "mottak", "Mottak PO-3010", "PO-3010"),
    h(1, 16, 0, T, "EPLE-GRONN", -2, "plukk", "Plukk, 2 ordrer", "20497–20498"),
    h(3, 9, 0, T, "BANAN", 5, "mottak", "Mottak PO-3010", "PO-3010"),
    h(0, 8, 30, T, "BANAN", -2, "plukk", "Plukk, 2 ordrer", "20499–20500"),
    // Takkamera: hylle 1 har cola, hylle 2 har Red Bull.
    h(3, 9, 0, "T2", "COLA-BOKS", 6, "mottak", "Mottak PO-3020", "PO-3020"),
    h(3, 9, 0, "T1", "REDBULL", 6, "mottak", "Mottak PO-3020", "PO-3020"),
  ];
  // Beholdning etter dette: brus 4, vann 3, sjokolade 5, korn 2, kaffekopp 3, krus 3, notatbok 4, penn 3, eple 4, banan 3.

  return {
    versjon: 1,
    varer: [
      { sku: "BRUS-RED", navn: "Brusboks, rød", farge: "rød", storrelse: "33 cl", leverandor: "Drikkegrossisten", swatch: "#B3362A", bilder: [], beskrivelse: "Rød brusboks av aluminium", prompt: "red soda can" },
      { sku: "VANN-KLAR", navn: "Vannflaske", farge: "klar", storrelse: "50 cl", leverandor: "Drikkegrossisten", swatch: "#9CC7E0", bilder: [], beskrivelse: "Klar plastflaske med vann", prompt: "clear plastic water bottle" },
      { sku: "SJOK-MEL", navn: "Sjokoladeplate", farge: "blå", storrelse: "100 g", leverandor: "Søtsaker AS", swatch: "#2F5D8A", bilder: [], beskrivelse: "Melkesjokolade i blå innpakning", prompt: "chocolate bar in blue wrapper" },
      { sku: "KORN-PK", navn: "Kornpakke", farge: "gul", storrelse: "500 g", leverandor: "Søtsaker AS", swatch: "#F4C430", bilder: [], beskrivelse: "Gul eske med frokostblanding", prompt: "yellow cereal box" },
      { sku: "KAFFE-KOPP", navn: "Kaffekopp", farge: "brun", storrelse: "30 cl", leverandor: "Kontorlevering", swatch: "#8A5A3B", bilder: [], beskrivelse: "Brun papirkopp med lokk", prompt: "brown paper coffee cup" },
      { sku: "KRUS-HVIT", navn: "Krus, hvitt", farge: "hvit", storrelse: "35 cl", leverandor: "Kontorlevering", swatch: "#E8E6E1", bilder: [], beskrivelse: "Hvitt keramikkrus", prompt: "white ceramic mug" },
      { sku: "NOTAT-BLA", navn: "Notatbok, blå", farge: "blå", storrelse: "A5", leverandor: "Kontorlevering", swatch: "#2F5D8A", bilder: [], beskrivelse: "Blå notatbok med hardt omslag", prompt: "blue notebook" },
      { sku: "PENN-SVART", navn: "Penn, svart", farge: "svart", storrelse: "One size", leverandor: "Kontorlevering", swatch: "#1E1E20", bilder: [], beskrivelse: "Svart kulepenn", prompt: "black pen" },
      { sku: "EPLE-GRONN", navn: "Eple, grønt", farge: "grønn", storrelse: "Stk", leverandor: "Frukthuset", swatch: "#2F7D55", bilder: [], beskrivelse: "Grønt eple", prompt: "green apple" },
      { sku: "BANAN", navn: "Banan", farge: "gul", storrelse: "Stk", leverandor: "Frukthuset", swatch: "#E8C547", bilder: [], beskrivelse: "Gul banan", prompt: "banana" },
      { sku: "COLA-BOKS", navn: "Cola, boks", farge: "rød", storrelse: "33 cl", leverandor: "Drikkegrossisten", swatch: "#C8102E", bilder: [], beskrivelse: "Rød Coca-Cola-boks", prompt: "Coca-Cola can" },
      { sku: "REDBULL", navn: "Red Bull", farge: "blå og sølv", storrelse: "25 cl", leverandor: "Drikkegrossisten", swatch: "#1F3A93", bilder: [], beskrivelse: "Red Bull energidrikk, blå og sølv boks", prompt: "Red Bull energy drink can" },
    ],
    hyller: [
      {
        id: T, reol: "B", navn: "Bord 1",
        innhold: ["BRUS-RED", "VANN-KLAR", "SJOK-MEL", "KORN-PK", "KAFFE-KOPP", "KRUS-HVIT", "NOTAT-BLA", "PENN-SVART", "EPLE-GRONN", "BANAN"].map((sku) => ({ sku, nivaa: "hele bordet" })),
      },
      // Takkamera "kam_tak": T1 (Red Bull) til venstre, T2 (Coca-Cola) i midten, gang til høyre.
      {
        id: "T1", reol: "T", navn: "T1",
        innhold: [{ sku: "REDBULL", nivaa: "hele hylla" }],
        sone: { kamera: "kam_tak", x: 0, y: 0, b: 0.35, h: 1 },
      },
      {
        id: "T2", reol: "T", navn: "T2",
        innhold: [{ sku: "COLA-BOKS", nivaa: "hele hylla" }],
        sone: { kamera: "kam_tak", x: 0.35, y: 0, b: 0.35, h: 1 },
      },
      {
        id: "GANG", reol: "G", navn: "Gang",
        innhold: [],
        sone: { kamera: "kam_tak", x: 0.7, y: 0, b: 0.3, h: 1, type: "gang" },
      },
    ],
    hendelser,
    tellinger: [
      { id: "t_bord_0800", tid: osloTid(8, 0), hylle: T, kilde: "mobil", antall: { "BRUS-RED": 4, "VANN-KLAR": 3, "SJOK-MEL": 5, "KORN-PK": 2, "KAFFE-KOPP": 3, "KRUS-HVIT": 3, "NOTAT-BLA": 4, "PENN-SVART": 3, "EPLE-GRONN": 4, "BANAN": 3 }, teller: "demo" },
      { id: "t_t2_0800", tid: osloTid(8, 0), hylle: "T2", kilde: "kamera", antall: { "COLA-BOKS": 6 }, teller: "demo" },
      { id: "t_t1_cam_0800", tid: osloTid(8, 0), hylle: "T1", kilde: "kamera", antall: { "REDBULL": 6 }, teller: "demo" },
    ],
    innkjop: [
      { id: "PO-3001", sku: "KAFFE-KOPP", hylle: T, bestilt: 5, mottatt: 3, bestiltDato: osloTid(9, 0, 5), leverandor: "Kontorlevering" },
    ],
    ordrer: [
      { id: "20501", sku: "BRUS-RED", hylle: T, antall: 1, tid: osloTid(8, 45), status: "apen" },
    ],
    kameraer: [
      { id: "kam_t1", navn: "Bord · kameratelefon", hylle: T, sistSett: osloTid(8, 50), bilderIdag: 0, lader: true },
      { id: "kam_tak", navn: "Takkamera · T1 og T2", hylle: "T1", sistSett: osloTid(8, 50), bilderIdag: 0, lader: true },
    ],
    kameraHendelser: [],
    skanninger: [],
    matcherAvvik: [],
    matchet: {},
    soneStand: { T1: { REDBULL: 6 }, T2: { "COLA-BOKS": 6 }, GANG: {} },
    innstillinger: {
      lager: "Lager Nydalen",
      svinnTerskel: 1,
      sporNaarUsikker: true,
      svarHoyt: true,
      kameraIntervallMin: 5,
    },
  };
}
