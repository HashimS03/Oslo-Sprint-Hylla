import Constants from "expo-constants";
import { lesPin } from "./pin";
import { settTilgang } from "./tilgangStatus";

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
 * I en ferdig app (release-bygg, `__DEV__` er false) krever vi https://, så PIN-koden
 * og dataene ikke sendes ukryptert. Vanlig http er bare lov mens dere utvikler.
 */
export function usikkerAdresse(): string | null {
  if (__DEV__) return null;
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (!env) return "Appen mangler serveradresse. Sett EXPO_PUBLIC_API_URL til en https://-adresse før dere bygger appen.";
  if (!/^https:\/\//i.test(env)) return `Serveradressen må starte med https:// i den ferdige appen (nå: ${env}).`;
  return null;
}

export const PIN_MELDING = "Serveren krever tilgangskode. Gå til Innstillinger og skriv inn tilgangskoden (PIN) dere har fått.";

export class ApiFeil extends Error {
  constructor(melding: string, public status: number, public data?: unknown) {
    super(melding);
  }

  /** Sant når serveren svarte 401 fordi tilgangskoden mangler eller er feil. */
  get trengerPin(): boolean {
    return this.status === 401 && !!(this.data as { trengerPin?: boolean } | undefined)?.trengerPin;
  }
}

async function svar<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && (data as { trengerPin?: boolean }).trengerPin) {
    settTilgang("laast"); // viser PIN-skjermen (se app/_layout.tsx)
    throw new ApiFeil(PIN_MELDING, 401, data);
  }
  if (!res.ok) throw new ApiFeil((data as { feil?: string }).feil ?? `Feil fra serveren (${res.status})`, res.status, data);
  return data as T;
}

/** Felles for alle kall: sjekker adressen, legger på tilgangskoden og gjør om nettverksfeil til ApiFeil. */
async function kall<T>(sti: string, init: RequestInit, nettverksfeil: string): Promise<T> {
  const usikker = usikkerAdresse();
  if (usikker) throw new ApiFeil(usikker, 0);
  const pin = await lesPin();
  const headers = new Headers(init.headers);
  if (pin) headers.set("x-hylla-secret", pin);
  try {
    return await svar<T>(await fetch(apiUrl() + sti, { ...init, headers }));
  } catch (e) {
    if (e instanceof ApiFeil) throw e;
    throw new ApiFeil(`${nettverksfeil} (${e instanceof Error ? e.message : String(e)})`, 0);
  }
}

export function hent<T>(sti: string): Promise<T> {
  return kall<T>(sti, { headers: { accept: "application/json" } }, `Får ikke kontakt med Hylla-serveren på ${apiUrl()}`);
}

export function send<T>(sti: string, body: unknown): Promise<T> {
  return kall<T>(
    sti,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    `Får ikke kontakt med Hylla-serveren på ${apiUrl()}`,
  );
}

export function sendSkjema<T>(sti: string, skjema: FormData): Promise<T> {
  return kall<T>(sti, { method: "POST", body: skjema }, `Kunne ikke sende opptaket til ${apiUrl()}`);
}
