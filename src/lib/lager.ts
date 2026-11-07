import type {
  Forslag,
  ForslagEndring,
  Hendelse,
  Innkjop,
  State,
  TelleResultat,
  Telling,
  Vare,
} from "./types";

// All lagerlogikk ligger her, som rene funksjoner over State.
// Claude teller bare. Koden regner ut differansen og forklarer den.

export const nyId = (p: string) =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function vare(s: State, sku: string): Vare | undefined {
  return s.varer.find((v) => v.sku === sku);
}

export function beholdning(s: State, sku: string, hylle?: string): number {
  return s.hendelser
    .filter((h) => h.sku === sku && (!hylle || h.hylle === hylle))
    .reduce((sum, h) => sum + h.endring, 0);
}

export function beholdningPerHylle(s: State, sku: string) {
  const map = new Map<string, number>();
  for (const h of s.hendelser) if (h.sku === sku) map.set(h.hylle, (map.get(h.hylle) ?? 0) + h.endring);
  for (const hy of s.hyller) if (hy.innhold.some((i) => i.sku === sku) && !map.has(hy.id)) map.set(hy.id, 0);
  return [...map.entries()].map(([hylle, antall]) => ({ hylle, antall }));
}

export function totalBeholdning(s: State): number {
  return s.hendelser.reduce((sum, h) => sum + h.endring, 0);
}

export function sisteTelling(s: State, hylle: string): Telling | undefined {
  return s.tellinger.filter((t) => t.hylle === hylle).sort((a, b) => b.tid.localeCompare(a.tid))[0];
}

export function apneAvvik(s: State): Hendelse[] {
  return s.hendelser
    .filter((h) => h.type === "mulig_svinn" && h.avvik?.status === "apen")
    .sort((a, b) => b.tid.localeCompare(a.tid));
}

export function erIdag(iso: string): boolean {
  const f = (d: Date) => d.toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo" });
  return f(new Date(iso)) === f(new Date());
}

export function hylleStatus(s: State, hylle: string): "avvik" | "ok" | "ikke_talt" {
  if (apneAvvik(s).some((a) => a.hylle === hylle)) return "avvik";
  const t = sisteTelling(s, hylle);
  return t && erIdag(t.tid) ? "ok" : "ikke_talt";
}

export function innkjopForVare(s: State, sku: string): Innkjop[] {
  return s.innkjop.filter((i) => i.sku === sku).sort((a, b) => b.bestiltDato.localeCompare(a.bestiltDato));
}

/** Hvor mange som er plukket av en vare siden et innkjøp kom inn. */
export function plukketSiden(s: State, sku: string, iso: string): number {
  return -s.hendelser
    .filter((h) => h.sku === sku && h.type === "plukk" && h.tid >= iso)
    .reduce((sum, h) => sum + h.endring, 0);
}

/**
 * Sammenligner en ny telling med beholdningen i loggen og forklarer hver endring:
 * - økning: dekkes først av åpne innkjøp (restlevering), resten er en uforklart økning
 * - nedgang: dekkes først av åpne plukkordrer, resten er mulig svinn
 */
export function lagForslag(
  s: State,
  hylle: string,
  resultat: TelleResultat,
  teller: string,
  sekunder: number,
): Forslag {
  const hy = s.hyller.find((x) => x.id === hylle);
  if (!hy) throw new Error(`Ukjent hylle ${hylle}`);
  const forrige = sisteTelling(s, hylle);
  const antall: Record<string, number> = {};
  const endringer: ForslagEndring[] = [];
  let uendret = 0;

  for (const plass of hy.innhold) {
    const r = resultat.varer.find((v) => v.sku === plass.sku);
    if (!r) continue;
    const v = vare(s, plass.sku);
    const for_ = beholdning(s, plass.sku, hylle);
    const na = Math.max(0, Math.round(r.antall));
    antall[plass.sku] = na;
    const diff = na - for_;
    const base = {
      sku: plass.sku,
      navn: v?.navn ?? plass.sku,
      nivaa: plass.nivaa,
      swatch: v?.swatch ?? "#999",
      forrige: for_,
      na,
      sikkerhet: r.sikkerhet,
      alternativ: r.alternativ,
    };
    if (diff === 0) {
      uendret++;
      if (r.sikkerhet < 0.8 && r.alternativ !== null) endringer.push({ ...base, deler: [] });
      continue;
    }
    endringer.push({ ...base, deler: forklar(s, hylle, plass.sku, diff) });
  }

  return {
    hylle,
    tid: new Date().toISOString(),
    teller,
    forrigeTellingId: forrige?.id,
    forrigeTid: forrige?.tid,
    antall,
    endringer,
    uendret,
    ukjente: resultat.ukjente,
    bildekvalitet: resultat.bildekvalitet,
    kommentar: resultat.kommentar,
    sekunder,
  };
}

