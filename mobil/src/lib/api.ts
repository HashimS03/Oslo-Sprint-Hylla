import Constants from "expo-constants";
import { router } from "expo-router";
import { hentNokkel } from "./enhet";

// Adressen til Next.js-backenden.
// 1. EXPO_PUBLIC_API_URL hvis den er satt (f.eks. https://hylla.vercel.app)
// 2. ellers samme maskin som Metro-serveren, port 3000 (bra når dere kjører `npm run dev` lokalt)
export function apiUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, "");
  const vert = Constants.expoConfig?.hostUri?.split(":")[0];
  return vert ? `http://${vert}:3000` : "http://localhost:3000";
}

/**
 * Feilmelding hvis adressen ikke er trygg, ellers null.
 * I en ferdig app (release-bygg, `__DEV__` er false) krever vi https://, så
 * dataene ikke sendes ukryptert. Vanlig http er bare lov mens dere utvikler.
 */
export function usikkerAdresse(): string | null {
  if (__DEV__) return null;
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (!env) return "Appen mangler serveradresse. Sett EXPO_PUBLIC_API_URL til en https://-adresse før dere bygger appen.";
  if (!/^https:\/\//i.test(env)) return `Serveradressen må starte med https:// i den ferdige appen (nå: ${env}).`;
  return null;
}

export class ApiFeil extends Error {
  constructor(melding: string, public status: number, public data?: unknown) {
    super(melding);
  }

}

async function svar<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Serveren kjenner ikke telefonen (ikke koblet, eller fjernet): send brukeren til koblingsskjermen.
    if (res.status === 401 && (data as { trengerKobling?: boolean }).trengerKobling) router.replace("/koble");
    throw new ApiFeil((data as { feil?: string }).feil ?? `Feil fra serveren (${res.status})`, res.status, data);
  }
  return data as T;
}

/** Felles for alle kall: sjekker adressen og gjør om nettverksfeil til ApiFeil. */
async function kall<T>(sti: string, init: RequestInit, nettverksfeil: string): Promise<T> {
  const usikker = usikkerAdresse();
  if (usikker) throw new ApiFeil(usikker, 0);
  const headers = new Headers(init.headers);
  // Nøkkelen som viser at telefonen er koblet til Hylla (se lib/enhet.ts).
  const nokkel = hentNokkel();
  if (nokkel) headers.set("authorization", `Bearer ${nokkel}`);
  // Tidsavbrudd litt over serverens grense (60 s), så skjermen aldri henger for alltid.
  const avbryt = new AbortController();
  const tidsur = setTimeout(() => avbryt.abort(), 70_000);
  try {
    return await svar<T>(await fetch(apiUrl() + sti, { ...init, headers, signal: avbryt.signal }));
  } catch (e) {
    if (e instanceof ApiFeil) throw e;
    if (avbryt.signal.aborted) throw new ApiFeil("Serveren svarte ikke på 70 sekunder. Prøv igjen.", 0);
    throw new ApiFeil(`${nettverksfeil} (${e instanceof Error ? e.message : String(e)})`, 0);
  } finally {
    clearTimeout(tidsur);
  }
}

export function hent<T>(sti: string): Promise<T> {
  return kall<T>(sti, { headers: { accept: "application/json" } }, `Får ikke kontakt med Hylla-serveren på ${apiUrl()}`);
}

export function send<T>(sti: string, body: unknown, ekstra: Record<string, string> = {}): Promise<T> {
  return kall<T>(
    sti,
    { method: "POST", headers: { "content-type": "application/json", ...ekstra }, body: JSON.stringify(body) },
    `Får ikke kontakt med Hylla-serveren på ${apiUrl()}`,
  );
}

export function sendSkjema<T>(sti: string, skjema: FormData): Promise<T> {
  return kall<T>(sti, { method: "POST", body: skjema }, `Kunne ikke sende opptaket til ${apiUrl()}`);
}

export function patch<T>(sti: string, body: unknown): Promise<T> {
  // Går også gjennom kall(), så nøkkelen og adressesjekken er med.
  return kall<T>(
    sti,
    { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    `Får ikke kontakt med Hylla-serveren på ${apiUrl()}`,
  );
}
