// Typene appen får fra backenden (speiler src/lib/types.ts og src/lib/visning.ts i Next.js-appen).

export type HendelseType = "start" | "mottak" | "plukk" | "mulig_svinn" | "svinn" | "funnet" | "korrigering";

export type LoggRad = {
  id: string; tid: string; hylle: string; sku: string; navn: string;
  endring: number; type: HendelseType; aarsak: string; ref?: string; avvikStatus?: string;
};

export type Oversikt = {
  lager: string; varerPaaLager: number; taltIdag: number; antallHyller: number;
  apneAvvik: LoggRad[]; siste: LoggRad[];
};

export type HylleStatus = "avvik" | "ok" | "ikke_talt";

export type HylleRad = {
  id: string; reol: string; navn: string; status: HylleStatus; sistTalt: string | null;
  innhold: { sku: string; nivaa: string; navn: string; antall: number }[];
};

export type HylleDetalj = HylleRad & { forrige: { tid: string; bilde: string | null } | null; sporNaarUsikker: boolean; svarHoyt?: boolean };

export type Avvik = LoggRad & {
  nivaa: string | null; status: string; lukketTid: string | null;
  for: { tid: string; antall: number | null; bilde: string | null } | null;
  etter: { tid: string; antall: number | null; bilde: string | null; teller: string; kilde: string } | null;
  apneOrdrer: number;
};

export type VareRad = { sku: string; navn: string; swatch: string; antall: number; hyller: string[] };

export type VareDetalj = {
  sku: string; navn: string; farge: string; storrelse: string; leverandor: string | null; swatch: string;
  bilde: string | null; antall: number; apneSalg: number;
  perHylle: { hylle: string; antall: number; nivaa: string | null }[];
  innkjop: { id: string; bestilt: number; mottatt: number; bestiltDato: string; plukket: number; mottak: { tid: string; antall: number }[] } | null;
  historikk: LoggRad[];
};

export type Kamera = {
  id: string; navn: string; hylle: string; sistSett: string; sisteBilde?: string;
  bilderIdag: number; lader?: boolean; batteri?: number; aktiv: boolean;
};

export type Innstillinger = {
  lager: string; svinnTerskel: number; sporNaarUsikker: boolean; svarHoyt: boolean; kameraIntervallMin: number;
};

export type InnstillingerSvar = {
  innstillinger: Innstillinger; reoler: number; hyller: number; teller: string; stemme: string; lagring: string;
};

export type ForslagEndring = {
  sku: string; navn: string; nivaa: string; swatch: string; forrige: number; na: number;
  sikkerhet: number; alternativ: number | null;
  /** Tellingen er for usikker til å kalle noe svinn. Lagres ikke før brukeren bekrefter tallet. */
  tellIgjen?: string;
  deler: { type: HendelseType; endring: number; aarsak: string; ref?: string }[];
};

export type Forslag = {
  hylle: string; tid: string; teller: string; forrigeTellingId?: string; forrigeTid?: string;
  antall: Record<string, number>; endringer: ForslagEndring[]; uendret: number; ukjente: string[];
  bildekvalitet: "god" | "ok" | "darlig"; kommentar: string; sekunder: number;
};

export type Kort =
  | { type: "vare"; sku: string; navn: string; swatch: string; beholdning: number; hyller: { hylle: string; antall: number }[]; po?: { id: string; bestilt: number; mottatt: number; plukket: number } }
  | { type: "avvik"; id: string; sku: string; navn: string; hylle: string; endring: number; tid: string }
  | { type: "logg"; tittel: string; rader: { tid: string; tekst: string; endring: number; type: HendelseType }[] };

export type SporSvar = { sporsmal?: string; svar: string; kort: Kort[]; kilde: string; lyd?: string; feil?: string; trengerTekst?: boolean };
