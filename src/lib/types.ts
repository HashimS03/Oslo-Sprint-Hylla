// Datamodellen til Hylla. Lagerloggen (hendelser) er sannheten:
// beholdningen er alltid summen av endringene for en vare på en hylle.

export type Vare = {
  sku: string;
  navn: string;
  farge: string;
  storrelse: string;
  leverandor?: string;
  /** Farge brukt som fargeprøve i UI-et. */
  swatch: string;
  /** Referansebilder (data-URL-er) som hjelper telleren å kjenne igjen varen. */
  bilder: string[];
  beskrivelse?: string;
  /** Strekkoden (EAN) skanneren leser. Mangler den, kobles den første gang noen skanner varen. */
  strekkode?: string;
  /** Kort engelsk beskrivelse brukt som prompt til SAM 3.1 («red soda can»). */
  prompt?: string;
};

export type HylleInnhold = { sku: string; nivaa: string };

export type Hylle = {
  id: string; // "B3"
  reol: string; // "B"
  navn: string; // "Reol B, hylle 3"
  innhold: HylleInnhold[];
  /** Hvor hylla ligger i bildet til et takkamera. Tall fra 0 til 1 (andel av bildets bredde og høyde). */
  sone?: Sone;
};

export type Sone = {
  kamera: string;
  x: number;
  y: number;
  b: number;
  h: number;
  /** "hylle" (standard) følger en hylle. "gang" er en sone som skal være tom; står det noe der for lenge, er det en gjenglemt vare. */
  type?: "hylle" | "gang";
};

/** Det takkamera sender til matcheren. Kameraet endrer aldri lagerloggen selv. */
export type KameraHendelse = {
  id: string;
  tid: string; // ISO
  kamera: string;
  /** Hylle-id (B3, H1) eller gang-sonen. */
  sone: string;
  /** uttak = færre varer enn sist, plassering = flere varer enn sist, gjenglemt = noe har stått i gang-sonen for lenge. */
  type: "uttak" | "plassering" | "gjenglemt" | "feil_vare";
  /** feil_vare = en vare som ikke hører hjemme i sonen står der (antall 0 = den er fjernet igjen). */
  /** Varen kameraet kjente igjen. Mangler for gjenglemt når kameraet ikke vet hva det er. */
  sku?: string;
  antall: number;
  /** Plassering: hører varen hjemme i denne sonen? false = mulig feilplassert. */
  hjemmehorende?: boolean;
  /** 0 til 1. Lav verdi betyr at matcheren bør be om en kontrolltelling. */
  sikkerhet: number;
  /** Nedskalert stillbilde av sonen. */
  bilde?: string;
};

export type HendelseType =
  | "start"
  | "mottak"
  | "plukk"
  | "mulig_svinn"
  | "svinn"
  | "funnet"
  | "korrigering";

export type AvvikStatus = "apen" | "funnet" | "svinn" | "lukket";

export type Hendelse = {
  id: string;
  tid: string; // ISO
  hylle: string;
  sku: string;
  endring: number;
  type: HendelseType;
  aarsak: string;
  ref?: string; // PO-nummer eller ordrenummer
  tellingId?: string;
  /** Bare for type mulig_svinn. */
  avvik?: { status: AvvikStatus; forrigeTellingId?: string; lukketTid?: string };
  /** Navnet til den ansatte som meldte avviket fra scannerappen. */
  meldtAv?: string;
  /** Fritekst fra den ansatte (scannerappen). */
  notat?: string;
};

export type Telling = {
  id: string;
  tid: string;
  hylle: string;
  kilde: "mobil" | "kamera" | "manuell";
  /** Nedskalert bilde (data-URL), brukes i før/etter-visningen. */
  bilde?: string;
  antall: Record<string, number>;
  teller: string; // "claude" | "demo" | "yolo"
};

export type Innkjop = {
  id: string; // PO-2291
  sku: string;
  hylle: string;
  bestilt: number;
  mottatt: number;
  bestiltDato: string;
  leverandor: string;
};

export type Ordre = {
  id: string;
  sku: string;
  hylle: string;
  antall: number;
  tid: string;
  status: "apen" | "plukket";
};

export type Kamera = {
  id: string;
  navn: string;
  hylle: string;
  sistSett: string;
  sisteBilde?: string;
  bilderIdag: number;
  lader?: boolean;
  batteri?: number;
};

export type Innstillinger = {
  lager: string;
  svinnTerskel: number;
  sporNaarUsikker: boolean;
  svarHoyt: boolean;
  kameraIntervallMin: number;
};

export type State = {
  versjon: number;
  varer: Vare[];
  hyller: Hylle[];
  hendelser: Hendelse[];
  tellinger: Telling[];
  innkjop: Innkjop[];
  ordrer: Ordre[];
  kameraer: Kamera[];
  innstillinger: Innstillinger;
  /** Oppgaver til de ansatte (scannerappen). Valgfri, så eldre lagrede tilstander fortsatt virker. */
  oppgaver?: Oppgave[];
  /** Oppdrag sendt til skannerne. Mangler i eldre lagrede tilstander. */
  oppdrag?: Oppdrag[];
  /** Hendelser fra takkamera, nyeste sist. Matcheren leser dem og sammenligner med skanninger. */
  kameraHendelser?: KameraHendelse[];
  /** Sist kjente antall per sone og vare, så kameraet kan se hva som har endret seg. */
  soneStand?: Record<string, Record<string, number>>;
  /** Når kameraet sist så hver sone (heartbeat), så matcheren vet at «ingen hendelse» betyr «ingen bevegelse». */
  soneSett?: Record<string, string>;
  /** Skanninger fra skanneren (eller simulatoren). */
  skanninger?: Skann[];
  /** Avvik matcheren har funnet mellom kamera og skanner. */
  matcherAvvik?: MatcherAvvik[];
  /** Hvilke kamerahendelser og skanninger matcheren har behandlet: id → "ok" eller avvik-id. */
  matchet?: Record<string, string>;
};

