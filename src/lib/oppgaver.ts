// Oppgaver og avviksmeldinger for scannerappen (de ansatte på lageret).
//
// Regler:
// - Oppgaver lages i dashbordet (driftsleder) eller av takkameraet, gjennom POST /api/oppgaver.
// - Oppdrag («Send til skanner» i dashbordet, src/lib/oppdrag.ts) vises i samme liste i appen.
// - Avvik som en ansatt melder, blir en vanlig mulig_svinn-hendelse med åpent avvik. Den vises bare
//   i dashbordet, og driftsleder bestemmer hva som skjer videre. Det lages ingen oppgave automatisk.
// - Beholdningen er alltid summen av hendelsene. Vi legger bare til nye hendelser.
//
// Alle funksjonene er rene funksjoner over State, og kalles inne i endreState() fra API-rutene.

import { apneAvvik, beholdning, lukkAvvik, nyId, vare } from "./lager";
import { erAktiv, oppdaterOppdrag, sendOppdrag } from "./oppdrag";
import { avvikTittel } from "./matcher-tekst";
import { rest } from "./bestillinger";
import type { Hendelse, MatcherAvvik, Oppdrag, Oppgave, OppgaveType, Ordre, State } from "./types";

export const OPPGAVE_TYPER: OppgaveType[] = ["pafyll", "sjekk", "avvik", "pakk", "annet"];
export const AVVIK_GRUNNER = ["mangler", "skadet", "feil_plass", "annet"] as const;
export type AvvikGrunn = (typeof AVVIK_GRUNNER)[number];

const GRUNN_TEKST: Record<AvvikGrunn, string> = {
  mangler: "Mangler på hylla",
  skadet: "Skadet vare",
  feil_plass: "Står på feil plass",
  annet: "Annet",
};

/** Er avviket som oppgaven peker på, allerede lukket (for eksempel i dashbordet)? */
function avvikLukket(s: State, o: Oppgave): boolean {
  if (!o.avvikId) return false;
  const h = s.hendelser.find((x) => x.id === o.avvikId);
  return !h || h.avvik?.status !== "apen";
}

// ---------- Oppdrag fra dashbordet (Hashims «Send til skanner») ----------
// Oppdragene eies av src/lib/oppdrag.ts og endres ikke her. Scannerappen viser dem i samme liste som
// oppgavene, så den ansatte bare har ett sted å se. Id-en til et oppdrag starter med "o_".

const OPPDRAG_STATUS: Record<Oppdrag["status"], Oppgave["status"]> = {
  sendt: "ny", mottatt: "ny", pagar: "pagar", ferdig: "ferdig", avbrutt: "ferdig",
};

export const erOppdragId = (s: State, id: string) => !!s.oppdrag?.some((o) => o.id === id);

/** Et oppdrag i samme form som en oppgave. */
function oppdragSomOppgave(s: State, o: Oppdrag): Oppgave {
  const navn = vare(s, o.sku)?.navn ?? o.sku;
  const h = s.hendelser.find((x) => x.id === o.avvikId);
  return {
    id: o.id,
    tittel: `Sjekk ${navn.toLowerCase()}`,
    beskrivelse: [o.antall > 0 ? `Det kan mangle ${o.antall} stk.` : "", o.melding ?? ""].filter(Boolean).join(" ") || undefined,
    type: "avvik",
    hylle: o.hylle,
    sku: o.sku,
    avvikId: o.avvikId,
    prioritet: "hoy",
    status: OPPDRAG_STATUS[o.status],
    opprettet: o.sendt,
    opprettetAv: "driftsleder",
    ...(o.tattAv ? { tattAv: o.tattAv } : {}),
    ...(o.status === "ferdig" || o.status === "avbrutt" ? { ferdigTid: o.oppdatert } : {}),
    ...(h?.avvik?.status === "funnet" || h?.avvik?.status === "svinn" ? { utfall: h.avvik.status } : {}),
  };
}

