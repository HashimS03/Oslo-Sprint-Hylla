import type { Kort, State } from "./types";
import { avvikTittel } from "./matcher-tekst";
import { oppgaveListe } from "./oppgaver";
import {
  apneKameraAvvik,
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

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a");
/** Grov stamme: «nudlene», «nudler» og «nudle» ender alle på «nudl». */
const stamme = (o: string) => o.replace(/(ene|ane|ene|er|en|et|ar|a|e|s)$/, "");
function avstand(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function finnVare(s: State, sok: string) {
  return finnVareMedPoeng(s, sok).map(({ poeng: _p, ...v }) => v);
}

/** Som finnVare, men med treffpoeng (3 eller mer = et helt ord eller en stamme traff). */
export function finnVareMedPoeng(s: State, sok: string) {
  const ord = norm(sok).split(/[^a-z0-9]+/).filter((o) => o.length > 1);
  const treff = s.varer
    .map((v) => {
      const felt = norm(`${v.sku} ${v.navn} ${v.farge ?? ""} ${v.storrelse ?? ""} ${v.beskrivelse ?? ""}`).split(/[^a-z0-9]+/).filter(Boolean);
      const poeng = ord.reduce((p, o) => {
        const so = stamme(o);
        if (felt.some((f) => f === o || stamme(f) === so)) return p + 3;
        if (so.length >= 3 && felt.some((f) => f.startsWith(so) || so.startsWith(stamme(f)) && stamme(f).length >= 3)) return p + 2;
        if (so.length >= 4 && felt.some((f) => avstand(stamme(f), so) <= 1)) return p + 1;
        return p;
      }, 0);
      return { v, poeng: poeng + (norm(v.sku) === norm(sok.trim()) ? 5 : 0) };
    })
    .filter((x) => x.poeng > 0)
    .sort((a, b) => b.poeng - a.poeng)
    .slice(0, 5);
  return treff.map(({ v, poeng }) => ({ sku: v.sku, navn: v.navn, farge: v.farge, storrelse: v.storrelse, beholdning: beholdning(s, v.sku), poeng }));
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

/** Hva kameraet i taket ser i hver sone akkurat nå, og de siste kamerahendelsene. */
export function hentKamera(s: State) {
  const soner = s.hyller.filter((h) => h.sone).map((h) => {
    const stand = s.soneStand?.[h.id] ?? {};
    const sett = s.soneSett?.[h.id];
    return {
      sone: h.id,
      type: h.sone?.type === "gang" ? "gang (skal være tom)" : "hylle",
      leterEtter: h.innhold.map((i) => vare(s, i.sku)?.navn ?? i.sku),
      kameraetSer: Object.entries(stand).filter(([, n]) => n > 0).map(([sku, n]) => ({ vare: vare(s, sku)?.navn ?? sku, antall: n })),
      sistSett: sett ? kl(sett) : "aldri",
      aktivNaa: !!sett && Date.now() - Date.parse(sett) < 15_000,
    };
  });
  const hendelser = [...(s.kameraHendelser ?? [])].reverse().slice(0, 10).map((k) => ({
    tid: kl(k.tid), sone: k.sone, type: k.type, vare: k.sku ? vare(s, k.sku)?.navn ?? k.sku : null, antall: k.antall,
  }));
  return { soner, sisteHendelser: hendelser };
}

/** Avvik matcheren har funnet mellom kamera og skanner. */
export function hentKameraAvvik(s: State) {
  return apneKameraAvvik(s).map((a) => ({ id: a.id, tid: kl(a.tid), type: avvikTittel(a.type), sone: a.sone, vare: a.sku ? vare(s, a.sku)?.navn ?? a.sku : null, antall: a.antall, hva: a.tekst }));
}

export function hentSkanninger(s: State, antall = 10) {
  return [...(s.skanninger ?? [])].reverse().slice(0, antall).map((x) => ({ tid: kl(x.tid), type: x.type === "plukk" ? "plukk" : "plassering", vare: vare(s, x.sku)?.navn ?? x.sku, antall: x.antall }));
}

export function hentOppgaver(s: State) {
  return oppgaveListe(s).filter((o) => o.status !== "ferdig").map((o) => ({ tittel: o.tittel, prioritet: o.prioritet, status: o.status, hylle: o.hylle ?? null, vare: o.sku ? vare(s, o.sku)?.navn ?? o.sku : null, tattAv: o.tattAv ?? null }));
}

/** Kort oppsummering av dagen, til spørsmål som «hva har skjedd i dag?». */
export function hentOppsummering(s: State) {
  const idag = new Date().toDateString();
  const erIdag = (iso: string) => new Date(iso).toDateString() === idag;
  const kam = (s.kameraHendelser ?? []).filter((k) => erIdag(k.tid));
  const tell = (t: string) => kam.filter((k) => k.type === t).length;
  return {
    lager: s.innstillinger.lager,
    skanningerIdag: (s.skanninger ?? []).filter((x) => erIdag(x.tid)).length,
    kamerahendelserIdag: { uttak: tell("uttak"), plassering: tell("plassering"), feilProdukt: tell("feil_vare"), gjenglemt: tell("gjenglemt") },
    apneKameraavvik: apneKameraAvvik(s).length,
    apneLagerAvvik: apneAvvik(s).length,
    apneOppgaver: oppgaveListe(s).filter((o) => o.status !== "ferdig").length,
    varerPaaLager: totalBeholdning(s),
  };
}

/** Ferske data i ett kompakt JSON-objekt, som legges rett i prompten så de fleste spørsmål ikke trenger verktøykall. */
export function lagerstatus(s: State) {
  return {
    oppsummering: hentOppsummering(s),
    varer: s.varer.slice(0, 40).map((v) => ({ sku: v.sku, navn: v.navn, beholdning: beholdning(s, v.sku), paaHylle: s.hyller.filter((h) => h.innhold.some((i) => i.sku === v.sku)).map((h) => h.id) })),
    kamera: hentKamera(s),
    kameraavvik: hentKameraAvvik(s).slice(0, 10),
    lagerAvvik: hentAvvik(s).slice(0, 10),
    sisteSkanninger: hentSkanninger(s, 6),
    oppgaver: hentOppgaver(s).slice(0, 8),
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
    input_schema: { type: "object", properties: { sok: { type: "string", description: "Søketekst, f.eks. 'kaffekopp'" } }, required: ["sok"], additionalProperties: false },
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
    name: "hent_kamera",
    description: "Hva takkameraet ser akkurat nå i hver sone (T1, T2, gang): hva sonen leter etter, antall kameraet ser, når det sist så sonen, og de siste kamerahendelsene (uttak, plassering, feil produkt, gjenglemt). Bruk dette for spørsmål om kameraet.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "hent_kameraavvik",
    description: "Åpne avvik der kameraet og skanneren er uenige: feil plass, uregistrert uttak, skannet uten uttak, feil produkt i sonen, gjenglemt vare.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "hent_skanninger",
    description: "De siste skanningene (plukk og plassering) fra skanneren.",
    input_schema: { type: "object", properties: { antall: { type: "integer" } }, required: [], additionalProperties: false },
  },
  {
    name: "hent_oppgaver",
    description: "Åpne oppgaver til de ansatte.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "hent_oppsummering",
    description: "Kort oppsummering av dagen i dag: skanninger, kamerahendelser, åpne avvik og oppgaver. Bruk dette for «hva har skjedd i dag?».",
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
    case "hent_kamera":
      return { resultat: hentKamera(s) };
    case "hent_kameraavvik":
      return { resultat: hentKameraAvvik(s) };
    case "hent_skanninger":
      return { resultat: hentSkanninger(s, typeof input.antall === "number" ? input.antall : 10) };
    case "hent_oppgaver":
      return { resultat: hentOppgaver(s) };
    case "hent_oppsummering":
      return { resultat: hentOppsummering(s) };
    case "vis_kort": {
      const kort = lagKort(s, str("type") ?? "vare", str("id") ?? "");
      return kort ? { resultat: "Kortet vises på skjermen.", kort } : { resultat: { feil: "Fant ikke det du ville vise" } };
    }
    default:
      return { resultat: { feil: `Ukjent verktøy ${navn}` } };
  }
}
