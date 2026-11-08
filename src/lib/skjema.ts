import { z } from "zod";

// Zod-skjemaer for det API-et tar imot. Data som ikke passer, avvises med 400 før noe lagres
// eller sendes til en betalt AI-tjeneste.

/** Bilde som sendes til telleren (Vercel tillater uansett maks 4,5 MB per forespørsel). */
export const STORT_BILDE = 4_000_000;
/** Lite bilde som lagres i databasen (miniatyr, varebilde). */
export const LITE_BILDE = 400_000;

const bilde = (maks: number) =>
  z
    .string()
    .max(maks, `Bildet er for stort (maks ${Math.round(maks / 1000)} kB)`)
    .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, "Bildet må være en JPEG-, PNG- eller WebP-data-URL");

const id = z.string().trim().min(1).max(64);
const hylleId = z.string().trim().min(1).max(12);
const antall = z.number().int().min(0).max(100_000);
const antallPerVare = z.record(z.string().max(64), antall);
const tekst = (maks: number) => z.string().trim().max(maks);

export const AvvikSkjema = z.object({ handling: z.enum(["funnet", "svinn", "salg"]) });

export const InnstillingerSkjema = z
  .object({
    lager: tekst(80).min(1),
    svinnTerskel: z.number().int().min(1).max(100),
    sporNaarUsikker: z.boolean(),
    svarHoyt: z.boolean(),
    kameraIntervallMin: z.number().int().min(1).max(1440),
  })
  .partial()
  .strict();

export const KameraPingSkjema = z.object({
  kameraId: id,
  navn: tekst(80).optional(),
  hylle: hylleId,
  lader: z.boolean().optional(),
  batteri: z.number().min(0).max(100).optional(),
});

/** /api/kamera/bilde og /api/kamera/ramme. */
export const KameraBildeSkjema = z.object({
  kameraId: id,
  hylle: hylleId,
  bilde: bilde(STORT_BILDE),
  liten: bilde(LITE_BILDE).optional(),
  demo: z.boolean().optional(),
  tving: z.boolean().optional(),
});

export const TakbildeSkjema = z.object({
  kameraId: id,
  bilde: bilde(STORT_BILDE),
  liten: bilde(LITE_BILDE).optional(),
  demo: z.boolean().optional(),
  tving: z.boolean().optional(),
  demoTall: z.record(z.string().max(12), antallPerVare).optional(),
  sone: hylleId.optional(),
});

export const TellSkjema = z.object({
  hylle: hylleId,
  bilde: bilde(STORT_BILDE).optional(),
  demo: z.boolean().optional(),
});

// Fra forslaget brukes bare feltene under. Resten (forklaringer, endringer) regner serveren ut selv.
export const TellLagreSkjema = z.object({
  forslag: z.object({
    hylle: hylleId,
    teller: z.string().max(20),
    forrigeTellingId: id.optional(),
    antall: antallPerVare,
  }),
  korrigert: antallPerVare.optional(),
  bilde: bilde(LITE_BILDE).optional(),
  kilde: z.enum(["mobil", "kamera", "manuell"]).optional(),
});

export const NyVareSkjema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÆØÅ0-9][A-ZÆØÅ0-9._-]{0,39}$/, "SKU kan bare ha bokstaver, tall, punktum, bindestrek og understrek"),
  navn: tekst(80).min(1),
  farge: tekst(40).default(""),
  storrelse: tekst(20).default(""),
  swatch: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Fargen må være en hex-farge, f.eks. #1E1E20"),
  hylle: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÆØÅ][A-ZÆØÅ0-9-]{0,9}$/, "Hylla trenger en kort ID som starter med en bokstav, f.eks. T1"),
  nivaa: tekst(40).optional(),
  // Som før: bare de tre første bildene lagres.
  bilder: z.array(bilde(LITE_BILDE)).max(10).transform((b) => b.slice(0, 3)).optional(),
  beskrivelse: tekst(500).optional(),
  antall: z.number().int().min(0).max(100_000).optional(),
  prompt: tekst(200).optional(),
  strekkode: tekst(64).optional(),
});

export const EndreVareSkjema = z.object({
  navn: tekst(80).optional(),
  farge: tekst(40).optional(),
  storrelse: tekst(20).optional(),
  leverandor: tekst(80).optional(),
  beskrivelse: tekst(500).optional(),
  strekkode: tekst(64).optional(),
  prompt: tekst(200).optional(),
});

const ChatMeldingSkjema = z.object({
  rolle: z.enum(["bruker", "hylla"]),
  tekst: z.string().max(2000),
});
export const HistorikkSkjema = z.array(ChatMeldingSkjema).max(50);

export const SporSkjema = z.object({ historikk: HistorikkSkjema.min(1) });

export const StemmeTekstSkjema = z.object({
  tekst: tekst(2000).min(1),
  historikk: HistorikkSkjema.optional(),
});

export const KobleSkjema = z
  .object({
    kode: tekst(100).min(10).optional(),
    lederkode: tekst(200).min(1).optional(),
    navn: tekst(60).optional(),
  })
  .refine((b) => b.kode || b.lederkode, "Mangler kode");
