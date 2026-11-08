import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { z } from "zod";

// Felles beskyttelse for API-rutene:
// - begrens(): grense på antall kall per IP-adresse
// - lesJson() / valider(): sjekker data med et zod-skjema
// - demomodus(): om demofunksjoner (nullstill, tøm, demotall) er lov
// - likeHemmeligheter(): sammenligner hemmeligheter uten å lekke tid

// ---------------- Grense på antall kall ----------------
// Enkel teller i minnet per serverinstans. Den stopper skript som hamrer løs på API-et,
// men på Vercel har hver instans sin egen teller, så grensen er omtrentlig.
// Alle telefoner på lageret deler ofte samme IP-adresse, derfor er grensene romslige.

export const GRENSER = {
  /** Kall som går til en betalt AI-tjeneste (Claude, Meta, ElevenLabs). */
  ai: { maks: 60, vinduMs: 60_000 },
  /** Kamerabilder. Et live-kamera sender ett bilde i sekundet, så denne tåler ti kameraer bak samme IP. */
  kamera: { maks: 600, vinduMs: 60_000 },
  /** Kobling av nye enheter. Lav grense, så ingen kan prøve mange lederkoder. */
  kobling: { maks: 10, vinduMs: 60_000 },
} as const;

type Vindu = { start: number; antall: number };
const g = globalThis as unknown as { __hyllaGrenser?: Map<string, Vindu> };
const vinduer = (g.__hyllaGrenser ??= new Map<string, Vindu>());

function klientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "ukjent";
}

/** Returnerer et 429-svar hvis grensen er nådd, ellers null. */
export function begrens(req: Request, type: keyof typeof GRENSER): NextResponse | null {
  const { maks, vinduMs } = GRENSER[type];
  const na = Date.now();
  const nokkel = `${type}:${klientIp(req)}`;
  const v = vinduer.get(nokkel);
  if (!v || na - v.start >= vinduMs) {
    if (vinduer.size > 10_000) for (const [k, x] of vinduer) if (na - x.start >= vinduMs) vinduer.delete(k);
    vinduer.set(nokkel, { start: na, antall: 1 });
    return null;
  }
  v.antall++;
  if (v.antall <= maks) return null;
  const sek = Math.max(1, Math.ceil((v.start + vinduMs - na) / 1000));
  return NextResponse.json(
    { feil: `For mange forespørsler. Prøv igjen om ${sek} sekunder.` },
    { status: 429, headers: { "retry-after": String(sek) } },
  );
}

// ---------------- Validering ----------------

/** Leser JSON-body og sjekker den mot skjemaet. Gir enten { data } eller { svar } (et 400-svar). */
export async function lesJson<T extends z.ZodType>(req: Request, skjema: T): Promise<{ data: z.infer<T> } | { svar: NextResponse }> {
  let raa: unknown;
  try {
    raa = await req.json();
  } catch {
    return { svar: NextResponse.json({ feil: "Ugyldig JSON" }, { status: 400 }) };
  }
  return valider(raa, skjema);
}

export function valider<T extends z.ZodType>(raa: unknown, skjema: T): { data: z.infer<T> } | { svar: NextResponse } {
  const r = skjema.safeParse(raa);
  if (r.success) return { data: r.data };
  const detaljer = r.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "body"}: ${i.message}`);
  return { svar: NextResponse.json({ feil: "Ugyldige data", detaljer }, { status: 400 }) };
}

// ---------------- Demomodus ----------------

/**
 * Demofunksjoner: «Nullstill demo», «Tøm lageret» og at klienten kan be om demotelling eller oppgi tall selv.
 * Lov lokalt (npm run dev). På Vercel bare når HYLLA_DEMOMODUS=1, f.eks. rett før en presentasjon.
 */
export function demomodus(): boolean {
  return process.env.NODE_ENV === "development" || process.env.HYLLA_DEMOMODUS === "1";
}

// ---------------- Hemmeligheter ----------------

/** Sammenligner to hemmeligheter på konstant tid, så svartiden ikke røper hvor mye som var riktig. */
export function likeHemmeligheter(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