/** Oppdrag som skal vises: aktive, og avsluttede fra de siste 12 timene. Tilbaketrukne vises ikke. */
function synligeOppdrag(s: State): Oppgave[] {
  const grense = Date.now() - 12 * 3600e3;
  return (s.oppdrag ?? [])
    .filter((o) => o.status !== "avbrutt" && (o.status !== "ferdig" || new Date(o.oppdatert).getTime() > grense))
    .map((o) => oppdragSomOppgave(s, o));
}

// ---------- Avvik blir oppgaver av seg selv ----------
// Hvert åpent avvik skal ha noen på lageret som sjekker det. Avvik fra telling får et oppdrag
// (samme som «Send til skanner»), og avvik fra kameraet vises direkte som oppgaver.
// Når den ansatte er ferdig, lukkes avviket. Det forsvinner fra de åpne i dashbordet, men blir i loggen.

/** Lager oppdrag for åpne avvik som aldri er sendt til skanneren. Returnerer true hvis staten ble endret. */
export function sikreAvvikOppdrag(s: State): boolean {
  let endret = false;
  for (const h of apneAvvik(s)) {
    if ((s.oppdrag ?? []).some((o) => o.avvikId === h.id)) continue;
    sendOppdrag(s, h.id, { melding: "Laget automatisk fra avviket." });
    endret = true;
  }
  return endret;
}

export const trengerAvvikOppdrag = (s: State) => apneAvvik(s).some((h) => !(s.oppdrag ?? []).some((o) => o.avvikId === h.id));

const GRENSE_MS = 12 * 3600e3;

/** Et kameraavvik (matcheren) i samme form som en oppgave. Id-en er avvikets egen ("m_…"). */
function kameraAvvikSomOppgave(s: State, a: MatcherAvvik): Oppgave {
  const navn = a.sku ? vare(s, a.sku)?.navn ?? a.sku : undefined;
  const ferdig = a.status !== "apen";
  return {
    id: a.id,
    tittel: `${avvikTittel(a.type)}${navn ? `: ${navn.toLowerCase()}` : ""}`,
    beskrivelse: `${a.tekst}. Sjekk hylla og rett opp, så trykk Ferdig.`,
    type: "avvik",
    hylle: a.sone,
    ...(a.sku ? { sku: a.sku } : {}),
    prioritet: "hoy",
    status: ferdig ? "ferdig" : a.tattAv ? "pagar" : "ny",
    opprettet: a.tid,
    opprettetAv: "takkamera",
    ...(a.tattAv || a.loestAv ? { tattAv: a.tattAv ?? a.loestAv } : {}),
    ...(ferdig ? { ferdigTid: a.loestTid ?? a.tid } : {}),
  };
}

function synligeKameraAvvik(s: State): Oppgave[] {
  const grense = Date.now() - GRENSE_MS;
  return (s.matcherAvvik ?? [])
    .filter((a) => a.status === "apen" || (a.loestTid && Date.parse(a.loestTid) > grense))
    .map((a) => kameraAvvikSomOppgave(s, a));
}

// ---------- Bestillinger blir pakkeoppgaver ----------

const ORDRE = "ordre_";
const ordreFraId = (s: State, id: string) => (id.startsWith(ORDRE) ? s.ordrer.find((o) => o.id === id.slice(ORDRE.length)) : undefined);

function ordreSomOppgave(s: State, o: Ordre): Oppgave {
  const navn = vare(s, o.sku)?.navn ?? o.sku;
  const ferdig = o.status === "plukket";
  const plukket = o.plukket ?? 0;
  return {
    id: ORDRE + o.id,
    tittel: `Pakk ordre ${o.id}: ${o.antall} × ${navn}`,
    beskrivelse: ferdig
      ? `Alle ${o.antall} er skannet ut. Ført som salg på ordre ${o.id}.`
      : `Hent ${o.antall} × ${navn} fra ${o.hylle} og skann hver vare når du tar den ut. Da blir det ført som salg, ikke svinn.${plukket ? ` ${plukket} av ${o.antall} er skannet.` : ""}`,
    type: "pakk",
    hylle: o.hylle,
    sku: o.sku,
    prioritet: "normal",
    status: ferdig ? "ferdig" : o.tattAv ? "pagar" : "ny",
    opprettet: o.tid,
    opprettetAv: "driftsleder",
    ...(o.tattAv ? { tattAv: o.tattAv } : {}),
    ...(ferdig ? { ferdigTid: o.plukketTid ?? o.tid } : {}),
  };
}

