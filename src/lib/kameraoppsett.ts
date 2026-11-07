import "server-only";
import { lagSeed, osloTid } from "./seed";
import type { State } from "./types";

/**
 * Setter opp takkameraet i en eksisterende database uten å slette noe:
 * - varene Red Bull og Cola, hvis de mangler
 * - sonene T1 (Red Bull), T2 (Cola) og GANG, og kameraet kam_tak
 * Finnes T1 fra før uten kamerasone, beholdes hylla, men den får sonen og leter bare etter Red Bull.
 * Å kalle den flere ganger endrer ikke noe som allerede er satt opp.
 */
export function sikreTakkamera(s: State): { lagtTil: string[] } {
  const mal = lagSeed();
  const lagtTil: string[] = [];
  s.soneStand ??= {};
  s.kameraHendelser ??= [];
  s.skanninger ??= [];
  s.matcherAvvik ??= [];
  s.matchet ??= {};

  for (const sku of ["REDBULL", "COLA-BOKS"]) {
    if (s.varer.some((v) => v.sku === sku)) continue;
    const v = mal.varer.find((x) => x.sku === sku);
    if (v) {
      s.varer.push(v);
      lagtTil.push(`vare ${sku}`);
    }
  }

  for (const id of ["T1", "T2", "GANG"]) {
    const ny = mal.hyller.find((h) => h.id === id)!;
    const finnes = s.hyller.find((h) => h.id === id);
    if (!finnes) {
      s.hyller.push(ny);
      lagtTil.push(`sone ${id}`);
    } else if (!finnes.sone) {
      finnes.sone = ny.sone;
      finnes.innhold = ny.innhold;
      lagtTil.push(`sone ${id} (på eksisterende hylle)`);
    }
    s.soneStand[id] ??= {};
  }

  if (!s.kameraer.some((k) => k.id === "kam_tak")) {
    s.kameraer.push(mal.kameraer.find((k) => k.id === "kam_tak")!);
    lagtTil.push("kamera kam_tak");
  }

  // Startbeholdning i loggen, så skanninger har noe å trekke fra.
  for (const [hylle, sku] of [["T1", "REDBULL"], ["T2", "COLA-BOKS"]] as const) {
    if (s.hendelser.some((h) => h.hylle === hylle && h.sku === sku)) continue;
    s.hendelser.push({ id: `h_oppsett_${hylle}`, tid: osloTid(8, 0), hylle, sku, endring: 6, type: "mottak", aarsak: "Startbeholdning", ref: "oppsett" });
    lagtTil.push(`beholdning ${sku}`);
  }
  return { lagtTil };
}