// ---------- Oppdrag til skanneren ----------

/**
 * sendt: ligger klar for skannerne · mottatt: en skanner har åpnet det ·
 * pagar: en ansatt er på vei / sjekker · ferdig: sjekket (avviket er avklart) ·
 * avbrutt: trukket tilbake fra dashboardet.
 */
export type OppdragStatus = "sendt" | "mottatt" | "pagar" | "ferdig" | "avbrutt";

export type Oppdrag = {
  id: string;
  /** Avviket (hendelse-id) oppdraget gjelder. */
  avvikId: string;
  hylle: string;
  sku: string;
  /** Antall stk som mangler. */
  antall: number;
  /** Fritekst fra driftslederen, f.eks. «Sjekk bak på hylla». */
  melding?: string;
  /** Hvilken skanner/ansatt det er sendt til. Tom = alle skannere. */
  til?: string;
  status: OppdragStatus;
  sendt: string; // ISO
  oppdatert: string; // ISO
  /** Skanneren som tok oppdraget. */
  tattAv?: string;
  /** Kort svar fra den ansatte. */
  svar?: string;
};

export type Skann = {
  id: string;
  tid: string; // ISO
  sku: string;
  antall: number;
  type: "plukk" | "plassering";
};

export type MatcherAvvikType = "feil_vare" | "feil_plass" | "uregistrert_uttak" | "skannet_uten_uttak" | "mulig_feilplassert" | "gjenglemt";

export type MatcherAvvik = {
  id: string;
  tid: string;
  type: MatcherAvvikType;
  sone: string;
  /** Feil plass: hjemmesonen til varen som ble skannet. */
  sone2?: string;
  sku?: string;
  antall: number;
  tekst: string;
  bilde?: string;
  status: "apen" | "loest" | "falsk_alarm";
  /** Meldingen som sendes til skanneren (pip + tekst). */
  varsel?: { melding: string };
};

// ---------- Oppgaver (scannerappen) ----------

export type OppgaveStatus = "ny" | "pagar" | "ferdig";
export type OppgaveType = "pafyll" | "sjekk" | "avvik" | "annet";

export type Oppgave = {
  id: string;
  tittel: string;
  beskrivelse?: string;
  type: OppgaveType;
  hylle?: string;
  sku?: string;
  /** Kobling til en mulig_svinn-hendelse. Når oppgaven blir ferdig, lukkes avviket. */
  avvikId?: string;
  prioritet: "hoy" | "normal";
  status: OppgaveStatus;
  opprettet: string; // ISO
  opprettetAv: "driftsleder" | "ansatt" | "takkamera";
  tattAv?: string;
  ferdigTid?: string;
  /** Hva den ansatte svarte for en avvik-oppgave. */
  utfall?: "funnet" | "svinn";
};

// ---------- Telling ----------

/** En deteksjon, som en YOLO-boks: plassering i bildet (0 til 1, fra øvre venstre hjørne) og sikkerhet. */
export type Bokse = { x: number; y: number; b: number; h: number; c: number };

export type TelleResultatVare = {
  sku: string;
  antall: number;
  /** Boksene som ble funnet, hvis telleren kan gi dem (SAM 3.1). Koordinatene gjelder bildet telleren fikk. */
  bokser?: Bokse[];
  sikkerhet: number; // 0..1
  alternativ: number | null;
  merknad: string;
};

export type TelleResultat = {
  varer: TelleResultatVare[];
  ukjente: string[];
  bildekvalitet: "god" | "ok" | "darlig";
  kommentar: string;
};

export type ForslagEndring = {
  sku: string;
  navn: string;
  nivaa: string;
  swatch: string;
  forrige: number;
  na: number;
  sikkerhet: number;
  alternativ: number | null;
  /** Hver endring er delt i deler som forklares hver for seg. */
  deler: {
    type: HendelseType;
    endring: number;
    aarsak: string;
    ref?: string;
  }[];
};

export type Forslag = {
  hylle: string;
  tid: string;
  teller: string;
  forrigeTellingId?: string;
  forrigeTid?: string;
  antall: Record<string, number>;
  endringer: ForslagEndring[];
  uendret: number;
  ukjente: string[];
  bildekvalitet: TelleResultat["bildekvalitet"];
  kommentar: string;
  sekunder: number;
};

// ---------- Kort i Spør Hylla ----------

export type Kort =
  | {
      type: "vare";
      sku: string;
      navn: string;
      swatch: string;
      beholdning: number;
      hyller: { hylle: string; antall: number }[];
      po?: { id: string; bestilt: number; mottatt: number; plukket: number };
    }
  | {
      type: "avvik";
      id: string;
      sku: string;
      navn: string;
      hylle: string;
      endring: number;
      tid: string;
    }
  | {
      type: "logg";
      tittel: string;
      rader: { tid: string; tekst: string; endring: number; type: HendelseType }[];
    };
