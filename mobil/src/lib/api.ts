import Constants from "expo-constants";

// Adressen til Next.js-backenden.
// 1. EXPO_PUBLIC_API_URL hvis den er satt (f.eks. https://hylla.vercel.app)
// 2. ellers samme maskin som Metro-serveren, port 3000 (bra når dere kjører `npm run dev` lokalt)
export function apiUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, "");
  const vert = Constants.expoConfig?.hostUri?.split(":")[0];
  return vert ? `http://${vert}:3000` : "http://localhost:3000";
}

export class ApiFeil extends Error {
  constructor(melding: string, public status: number, public data?: unknown) {
    super(melding);
  }
}

async function svar<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiFeil((data as { feil?: string }).feil ?? `Feil fra serveren (${res.status})`, res.status, data);
  return data as T;
}

export async function hent<T>(sti: string): Promise<T> {
  try {
    return await svar<T>(await fetch(apiUrl() + sti, { headers: { accept: "application/json" } }));
  } catch (e) {
    if (e instanceof ApiFeil) throw e;
    throw new ApiFeil(`Får ikke kontakt med Hylla-serveren på ${apiUrl()}`, 0);
  }
}

export async function send<T>(sti: string, body: unknown): Promise<T> {
  try {
    return await svar<T>(await fetch(apiUrl() + sti, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  } catch (e) {
    if (e instanceof ApiFeil) throw e;
    throw new ApiFeil(`Får ikke kontakt med Hylla-serveren på ${apiUrl()}`, 0);
  }
}

export async function sendSkjema<T>(sti: string, skjema: FormData): Promise<T> {
  try {
    return await svar<T>(await fetch(apiUrl() + sti, { method: "POST", body: skjema }));
  } catch (e) {
    if (e instanceof ApiFeil) throw e;
    throw new ApiFeil(`Får ikke kontakt med Hylla-serveren på ${apiUrl()}`, 0);
  }
}
