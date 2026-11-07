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
};

export type HylleInnhold = { sku: string; nivaa: string };

export type Hylle = {
  id: string; // "B3"
  reol: string; // "B"
  navn: string; // "Reol B, hylle 3"
  innhold: HylleInnhold[];
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
};

// ---------- Telling ----------

export type TelleResultatVare = {
  sku: string;
  antall: number;
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