function synligeOrdrer(s: State): Oppgave[] {
  const grense = Date.now() - GRENSE_MS;
  return s.ordrer
    .filter((o) => o.status === "apen" || (o.plukketTid && Date.parse(o.plukketTid) > grense))
    .map((o) => ordreSomOppgave(s, o));
}

/**
 * Alle oppgavene, sortert: ikke-ferdige først (høy prioritet, så eldst først), deretter ferdige (nyest først).
 * Tar også med oppdrag fra dashbordet. En avvik-oppgave regnes som ferdig hvis avviket allerede er lukket.
 */
export function oppgaveListe(s: State): Oppgave[] {
  const egne = (s.oppgaver ?? []).map((o) =>
    o.status !== "ferdig" && avvikLukket(s, o) ? { ...o, status: "ferdig" as const } : o,
  );
  const liste = [...egne, ...synligeOppdrag(s), ...synligeKameraAvvik(s), ...synligeOrdrer(s)];
  const vekt = (o: Oppgave) => (o.status === "ferdig" ? 2 : o.prioritet === "hoy" ? 0 : 1);
  return liste.sort((a, b) => {
    const v = vekt(a) - vekt(b);
    if (v !== 0) return v;
    if (a.status === "ferdig") return (b.ferdigTid ?? b.opprettet).localeCompare(a.ferdigTid ?? a.opprettet);
    return a.opprettet.localeCompare(b.opprettet);
  });
}

/** Oppgaven slik appen viser den: med varenavn og hyllenavn ferdig utfylt. */
export function oppgaveVisning(s: State, o: Oppgave) {
  const v = o.sku ? vare(s, o.sku) : undefined;
  const hylle = o.hylle ? s.hyller.find((h) => h.id === o.hylle) : undefined;
  return {
    ...o,
    vareNavn: v?.navn ?? null,
    swatch: v?.swatch ?? null,
    hylleNavn: hylle?.navn ?? o.hylle ?? null,
  };
}

/**
 * Første gang oppgavelista leses, legges det inn noen demo-oppgaver, så demoen har innhold
 * før dashbordet har et skjema for å lage dem. Etter «Nullstill demo» skjer det på nytt.
 * Returnerer true hvis staten ble endret.
 */
export function sikreDemoOppgaver(s: State): boolean {
  if (s.oppgaver) return false;
  const na = Date.now();
  const tid = (minSiden: number) => new Date(na - minSiden * 60e3).toISOString();
  const forslag: Array<Omit<Oppgave, "id" | "status" | "opprettetAv">> = [
    { tittel: "Fyll på kaffekopper", beskrivelse: "Det er få kaffekopper igjen på bordet. Hent flere fra lageret.", type: "pafyll", sku: "KAFFE-KOPP", prioritet: "hoy", opprettet: tid(25) },
    { tittel: "Sjekk brusboksene", beskrivelse: "Tell brusboksene og se at de står riktig.", type: "sjekk", sku: "BRUS-RED", prioritet: "normal", opprettet: tid(18) },
    { tittel: "Rydd fruktkurven", beskrivelse: "Fjern frukt som ikke ser fin ut, og si fra hvis noe må kastes.", type: "annet", sku: "BANAN", prioritet: "normal", opprettet: tid(9) },
  ];
  s.oppgaver = forslag
    .filter((o) => !o.sku || vare(s, o.sku))
    .map((o) => {
      const hylle = o.sku ? s.hyller.find((h) => h.innhold.some((i) => i.sku === o.sku))?.id : undefined;
      return { ...o, hylle, id: nyId("opg"), status: "ny", opprettetAv: "driftsleder" };
    });
  return true;
}

