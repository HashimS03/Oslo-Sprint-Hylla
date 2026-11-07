import type { Kort, State } from "./types";
import {
  apneAvvik,
  beholdning,
  beholdningPerHylle,
  innkjopForVare,
  plukketSiden,
  totalBeholdning,
  vare,
} from "./lager";

// Verktøyene Spør Hylla kan bruke. De samme funksjonene brukes av tekstchatten (Claude)
// og av ElevenLabs-agenten (som webhook-verktøy via /api/verktoy/[navn]).

const kl = (iso: string) =>
  new Date(iso).toLocaleString("nb-NO", { timeZone: "Europe/Oslo", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function finnVare(s: State, sok: string) {
  const q = sok.toLowerCase().trim();
  // Enkel bøyning: "svarte t-skjorten" skal treffe "svart t-skjorte".
  const ord = q.split(/[\s,.]+/).filter((o) => o.length > 0);
  const treffer = (tekst: string, o: string) =>
    [o, o.replace(/(ene|en|er|e)$/, "")].some((x) => x.length > 0 && new RegExp(`(^|[\\s-])${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(tekst));
  const treff = s.varer
    .map((v) => {
      const tekst = `${v.sku} ${v.navn} ${v.farge} ${v.storrelse} ${v.beskrivelse ?? ""}`.toLowerCase();
      const poeng = ord.reduce((p, o) => p + (treffer(tekst, o) ? (o.length === 1 || o === "xl" ? 2 : 1) : 0), 0) + (v.sku.toLowerCase() === q ? 5 : 0);
      return { v, poeng };
    })
    .filter((x) => x.poeng > 0)
    .sort((a, b) => b.poeng - a.poeng)
    .slice(0, 5);
  return treff.map(({ v }) => ({ sku: v.sku, navn: v.navn, farge: v.farge, storrelse: v.storrelse, beholdning: beholdning(s, v.sku) }));
}

export function varekort(s: State, sku: string): Kort | null {
  const v = vare(s, sku);
  if (!v) return null;
  const po = innkjopForVare(s, sku)[0];
  return {
    type: "vare",
    sku,
    navn: v.navn,
    swatch: v.swatch,
    beholdning: beholdning(s, sku),
    hyller: beholdningPerHylle(s, sku),
    po: po
      ? { id: po.id, bestilt: po.bestilt, mottatt: po.mottatt, plukket: plukketSiden(s, sku, po.bestiltDato) }
      : undefined,
  };
}

export function hentBeholdning(s: State, sku: string) {
  const v = vare(s, sku);
  if (!v) return { feil: `Fant ingen vare med SKU ${sku}` };
  return { sku, navn: v.navn, totalt: beholdning(s, sku), perHylle: beholdningPerHylle(s, sku) };
}

export function hentInnkjop(s: State, sku?: string, po?: string) {
  const liste = s.innkjop.filter((i) => (!sku || i.sku === sku) && (!po || i.id.toLowerCase() === po.toLowerCase()));
  return liste.map((i) => ({
    po: i.id,
    sku: i.sku,
    vare: vare(s, i.sku)?.navn,
    leverandor: i.leverandor,
    bestiltDato: kl(i.bestiltDato),
    bestilt: i.bestilt,
    mottatt: i.mottatt,
    gjenstaar: i.bestilt - i.mottatt,
    plukketSidenBestilling: plukketSiden(s, i.sku, i.bestiltDato),
    igjenPaaLager: beholdning(s, i.sku),
  }));
}

export function hentLogg(s: State, opts: { sku?: string; hylle?: string; type?: string; antall?: number }) {
  return s.hendelser
    .filter((h) => (!opts.sku || h.sku === opts.sku) && (!opts.hylle || h.hylle === opts.hylle) && (!opts.type || h.type === opts.type))
    .sort((a, b) => b.tid.localeCompare(a.tid))
    .slice(0, opts.antall ?? 10)
    .map((h) => ({ tid: kl(h.tid), hylle: h.hylle, sku: h.sku, vare: vare(s, h.sku)?.navn, endring: h.endring, type: h.type, aarsak: h.aarsak, ref: h.ref }));
}

export function hentAvvik(s: State) {
  return apneAvvik(s).map((h) => ({ id: h.id, tid: kl(h.tid), hylle: h.hylle, sku: h.sku, vare: vare(s, h.sku)?.navn, endring: h.endring, aarsak: h.aarsak }));
}

export function oversikt(s: State) {
  return {
    lager: s.innstillinger.lager,
    varerPaaLager: totalBeholdning(s),
    antallVaretyper: s.varer.length,
    apneAvvik: apneAvvik(s).length,
    hyller: s.hyller.map((h) => ({ id: h.id, navn: h.navn, varer: h.innhold.map((i) => i.sku) })),
  };
}

export function lagKort(s: State, type: string, id: string): Kort | null {
  if (type === "vare") return varekort(s, id);
  if (type === "avvik") {
    const h = s.hendelser.find((x) => x.id === id) ?? apneAvvik(s)[0];
    if (!h) return null;
    return { type: "avvik", id: h.id, sku: h.sku, navn: vare(s, h.sku)?.navn ?? h.sku, hylle: h.hylle, endring: h.endring, tid: h.tid };
  }
  return null;
}

/** Felles beskrivelse av verktøyene, brukt både av Claude og i ElevenLabs-oppsettet. */
export const VERKTOY = [
  {
    name: "finn_vare",
    description: "Søk etter varer på navn, farge, størrelse eller SKU. Bruk dette først når brukeren nevner en vare med ord, for å finne SKU-en.",
    input_schema: { type: "object", properties: { sok: { type: "string", description: "Søketekst, f.eks. 'svart t-skjorte M'" } }, required: ["sok"], additionalProperties: false },
  },
  {
    name: "hent_beholdning",
    description: "Hent hvor mange av en vare som er på lager nå, totalt og per hylle.",
    input_schema: { type: "object", properties: { sku: { type: "string" } }, required: ["sku"], additionalProperties: false },
  },
  {
    name: "hent_innkjop",
    description: "Hent innkjøpsordrer (PO) for en vare eller ett PO-nummer: bestilt, mottatt, hvor mange som er plukket siden og hvor mange som er igjen.",
    input_schema: { type: "object", properties: { sku: { type: "string" }, po: { type: "string" } }, required: [], additionalProperties: false },
  },
  {
    name: "hent_logg",
    description: "Hent de siste hendelsene i lagerloggen, valgfritt filtrert på vare, hylle eller type (mottak, plukk, mulig_svinn, svinn, funnet, korrigering).",
    input_schema: {
      type: "object",
      properties: { sku: { type: "string" }, hylle: { type: "string" }, type: { type: "string" }, antall: { type: "integer" } },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "hent_avvik",
    description: "Hent åpne avvik (mulig svinn) som ikke er fulgt opp.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "vis_kort",
    description: "Vis et kort på skjermen til brukeren. Bruk type 'vare' med SKU når du svarer om en vare, og type 'avvik' med avvikets id når du svarer om svinn.",
    input_schema: {
      type: "object",
      properties: { type: { type: "string", enum: ["vare", "avvik"] }, id: { type: "string", description: "SKU for vare, avvik-id for avvik" } },
      required: ["type", "id"],
      additionalProperties: false,
    },
  },
] as const;

export type VerktoyNavn = (typeof VERKTOY)[number]["name"];

export function kjorVerktoy(s: State, navn: string, input: Record<string, unknown>): { resultat: unknown; kort?: Kort } {
  const str = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : undefined);
  switch (navn) {
    case "finn_vare":
      return { resultat: finnVare(s, str("sok") ?? "") };
    case "hent_beholdning":
      return { resultat: hentBeholdning(s, str("sku") ?? "") };
    case "hent_innkjop":
      return { resultat: hentInnkjop(s, str("sku"), str("po")) };
    case "hent_logg":
      return { resultat: hentLogg(s, { sku: str("sku"), hylle: str("hylle"), type: str("type"), antall: typeof input.antall === "number" ? input.antall : undefined }) };
    case "hent_avvik":
      return { resultat: hentAvvik(s) };
    case "vis_kort": {
      const kort = lagKort(s, str("type") ?? "vare", str("id") ?? "");
      return kort ? { resultat: "Kortet vises på skjermen.", kort } : { resultat: { feil: "Fant ikke det du ville vise" } };
    }
    default:
      return { resultat: { feil: `Ukjent verktøy ${navn}` } };
  }
}
