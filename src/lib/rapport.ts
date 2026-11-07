import type { Hendelse, State } from "./types";
import { apneAvvik, beholdning, vare } from "./lager";
import { dagNokkel } from "./format";

// Tall til dashboardet og rapporten. Alt regnes ut fra lagerloggen (hendelsene).

/** Varer med så få eller færre igjen regnes som lav beholdning. */
export const LAV_BEHOLDNING = 3;

export const PERIODER = [
  { dager: 1, navn: "I dag" },
  { dager: 7, navn: "7 dager" },
  { dager: 30, navn: "30 dager" },
  { dager: 0, navn: "Alt" },
] as const;

export function lesPeriode(v: string | undefined, standard = 7): number {
  const n = Number(v);
  return PERIODER.some((p) => p.dager === n) && v !== undefined && v !== "" ? n : standard;
}

/** Første dag (YYYY-MM-DD, norsk tid) som er med i perioden. 0 dager betyr hele historikken. */
export function fraDag(dager: number): string {
  if (!dager) return "0000-00-00";
  return dagNokkel(new Date(Date.now() - (dager - 1) * 864e5).toISOString());
}

export function iPerioden(h: Pick<Hendelse, "tid">, dager: number): boolean {
  return dagNokkel(h.tid) >= fraDag(dager);
}

export type Summer = {
  mottatt: number;
  solgt: number;
  svinn: number;
  muligSvinn: number;
  funnet: number;
  korrigering: number;
  netto: number;
};

const tom = (): Summer => ({ mottatt: 0, solgt: 0, svinn: 0, muligSvinn: 0, funnet: 0, korrigering: 0, netto: 0 });

function legg(sum: Summer, h: Hendelse) {
  if (h.type === "start") return;
  sum.netto += h.endring;
  switch (h.type) {
    case "mottak": sum.mottatt += h.endring; break;
    case "plukk": sum.solgt += -h.endring; break;
    case "svinn": sum.svinn += -h.endring; break;
    // Et avvik som ble funnet igjen står fortsatt som mulig_svinn, men er nullet ut av en «funnet»-hendelse.
    case "mulig_svinn": if (h.avvik?.status === "apen") sum.muligSvinn += -h.endring; break;
    case "funnet": sum.funnet += h.endring; break;
    case "korrigering": sum.korrigering += h.endring; break;
  }
}

export function rapport(s: State, dager: number) {
  const hendelser = s.hendelser.filter((h) => iPerioden(h, dager));
  const totalt = tom();
  const perVare = new Map<string, Summer>();
  const perHylle = new Map<string, Summer>();
  for (const h of hendelser) {
    legg(totalt, h);
    if (!perVare.has(h.sku)) perVare.set(h.sku, tom());
    legg(perVare.get(h.sku)!, h);
    if (!perHylle.has(h.hylle)) perHylle.set(h.hylle, tom());
    legg(perHylle.get(h.hylle)!, h);
  }
  const rate = (x: Summer) => {
    const ut = x.solgt + x.svinn + x.muligSvinn;
    return ut ? (x.svinn + x.muligSvinn) / ut : 0;
  };
  const varer = s.varer.map((v) => {
    const sum = perVare.get(v.sku) ?? tom();
    return {
      sku: v.sku,
      navn: v.navn,
      swatch: v.swatch,
      ...sum,
      svinnrate: rate(sum),
      beholdning: beholdning(s, v.sku),
    };
  });
  const hyller = s.hyller.map((hy) => {
    const sum = perHylle.get(hy.id) ?? tom();
    return { id: hy.id, navn: hy.navn, ...sum, svinnrate: rate(sum) };
  });

  // Per dag, nyeste først, for de siste dagene i perioden (maks 14 rader).
  const dagMap = new Map<string, Summer>();
  for (const h of hendelser) {
    const k = dagNokkel(h.tid);
    if (!dagMap.has(k)) dagMap.set(k, tom());
    legg(dagMap.get(k)!, h);
  }
  const perDag = [...dagMap.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).map(([dag, sum]) => ({ dag, ...sum }));

  return { dager, fra: fraDag(dager), totalt, svinnrate: rate(totalt), varer, hyller, perDag, antallHendelser: hendelser.length };
}

export function lavBeholdning(s: State) {
  return s.varer
    .map((v) => ({ sku: v.sku, navn: v.navn, swatch: v.swatch, antall: beholdning(s, v.sku) }))
    .filter((v) => v.antall <= LAV_BEHOLDNING)
    .sort((a, b) => a.antall - b.antall);
}

export function avvikListe(s: State, filter: "apne" | "lukket" | "alle") {
  const alle = s.hendelser
    .filter((h) => h.avvik || h.type === "mulig_svinn" || h.type === "svinn")
    .sort((a, b) => b.tid.localeCompare(a.tid));
  const liste = filter === "apne" ? apneAvvik(s) : filter === "lukket" ? alle.filter((h) => h.avvik?.status && h.avvik.status !== "apen") : alle;
  return liste.map((h) => ({
    id: h.id,
    tid: h.tid,
    hylle: h.hylle,
    sku: h.sku,
    navn: vare(s, h.sku)?.navn ?? h.sku,
    antall: Math.abs(h.endring),
    status: h.avvik?.status ?? (h.type === "svinn" ? "svinn" : "apen"),
    lukketTid: h.avvik?.lukketTid ?? null,
  }));
}

export function tilCsv(rader: (string | number)[][]): string {
  const celle = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  // Semikolon og BOM så Excel med norsk oppsett åpner filen riktig.
  return "﻿" + rader.map((r) => r.map(celle).join(";")).join("\r\n");
}