export type NyOppgave = {
  tittel: string;
  beskrivelse?: string;
  type?: OppgaveType;
  hylle?: string;
  sku?: string;
  avvikId?: string;
  prioritet?: "hoy" | "normal";
  opprettetAv?: Oppgave["opprettetAv"];
};

/** Lag en ny oppgave (fra dashbordet eller takkameraet). */
export function lagOppgave(s: State, data: NyOppgave): Oppgave {
  const tittel = data.tittel?.trim();
  if (!tittel) throw new Error("Oppgaven må ha en tittel");
  const sku = data.sku?.trim().toUpperCase() || undefined;
  if (sku && !vare(s, sku)) throw new Error(`Fant ikke varen ${sku}`);
  let hylle = data.hylle?.trim().toUpperCase() || undefined;
  if (hylle && !s.hyller.some((h) => h.id === hylle)) throw new Error(`Fant ikke hylla ${hylle}`);

  let avvikId: string | undefined;
  if (data.avvikId) {
    const h = s.hendelser.find((x) => x.id === data.avvikId);
    if (!h || h.type !== "mulig_svinn") throw new Error("Fant ikke avviket");
    if (h.avvik?.status !== "apen") throw new Error("Avviket er allerede lukket");
    avvikId = h.id;
    hylle ??= h.hylle;
  }
  const varensSku = sku ?? (avvikId ? s.hendelser.find((x) => x.id === avvikId)?.sku : undefined);
  if (!hylle && varensSku) hylle = s.hyller.find((h) => h.innhold.some((i) => i.sku === varensSku))?.id;

  const type = data.type && OPPGAVE_TYPER.includes(data.type) ? data.type : avvikId ? "avvik" : "annet";
  const oppgave: Oppgave = {
    id: nyId("opg"),
    tittel,
    ...(data.beskrivelse?.trim() ? { beskrivelse: data.beskrivelse.trim() } : {}),
    type,
    ...(hylle ? { hylle } : {}),
    ...(varensSku ? { sku: varensSku } : {}),
    ...(avvikId ? { avvikId } : {}),
    prioritet: data.prioritet === "hoy" ? "hoy" : "normal",
    status: "ny",
    opprettet: new Date().toISOString(),
    opprettetAv: data.opprettetAv === "takkamera" || data.opprettetAv === "ansatt" ? data.opprettetAv : "driftsleder",
  };
  (s.oppgaver ??= []).push(oppgave);
  return oppgave;
}

function finnOppgave(s: State, id: string): Oppgave {
  const o = s.oppgaver?.find((x) => x.id === id);
  if (!o) throw new Error("Fant ikke oppgaven");
  return o;
}

/** Den ansatte har åpnet et oppdrag på telefonen. Dashbordet viser da «Mottatt på skanneren». */
export function apnetOppgave(s: State, id: string, navn?: string): void {
  const o = s.oppdrag?.find((x) => x.id === id);
  if (o && o.status === "sendt") oppdaterOppdrag(s, id, { status: "mottatt", ...(navn?.trim() ? { tattAv: navn } : {}) });
}

