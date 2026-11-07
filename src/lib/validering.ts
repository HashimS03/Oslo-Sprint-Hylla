import { z } from "zod";
import type { ChatMelding } from "./spor";

// Grenser for det klienten kan sende til Spør Hylla. Hindrer at noen bruker API-et som en gratis,
// ubegrenset Claude-proxy med lange, oppdiktede samtaler.

export const MAKS_MELDINGER = 12;
export const MAKS_SPORSMAL = 500; // tegn i det brukeren spør om nå
export const MAKS_HISTORIKK_TEKST = 800; // tegn per tidligere melding

const melding = z.object({
  rolle: z.enum(["bruker", "hylla"]),
  tekst: z.string(),
});

export const historikkSkjema = z.array(melding).max(100);

/**
 * Rydder historikken fra klienten: bare de siste meldingene, kuttet lengde, og siste melding må være
 * fra brukeren. Returnerer null hvis den ikke kan brukes.
 */
export function ryddHistorikk(input: unknown): ChatMelding[] | null {
  const r = historikkSkjema.safeParse(input);
  if (!r.success) return null;
  const ms = r.data
    .filter((m) => m.tekst.trim())
    .slice(-MAKS_MELDINGER)
    .map((m) => ({ rolle: m.rolle, tekst: m.tekst.slice(0, MAKS_HISTORIKK_TEKST) }));
  const siste = ms.at(-1);
  if (!siste || siste.rolle !== "bruker" || siste.tekst.length > MAKS_SPORSMAL) return null;
  return ms;
}