export function forklar(s: State, hylle: string, sku: string, diff: number): ForslagEndring["deler"] {
  const deler: ForslagEndring["deler"] = [];
  let rest = diff;
  if (rest > 0) {
    for (const po of s.innkjop.filter((i) => i.sku === sku && i.mottatt < i.bestilt)) {
      if (rest <= 0) break;
      const n = Math.min(rest, po.bestilt - po.mottatt);
      deler.push({ type: "mottak", endring: n, aarsak: `Restlevering på ${po.id}`, ref: po.id });
      rest -= n;
    }
    if (rest > 0) deler.push({ type: "korrigering", endring: rest, aarsak: "Flere enn ventet, ingen åpen innkjøpsordre" });
  } else {
    for (const o of s.ordrer.filter((x) => x.sku === sku && x.hylle === hylle && x.status === "apen")) {
      if (rest >= 0) break;
      const n = Math.min(-rest, o.antall);
      deler.push({ type: "plukk", endring: -n, aarsak: `Salg, ordre ${o.id}`, ref: o.id });
      rest += n;
    }
    if (rest < 0) {
      const terskel = s.innstillinger.svinnTerskel;
      deler.push(
        -rest >= terskel
          ? { type: "mulig_svinn", endring: rest, aarsak: "Ingen registrert salg forklarer dette" }
          : { type: "korrigering", endring: rest, aarsak: "Liten nedgang under varslingsgrensen" },
      );
    }
  }
  return deler;
}

/** Lagrer en godkjent telling: ny telling, hendelser i loggen, oppdaterte innkjøp og ordrer. */
export function lagreForslag(
  s: State,
  f: Forslag,
  opts: { kilde: Telling["kilde"]; bilde?: string; korrigert?: Record<string, number> },
): { tellingId: string; hendelser: Hendelse[] } {
  // Brukeren kan ha rettet et usikkert tall; da regnes forklaringen ut på nytt.
  const antall = { ...f.antall, ...(opts.korrigert ?? {}) };
  const telling: Telling = {
    id: nyId("t"),
    tid: new Date().toISOString(),
    hylle: f.hylle,
    kilde: opts.kilde,
    bilde: opts.bilde,
    antall,
    teller: f.teller,
  };
  s.tellinger.push(telling);
  const nye: Hendelse[] = [];
  for (const [sku, na] of Object.entries(antall)) {
    const diff = na - beholdning(s, sku, f.hylle);
    if (diff === 0) continue;
    for (const d of forklar(s, f.hylle, sku, diff)) {
      const hend: Hendelse = {
        id: nyId("h"),
        tid: telling.tid,
        hylle: f.hylle,
        sku,
        endring: d.endring,
        type: d.type,
        aarsak: d.aarsak,
        ref: d.ref,
        tellingId: telling.id,
      };
      if (d.type === "mulig_svinn") hend.avvik = { status: "apen", forrigeTellingId: f.forrigeTellingId };
      if (d.type === "mottak" && d.ref) {
        const po = s.innkjop.find((i) => i.id === d.ref);
        if (po) po.mottatt += d.endring;
      }
      if (d.type === "plukk" && d.ref) {
        const o = s.ordrer.find((x) => x.id === d.ref);
        // Bare det som faktisk ble tatt trekkes fra; resten av ordren venter på neste telling.
        if (o) {
          o.antall += d.endring;
          if (o.antall <= 0) o.status = "plukket";
        }
      }
      s.hendelser.push(hend);
      nye.push(hend);
    }
  }
  ryddBilder(s, f.hylle);
  return { tellingId: telling.id, hendelser: nye };
}

/** Avslutt et avvik: varen er funnet (setter tilbake antallet) eller registrert som svinn. */
export function lukkAvvik(s: State, id: string, handling: "funnet" | "svinn" | "salg"): Hendelse {
  const h = s.hendelser.find((x) => x.id === id);
  if (!h || h.type !== "mulig_svinn") throw new Error("Fant ikke avviket");
  h.avvik = { ...(h.avvik ?? { status: "apen" }), status: handling === "salg" ? "lukket" : handling, lukketTid: new Date().toISOString() };
  if (handling === "salg") {
    // Det var et salg likevel: samme nedgang, men ført som salg i stedet for svinn.
    h.type = "plukk";
    h.aarsak = "Salg, registrert fra avvik";
  } else if (handling === "funnet") {
    const motpost: Hendelse = {
      id: nyId("h"),
      tid: new Date().toISOString(),
      hylle: h.hylle,
      sku: h.sku,
      endring: -h.endring,
      type: "funnet",
      aarsak: "Funnet igjen, avvik lukket",
      ref: h.id,
    };
    s.hendelser.push(motpost);
  } else {
    h.type = "svinn";
    h.aarsak = "Registrert som svinn";
  }
  return h;
}

/** Behold bilder bare der de trengs (de to siste tellingene per hylle og bilder et avvik viser til), så lagringen ikke vokser. */
function ryddBilder(s: State, hylle: string) {
  const viktige = new Set<string>();
  for (const h of s.hendelser) {
    if (h.type === "mulig_svinn" || h.type === "svinn") {
      if (h.tellingId) viktige.add(h.tellingId);
      if (h.avvik?.forrigeTellingId) viktige.add(h.avvik.forrigeTellingId);
    }
  }
  const avHylla = s.tellinger.filter((t) => t.hylle === hylle).sort((a, b) => b.tid.localeCompare(a.tid));
  avHylla.slice(2).forEach((t) => {
    if (!viktige.has(t.id)) delete t.bilde;
  });
}