/** En ansatt tar oppgaven («Jeg tar den»). Gjelder både egne oppgaver og oppdrag fra dashbordet. */
export function taOppgave(s: State, id: string, navn?: string): Oppgave {
  const hvem = navn?.trim() || "En ansatt";
  const kam = s.matcherAvvik?.find((x) => x.id === id);
  if (kam) {
    if (kam.status !== "apen") throw new Error("Avviket er allerede løst");
    kam.tattAv = hvem;
    return kameraAvvikSomOppgave(s, kam);
  }
  const ordre = ordreFraId(s, id);
  if (ordre) {
    if (ordre.status !== "apen") throw new Error("Ordren er allerede pakket");
    ordre.tattAv = hvem;
    return ordreSomOppgave(s, ordre);
  }
  const opp = s.oppdrag?.find((x) => x.id === id);
  if (opp) {
    if (!erAktiv(opp)) throw new Error("Oppdraget er allerede avsluttet");
    return oppdragSomOppgave(s, oppdaterOppdrag(s, id, { status: "pagar", ...(navn?.trim() ? { tattAv: navn } : {}) }));
  }
  const o = finnOppgave(s, id);
  if (o.status === "ferdig" || avvikLukket(s, o)) throw new Error("Oppgaven er allerede ferdig");
  o.status = "pagar";
  if (navn?.trim()) o.tattAv = navn.trim();
  return o;
}

/**
 * Oppgaven er gjort. For en avvik-oppgave må den ansatte si om varen ble funnet eller er svinn,
 * og da lukkes avviket med den vanlige lukkAvvik() – akkurat som når driftsleder gjør det i dashbordet.
 */
export function fullforOppgave(s: State, id: string, navn?: string, utfall?: "funnet" | "svinn", svar?: string): Oppgave {
  const kam = s.matcherAvvik?.find((x) => x.id === id);
  if (kam) {
    if (kam.status !== "apen") throw new Error("Avviket er allerede løst");
    kam.status = "loest";
    kam.loestAv = navn?.trim() || kam.tattAv || "En ansatt";
    kam.loestTid = new Date().toISOString();
    return kameraAvvikSomOppgave(s, kam);
  }
  const ordre = ordreFraId(s, id);
  if (ordre) {
    if (ordre.status !== "apen") return ordreSomOppgave(s, ordre); // ble ferdig da siste vare ble skannet
    const igjen = rest(ordre);
    if (igjen > 0) throw new Error(`Skann varene først: ${ordre.plukket ?? 0} av ${ordre.antall} er skannet ut.`);
    return ordreSomOppgave(s, ordre);
  }
  const opp = s.oppdrag?.find((x) => x.id === id);
  if (opp) {
    // Oppdrag: avklar avviket med den vanlige lukkAvvik(). Den setter oppdraget til «ferdig» selv.
    if (!erAktiv(opp)) throw new Error("Oppdraget er allerede avsluttet");
    if (utfall !== "funnet" && utfall !== "svinn") throw new Error("Velg om varen ble funnet eller er svinn");
    oppdaterOppdrag(s, id, { ...(navn?.trim() ? { tattAv: navn } : {}), ...(svar?.trim() ? { svar } : {}) });
    const h = s.hendelser.find((x) => x.id === opp.avvikId);
    if (h?.avvik?.status === "apen") lukkAvvik(s, opp.avvikId, utfall);
    if (erAktiv(opp)) oppdaterOppdrag(s, id, { status: "ferdig" });
    return oppdragSomOppgave(s, opp);
  }
  const o = finnOppgave(s, id);
  if (o.status === "ferdig") throw new Error("Oppgaven er allerede ferdig");
  if (o.avvikId && !avvikLukket(s, o)) {
    if (utfall !== "funnet" && utfall !== "svinn") throw new Error("Velg om varen ble funnet eller er svinn");
    lukkAvvik(s, o.avvikId, utfall);
    o.utfall = utfall;
  }
  o.status = "ferdig";
  o.ferdigTid = new Date().toISOString();
  if (navn?.trim()) o.tattAv ??= navn.trim();
  return o;
}

export type AvvikMelding = {
  sku: string;
  hylle?: string;
  grunn: AvvikGrunn;
  /** Mangler: hvor mange den ansatte faktisk ser. Skadet: hvor mange som er skadet. */
  antall?: number;
  notat?: string;
  meldtAv?: string;
};

/**
 * En ansatt melder avvik fra scannerappen. Det blir én ny mulig_svinn-hendelse med åpent avvik,
 * som dukker opp på avvik-siden i dashbordet.
 * - mangler: endring = sett − forventet (bare hvis det er færre enn systemet tror)
 * - skadet:  endring = −antall skadde
 * - feil_plass / annet: endring = 0 (beholdningen endres ikke)
 */
