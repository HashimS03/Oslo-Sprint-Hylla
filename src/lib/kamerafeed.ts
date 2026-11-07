import { vare } from "./lager";
import type { KameraHendelse, State } from "./types";

// Det kameraet ser, gjort om til rader som passer i lagerloggen på dashboardet.
// Kameraet endrer ikke beholdningen (det gjør skanneren), men alt det ser vises sammen med hendelsene.

export type LoggRad = {
  id: string;
  tid: string;
  type: string;
  hylle: string;
  sku: string;
  navn: string;
  endring: number;
  aarsak: string;
  kamera: boolean;
  /** Lenke til avviket kamerahendelsen førte til, eller til et vanlig avvik. */
  avvik?: string;
  bilde?: string;
};

const TEKST: Record<KameraHendelse["type"], (navn: string, n: number) => string> = {
  uttak: (v, n) => `Kameraet så ${n} × ${v} bli tatt`,
  plassering: (v, n) => `Kameraet så ${n} × ${v} bli lagt til`,
  feil_vare: (v, n) => (n === 0 ? `${v} er fjernet fra feil plass` : `${n} × ${v} står på feil plass`),
  gjenglemt: (v, n) => `${n} × ${v} er gjenglemt i gangen`,
};

export function kameraRad(s: State, k: KameraHendelse): LoggRad {
  const navn = k.sku ? vare(s, k.sku)?.navn ?? k.sku : "Ukjent vare";
  const m = s.matchet?.[k.id];
  const mot = k.type === "uttak" || k.type === "plassering" ? (!m ? " · venter på skanner" : m === "ok" ? " · stemmer med skanner" : " · avvik mot skanner") : "";
  return {
    id: k.id,
    tid: k.tid,
    type: `kamera_${k.type}`,
    hylle: k.sone,
    sku: k.sku ?? "",
    navn,
    endring: k.type === "uttak" ? -k.antall : k.type === "plassering" ? k.antall : 0,
    aarsak: TEKST[k.type](navn, k.antall) + mot,
    kamera: true,
    avvik: m && m !== "ok" && m !== "lukket" ? m : undefined,
    bilde: k.bilde,
  };
}

export function kameraRader(s: State): LoggRad[] {
  return (s.kameraHendelser ?? []).map((k) => kameraRad(s, k));
}

export function loggRad(s: State, h: State["hendelser"][number]): LoggRad {
  return {
    id: h.id, tid: h.tid, type: h.type, hylle: h.hylle, sku: h.sku, navn: vare(s, h.sku)?.navn ?? h.sku,
    endring: h.endring, aarsak: h.aarsak, kamera: false, avvik: h.avvik ? h.id : undefined,
  };
}

/** Lagerlogg og kamera i én liste, nyeste først. */
export function alleRader(s: State): LoggRad[] {
  return [...s.hendelser.map((h) => loggRad(s, h)), ...kameraRader(s)].sort((a, b) => b.tid.localeCompare(a.tid));
}

/** Hva kameraet sist så i en sone: antall per vare og når. */
export function kameraSer(s: State, sone: string) {
  const stand = s.soneStand?.[sone];
  return stand ? { antall: stand, sett: s.soneSett?.[sone] } : null;
}
