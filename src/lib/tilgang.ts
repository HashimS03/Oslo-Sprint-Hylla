// Enkel tilgangskontroll for Hylla: én felles PIN for hele lageret.
//
// Sett HYLLA_PIN i miljøet (Vercel og .env.local) for å slå den på. Uten HYLLA_PIN er appen åpen,
// slik den har vært (fint lokalt). Brukes av middleware, så koden må virke i Edge-runtime.
//
// - Nettleseren: brukeren taster PIN-en én gang på /tilgang og får en httpOnly-cookie.
// - Mobilappen og skript: sender PIN-en i headeren x-hylla-secret.

export const COOKIE = "hylla_tilgang";
export const HEADER = "x-hylla-secret";

export const pin = () => process.env.HYLLA_PIN || "";
export const pinAktiv = () => pin().length > 0;

/** Cookien inneholder en hash av PIN-en, ikke selve PIN-en. */
export async function tilgangsToken(p = pin()): Promise<string> {
  const data = new TextEncoder().encode(`hylla-tilgang:${p}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sammenligner uten å avsløre hvor langt like strengene er (motvirker tidsangrep). */
export function likeTrygt(a: string, b: string): boolean {
  if (!a || !b) return false;
  const n = Math.max(a.length, b.length);
  let forskjell = a.length ^ b.length;
  for (let i = 0; i < n; i++) forskjell |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return forskjell === 0;
}

/** Har forespørselen gyldig PIN (header) eller gyldig cookie? Alltid sann når PIN ikke er satt. */
export async function harTilgang(headers: Headers, cookie: string | undefined): Promise<boolean> {
  if (!pinAktiv()) return true;
  const header = headers.get(HEADER);
  if (header && likeTrygt(header, pin())) return true;
  if (cookie && likeTrygt(cookie, await tilgangsToken())) return true;
  return false;
}
