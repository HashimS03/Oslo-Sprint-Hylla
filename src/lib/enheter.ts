import { createHash, randomBytes } from "node:crypto";
import { endreState, hentEnheter, hentState } from "./store";
import { nyId } from "./lager";
import { likeHemmeligheter } from "./vern";
import type { Enhet } from "./types";

// Kobling av telefoner og PC-er til Hylla.
//
// 1. Driftslederen viser en QR-kode i dashboardet (Innstillinger → Telefoner) med en engangskode (gyldig i 10 minutter).
// 2. Den nye telefonen skanner koden og får en lang, tilfeldig nøkkel som den husker for godt.
//    Nettleseren lagrer nøkkelen i en cookie, Expo-appen i SecureStore på telefonen.
// 3. Hver forespørsel tar med nøkkelen. Middleware slipper bare inn kjente nøkler.
//
// Den aller første enheten kobles med lederkoden (HYLLA_LEDERKODE), skrevet inn én gang.

export const COOKIE = "hylla_enhet";
/** Lengste levetid nettlesere godtar for en cookie (400 dager). Fornyes hver gang siden åpnes. */
export const COOKIE_MAKS_ALDER = 400 * 24 * 3600;
const KODE_GYLDIG_MS = 10 * 60_000;
const MAKS_ENHETER = 200;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const nyNokkel = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** Kobling kreves på Vercel (og ved `next start`). Lokalt med `npm run dev` er den av, med mindre HYLLA_KREV_KOBLING=1. */
export function kreverKobling(): boolean {
  return process.env.NODE_ENV === "production" || process.env.HYLLA_KREV_KOBLING === "1";
}

// Enhetene holdes i minnet i 30 sekunder, så ikke hver forespørsel må lese databasen.
// En fjernet enhet mister derfor tilgangen innen et halvt minutt på andre serverinstanser.
type Mellomlager = { tid: number; perHash: Map<string, Enhet> };
const g = globalThis as unknown as { __hyllaEnheter?: Mellomlager };

function glemMellomlager() {
  g.__hyllaEnheter = undefined;
}

export async function finnEnhet(nokkel: string | null | undefined): Promise<Enhet | null> {
  if (!nokkel || nokkel.length > 200) return null;
  const h = hash(nokkel);
  let m = g.__hyllaEnheter;
  // Ukjent nøkkel: spør på nytt med en gang (bare litt struping). Middleware kjører på en annen serverinstans
  // enn innloggingen, så en enhet som nettopp ble koblet til, ville ellers blitt sendt tilbake til /koble i
  // opptil et halvt minutt.
  const gammel = !m || Date.now() - m.tid > 30_000 || (!m.perHash.has(h) && Date.now() - m.tid > 500);
  if (gammel) {
    m = { tid: Date.now(), perHash: new Map((await hentEnheter()).map((e) => [e.nokkelHash, e])) };
    g.__hyllaEnheter = m;
  }
  return m!.perHash.get(h) ?? null;
}

/** Henter nøkkelen fra `authorization: Bearer …` (appen) eller fra cookien (nettleseren). */
export function nokkelFra(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = req.headers.get("cookie") ?? "";
  const treff = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  return treff ? decodeURIComponent(treff.slice(COOKIE.length + 1)) : null;
}

/** Lager en ny engangskode til QR-koden. */
export async function lagKoblingskode(): Promise<{ kode: string; utloper: string }> {
  const kode = nyNokkel(16);
  const utloper = new Date(Date.now() + KODE_GYLDIG_MS).toISOString();
  await endreState((s) => {
    const na = new Date().toISOString();
    const gyldige = (s.koblingskoder ?? []).filter((k) => k.utloper > na).slice(-20);
    s.koblingskoder = [...gyldige, { kodeHash: hash(kode), utloper }];
  });
  return { kode, utloper };
}

/** Kobler til en ny enhet hvis koden eller lederkoden stemmer. Gir null hvis ingen av dem stemmer. */
export async function kobleTil(navn: string, bevis: { kode?: string; lederkode?: string }): Promise<{ nokkel: string; enhet: Enhet } | null> {
  const fasit = process.env.HYLLA_LEDERKODE;
  const lederOk = !!bevis.lederkode && !!fasit && likeHemmeligheter(bevis.lederkode, fasit);
  const nokkel = nyNokkel();
  const enhet = await endreState((s) => {
    const na = new Date().toISOString();
    const kodeOk = !!bevis.kode && (s.koblingskoder ?? []).some((k) => k.utloper > na && k.kodeHash === hash(bevis.kode!));
    if (!kodeOk && !lederOk) return null;
    s.enheter ??= [];
    if (s.enheter.length >= MAKS_ENHETER) throw new Error("Det er for mange enheter. Fjern noen først.");
    const ny: Enhet = { id: nyId("e"), navn, nokkelHash: hash(nokkel), opprettet: na };
    s.enheter.push(ny);
    return ny;
  });
  glemMellomlager();
  return enhet ? { nokkel, enhet } : null;
}

export async function fjernEnhet(id: string): Promise<void> {
  await endreState((s) => {
    const for_ = s.enheter?.length ?? 0;
    s.enheter = (s.enheter ?? []).filter((e) => e.id !== id);
    if (s.enheter.length === for_) throw new Error("Fant ikke enheten");
  });
  glemMellomlager();
}

/** Enhetene uten nøkkel-hash, til visning. */
export async function enhetsliste() {
  const s = await hentState();
  return (s.enheter ?? []).map(({ id, navn, opprettet }) => ({ id, navn, opprettet }));
}
