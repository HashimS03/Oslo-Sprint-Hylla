import { samPrompt } from "./prompt";
import type { State } from "./types";
import {
  apneAvvik, beholdning, beholdningPerHylle, erIdag, hylleStatus, innkjopForVare, plukketSiden, sisteTelling, totalBeholdning, vare,
} from "./lager";

// Ferdige visningsdata for appen (Expo) og andre klienter. Én funksjon per skjerm.

export function logRad(s: State, h: State["hendelser"][number]) {
  return {
    id: h.id, tid: h.tid, hylle: h.hylle, sku: h.sku, navn: vare(s, h.sku)?.navn ?? h.sku,
    endring: h.endring, type: h.type, aarsak: h.aarsak, ref: h.ref, avvikStatus: h.avvik?.status,
  };
}

export function oversiktVisning(s: State) {
  const talt = s.hyller.filter((h) => { const t = sisteTelling(s, h.id); return t && erIdag(t.tid); }).length;
  const avvik = apneAvvik(s);
  return {
    lager: s.innstillinger.lager,
    varerPaaLager: totalBeholdning(s),
    taltIdag: talt,
    antallHyller: s.hyller.length,
    apneAvvik: avvik.map((h) => logRad(s, h)),
    siste: [...s.hendelser].sort((a, b) => b.tid.localeCompare(a.tid)).slice(0, 5).map((h) => logRad(s, h)),
  };
}

export function hyllerVisning(s: State) {
  return s.hyller.map((h) => ({
    id: h.id, reol: h.reol, navn: h.navn, status: hylleStatus(s, h.id), sistTalt: sisteTelling(s, h.id)?.tid ?? null,
    innhold: h.innhold.map((i) => ({ sku: i.sku, nivaa: i.nivaa, navn: vare(s, i.sku)?.navn ?? i.sku, antall: beholdning(s, i.sku, h.id) })),
  }));
}

export function hylleVisning(s: State, id: string) {
  const h = hyllerVisning(s).find((x) => x.id === id.toUpperCase());
  if (!h) return null;
  const t = sisteTelling(s, h.id);
  return { ...h, forrige: t ? { tid: t.tid, bilde: t.bilde ?? null } : null, sporNaarUsikker: s.innstillinger.sporNaarUsikker };
}

export function avvikVisning(s: State, id: string) {
  const h = s.hendelser.find((x) => x.id === id);
  if (!h || (!h.avvik && h.type !== "mulig_svinn" && h.type !== "svinn")) return null;
  const etter = s.tellinger.find((t) => t.id === h.tellingId);
  const for_ = s.tellinger.find((t) => t.id === h.avvik?.forrigeTellingId);
  const plass = s.hyller.find((x) => x.id === h.hylle)?.innhold.find((i) => i.sku === h.sku)?.nivaa;
  return {
    ...logRad(s, h), nivaa: plass ?? null, status: h.avvik?.status ?? "apen", lukketTid: h.avvik?.lukketTid ?? null,
    for: for_ ? { tid: for_.tid, antall: for_.antall[h.sku] ?? null, bilde: for_.bilde ?? null } : null,
    etter: etter ? { tid: etter.tid, antall: etter.antall[h.sku] ?? null, bilde: etter.bilde ?? null, teller: etter.teller, kilde: etter.kilde } : null,
    apneOrdrer: s.ordrer.filter((o) => o.sku === h.sku && o.status === "apen").length,
  };
}

export function varerVisning(s: State) {
  return s.varer.map((v) => ({
    sku: v.sku, navn: v.navn, swatch: v.swatch, antall: beholdning(s, v.sku),
    hyller: s.hyller.filter((h) => h.innhold.some((i) => i.sku === v.sku)).map((h) => h.id),
  }));
}

export function vareVisning(s: State, sku: string) {
  const v = vare(s, sku);
  if (!v) return null;
  const po = innkjopForVare(s, sku)[0];
  return {
    sku: v.sku, navn: v.navn, farge: v.farge, storrelse: v.storrelse, leverandor: v.leverandor ?? null, swatch: v.swatch,
    prompt: samPrompt(v), egenPrompt: !!v.prompt?.trim(),
    bilde: v.bilder[0] ?? null,
    antall: beholdning(s, sku),
    apneSalg: s.ordrer.filter((o) => o.sku === sku && o.status === "apen").reduce((n, o) => n + o.antall, 0),
    perHylle: beholdningPerHylle(s, sku).map((x) => ({ ...x, nivaa: s.hyller.find((h) => h.id === x.hylle)?.innhold.find((i) => i.sku === sku)?.nivaa ?? null })),
    innkjop: po ? {
      id: po.id, bestilt: po.bestilt, mottatt: po.mottatt, bestiltDato: po.bestiltDato, plukket: plukketSiden(s, sku, po.bestiltDato),
      mottak: s.hendelser.filter((h) => h.ref === po.id && h.type === "mottak").map((h) => ({ tid: h.tid, antall: h.endring })),
    } : null,
    historikk: s.hendelser.filter((h) => h.sku === sku).sort((a, b) => b.tid.localeCompare(a.tid)).slice(0, 10).map((h) => logRad(s, h)),
  };
}

export function kameraerVisning(s: State) {
  return s.kameraer.map((k) => ({ ...k, aktiv: Date.now() - new Date(k.sistSett).getTime() < 15 * 60e3 }));
}
