// Enkel rate-begrensning i minnet (per serverinstans). Stopper en enkelt nettleser eller et skript
// som kaller de dyre rutene i løkke. Det er ikke en full beskyttelse på Vercel, der det kan være
// flere instanser: sett i tillegg utgiftstak hos Anthropic, ElevenLabs og Meta (se README).

type Vindu = { start: number; antall: number };
const g = globalThis as unknown as { __hyllaRate?: Map<string, Vindu> };
const vinduer = (g.__hyllaRate ??= new Map());

/** Grenser per minutt per IP for ruter som koster penger. */
const GRENSER: [prefiks: string, perMinutt: number][] = [
  ["/api/kamera/ramme", 120], // kameratelefonen sender et bilde i sekundet når noe skjer
  ["/api/kamera/bilde", 20],
  ["/api/tell/lagre", 30],
  ["/api/tell", 15],
  ["/api/spor", 20],
  ["/api/stemme", 20],
  ["/api/tilgang", 10], // forsøk på å gjette PIN-en
];

/** Finner grensen som gjelder for stien, med prefikset som telles sammen. */
export function grenseFor(sti: string): { prefiks: string; perMinutt: number } | null {
  const treff = GRENSER.find(([p]) => sti === p || sti.startsWith(`${p}/`));
  return treff ? { prefiks: treff[0], perMinutt: treff[1] } : null;
}

/** Returnerer antall sekunder å vente hvis grensen er nådd, ellers 0. */
export function sjekkRate(nokkel: string, perMinutt: number, na = Date.now()): number {
  const v = vinduer.get(nokkel);
  if (!v || na - v.start >= 60_000) {
    vinduer.set(nokkel, { start: na, antall: 1 });
    if (vinduer.size > 5000) for (const [k, x] of vinduer) if (na - x.start >= 60_000) vinduer.delete(k);
    return 0;
  }
  v.antall += 1;
  return v.antall > perMinutt ? Math.ceil((v.start + 60_000 - na) / 1000) : 0;
}
