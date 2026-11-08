import "server-only";
import type { Hylle, Kamera, State } from "./types";

/** Demo-takkameraet: tre soner i samme bilde. Ligger ikke lenger i startdataene; legges bare inn via /api/kamera/oppsett. */
const TAK_SONER: Hylle[] = [
  { id: "T1", reol: "T", navn: "T1", innhold: [], sone: { kamera: "kam_tak", x: 0, y: 0, b: 0.35, h: 1 } },
  { id: "T2", reol: "T", navn: "T2", innhold: [], sone: { kamera: "kam_tak", x: 0.35, y: 0, b: 0.35, h: 1 } },
  { id: "GANG", reol: "G", navn: "Gang", innhold: [], sone: { kamera: "kam_tak", x: 0.7, y: 0, b: 0.3, h: 1, type: "gang" } },
];
const TAK_KAMERA = (): Kamera => ({ id: "kam_tak", navn: "Takkamera · T1 og T2", hylle: "T1", sistSett: new Date().toISOString(), bilderIdag: 0 });

/** Varer som eldre versjoner av oppsettet la inn automatisk (med 6 stk hver). */
const GAMLE_OPPSETTVARER: Record<string, string> = { REDBULL: "T1", "COLA-BOKS": "T2" };

/**
 * Setter opp takkameraet i en eksisterende database uten å slette noe dere har lagt inn selv:
 * - sonene T1, T2 og GANG og kameraet kam_tak
 * Oppsettet legger ikke inn varer eller beholdning. Sonene starter tomme, og dere velger selv hvilke
 * varer hver sone skal kjenne igjen (under Takkamera). Uten valgte varer ser kameraet etter alle varene på lageret.
 * Finnes T1 fra før uten kamerasone, beholdes hylla og innholdet, men den får sonen.
 * Å kalle den flere ganger endrer ikke noe som allerede er satt opp.
 */
export function sikreTakkamera(s: State): { lagtTil: string[]; fjernet: string[] } {
  const lagtTil: string[] = [];
  s.soneStand ??= {};
  s.kameraHendelser ??= [];
  s.skanninger ??= [];
  s.matcherAvvik ??= [];
  s.matchet ??= {};

  const fjernet = fjernGamleOppsettvarer(s);

  for (const id of ["T1", "T2", "GANG"]) {
    const ny = TAK_SONER.find((h) => h.id === id)!;
    const finnes = s.hyller.find((h) => h.id === id);
    if (!finnes) {
      s.hyller.push({ ...ny, innhold: [] });
      lagtTil.push(`sone ${id}`);
    } else if (!finnes.sone) {
      finnes.sone = ny.sone;
      lagtTil.push(`sone ${id} (på eksisterende hylle)`);
    }
    s.soneStand[id] ??= {};
  }

  if (!s.kameraer.some((k) => k.id === "kam_tak")) {
    s.kameraer.push(TAK_KAMERA());
    lagtTil.push("kamera kam_tak");
  }
  return { lagtTil, fjernet };
}

/**
 * Rydder bort Red Bull og Cola som et eldre oppsett la inn av seg selv, men bare når det eneste som
 * finnes om varen er startbeholdningen fra oppsettet (ref "oppsett"). Varer dere har brukt, blir stående.
 */
function fjernGamleOppsettvarer(s: State): string[] {
  const fjernet: string[] = [];
  for (const [sku, hylle] of Object.entries(GAMLE_OPPSETTVARER)) {
    if (!s.varer.some((v) => v.sku === sku)) continue;
    const hendelser = s.hendelser.filter((h) => h.sku === sku);
    const baraOppsett = hendelser.length > 0 && hendelser.every((h) => h.ref === "oppsett");
    const brukt = (s.skanninger ?? []).some((x) => x.sku === sku) || (s.oppdrag ?? []).some((o) => o.sku === sku);
    if (!baraOppsett || brukt) continue;

    s.varer = s.varer.filter((v) => v.sku !== sku);
    s.hendelser = s.hendelser.filter((h) => h.sku !== sku);
    s.kameraHendelser = (s.kameraHendelser ?? []).filter((h) => h.sku !== sku);
    for (const h of s.hyller) h.innhold = h.innhold.filter((p) => p.sku !== sku);
    if (s.soneStand?.[hylle]) s.soneStand[hylle] = {};
    fjernet.push(sku);
  }
  return fjernet;
}

/** Sletter en vare og alt som handler om den: logg, kamerahendelser, skanninger, avvik, oppdrag og plass på hyllene. */
export function slettVare(s: State, sku: string): void {
  if (!s.varer.some((v) => v.sku === sku)) throw new Error(`Fant ikke ${sku}`);
  s.varer = s.varer.filter((v) => v.sku !== sku);
  s.hendelser = s.hendelser.filter((h) => h.sku !== sku);
  s.innkjop = s.innkjop.filter((x) => x.sku !== sku);
  s.ordrer = s.ordrer.filter((x) => x.sku !== sku);
  for (const t of s.tellinger) delete t.antall[sku];
  for (const h of s.hyller) h.innhold = h.innhold.filter((p) => p.sku !== sku);
  for (const stand of Object.values(s.soneStand ?? {})) delete stand[sku];
  if (s.kameraHendelser) s.kameraHendelser = s.kameraHendelser.filter((h) => h.sku !== sku);
  if (s.skanninger) s.skanninger = s.skanninger.filter((x) => x.sku !== sku);
  if (s.matcherAvvik) s.matcherAvvik = s.matcherAvvik.filter((a) => a.sku !== sku);
  if (s.oppgaver) s.oppgaver = s.oppgaver.filter((o) => o.sku !== sku);
  if (s.oppdrag) s.oppdrag = s.oppdrag.filter((o) => o.sku !== sku);
}

/**
 * Sletter en hylle. Loggen beholdes, men står det fortsatt varer på hylla, føres de ut med en korrigering
 * («Hylle X slettet»), så beholdningen ikke teller varer på en hylle som ikke finnes.
 * Kameraet til hylla forsvinner også, med mindre det følger med på andre hyller (som takkameraet).
 */
export function slettHylle(s: State, id: string): { utfort: { sku: string; antall: number }[] } {
  const hylle = s.hyller.find((h) => h.id === id);
  if (!hylle) throw new Error(`Fant ikke hylla ${id}`);
  const rest = new Map<string, number>();
  for (const h of s.hendelser) if (h.hylle === id) rest.set(h.sku, (rest.get(h.sku) ?? 0) + h.endring);
  const utfort = [...rest.entries()].filter(([, n]) => n !== 0).map(([sku, antall]) => ({ sku, antall }));
  const tid = new Date().toISOString();
  for (const { sku, antall } of utfort) {
    s.hendelser.push({ id: `h_slett_${id}_${sku}_${Date.now()}`, tid, hylle: id, sku, endring: -antall, type: "korrigering", aarsak: `Hylle ${hylle.navn || id} slettet` });
  }
  s.hyller = s.hyller.filter((h) => h.id !== id);
  const kamera = hylle.sone?.kamera;
  if (kamera && !s.hyller.some((h) => h.sone?.kamera === kamera)) s.kameraer = s.kameraer.filter((k) => k.id !== kamera);
  s.kameraer = s.kameraer.filter((k) => k.hylle !== id || s.hyller.some((h) => h.sone?.kamera === k.id));
  if (s.soneStand) delete s.soneStand[id];
  if (s.soneSett) delete s.soneSett[id];
  if (s.oppdrag) s.oppdrag = s.oppdrag.filter((o) => o.hylle !== id || o.status === "ferdig" || o.status === "avbrutt");
  return { utfort };
}