export function meldAvvik(s: State, m: AvvikMelding): Hendelse {
  const sku = m.sku?.trim().toUpperCase();
  if (!sku || !vare(s, sku)) throw new Error("Fant ikke varen");
  if (!AVVIK_GRUNNER.includes(m.grunn)) throw new Error("Ukjent grunn");

  const hylle =
    m.hylle?.trim().toUpperCase() ||
    s.hyller.find((h) => h.innhold.some((i) => i.sku === sku))?.id;
  if (!hylle) throw new Error("Varen står ikke på noen hylle");

  const forventet = beholdning(s, sku, hylle);
  const antall = Math.max(0, Math.round(Number(m.antall) || 0));
  let endring = 0;
  let aarsak = GRUNN_TEKST[m.grunn];
  if (m.grunn === "mangler") {
    if (antall >= forventet) throw new Error(`Systemet sier ${forventet}. Ser du like mange eller flere, mangler det ingenting.`);
    endring = antall - forventet;
    aarsak = `Meldt fra scanner: ser ${antall}, systemet sa ${forventet}`;
  } else if (m.grunn === "skadet") {
    if (antall < 1) throw new Error("Skriv hvor mange som er skadet");
    endring = -Math.min(antall, Math.max(forventet, 0));
    aarsak = `Meldt fra scanner: ${antall} skadet`;
  } else {
    aarsak = `Meldt fra scanner: ${GRUNN_TEKST[m.grunn].toLowerCase()}`;
  }

  const h: Hendelse = {
    id: nyId("h"),
    tid: new Date().toISOString(),
    hylle,
    sku,
    endring,
    type: "mulig_svinn",
    aarsak,
    avvik: { status: "apen" },
    ...(m.meldtAv?.trim() ? { meldtAv: m.meldtAv.trim().slice(0, 40) } : {}),
    ...(m.notat?.trim() ? { notat: m.notat.trim().slice(0, 500) } : {}),
  };
  s.hendelser.push(h);
  return h;
}

/** Gjør en scannet kode om til en SKU. Godtar «HYLLA:SKU», bare «SKU» og varens strekkode (EAN). */
export function kodeTilSku(s: State, kode: string): string | null {
  let ren = kode;
  try {
    ren = decodeURIComponent(kode);
  } catch {
    // allerede dekodet
  }
  ren = ren.trim().replace(/^HYLLA:/i, "").toUpperCase();
  return s.varer.find((v) => v.sku === ren || (v.strekkode && v.strekkode.toUpperCase() === ren))?.sku ?? null;
}

/** Varen slik scannerappen viser den. Bevisst uten avvik og historikk. */
export function skannerVare(s: State, sku: string) {
  const v = vare(s, sku);
  if (!v) return null;
  const hyller = s.hyller
    .filter((h) => h.innhold.some((i) => i.sku === sku))
    .map((h) => ({ id: h.id, navn: h.navn, nivaa: h.innhold.find((i) => i.sku === sku)?.nivaa ?? null, antall: beholdning(s, sku, h.id) }));
  return {
    sku: v.sku,
    navn: v.navn,
    farge: v.farge,
    storrelse: v.storrelse,
    swatch: v.swatch,
    bilde: v.bilder[0] ?? null,
    beskrivelse: v.beskrivelse ?? null,
    antall: beholdning(s, sku),
    hyller,
    oppgaver: oppgaveListe(s).filter((o) => o.sku === sku && o.status !== "ferdig").map((o) => oppgaveVisning(s, o)),
  };
}

/** Lite brukt i appen i dag, men nyttig for dashbordet: åpne avvik meldt fra scanneren. */
export function avvikFraScanner(s: State) {
  return apneAvvik(s).filter((h) => h.meldtAv || h.aarsak.startsWith("Meldt fra scanner"));
}
