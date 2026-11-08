import { beholdning, vare } from "./lager";
import type { Ordre, State } from "./types";

// Bestillinger (plukkordrer) som pakkeoppgaver i appen.
// Den ansatte tar ordren, henter varene og skanner dem ut. Skanningen føres mot ordren, så nedgangen
// blir et salg og ikke svinn. På kamerahyller teller kameraet nedgangen; ellers skriver skanningen den.

/** Hvor mange som gjenstår på ordren. */
export const rest = (o: Ordre) => Math.max(0, o.antall - (o.plukket ?? 0));

/** Åpne ordrer, eldst først. */
export function apneOrdrer(s: State): Ordre[] {
  return s.ordrer.filter((o) => o.status === "apen").sort((a, b) => a.tid.localeCompare(b.tid));
}

/** Fører et antall mot en ordre. Lukker ordren når alt er plukket. */
export function plukkMotOrdre(o: Ordre, antall: number) {
  o.plukket = (o.plukket ?? 0) + antall;
  if (rest(o) <= 0) {
    o.status = "plukket";
    o.plukketTid = new Date().toISOString();
  }
}

/** En skannet vare føres mot den eldste åpne ordren på varen. Returnerer ordren, hvis det fantes en. */
export function skannMotOrdre(s: State, sku: string, antall: number): Ordre | undefined {
  const o = apneOrdrer(s).find((x) => x.sku === sku && rest(x) > 0);
  if (o) plukkMotOrdre(o, Math.min(antall, rest(o)));
  return o;
}

const nesteNr = (s: State) => Math.max(1000, ...s.ordrer.map((o) => Number(o.id.replace(/\D/g, "")) || 0)) + 1;

/** Lager noen tilfeldige bestillinger på varer som ligger på lager, helst på hyller med kamera. */
export function lagDemoOrdrer(s: State, antall = 3): Ordre[] {
  const kandidater = s.hyller
    .flatMap((h) => h.innhold.map((i) => ({ hylle: h.id, sku: i.sku, kamera: !!h.sone && h.sone.type !== "gang", har: beholdning(s, i.sku, h.id) })))
    .filter((k) => k.har > 0 && vare(s, k.sku) && !s.ordrer.some((o) => o.sku === k.sku && o.status === "apen"));
  // Kamerahyllene først, så demoen viser at skanning + kamera gir salg og ikke avvik.
  const blandet = [...kandidater].sort(() => Math.random() - 0.5).sort((a, b) => Number(b.kamera) - Number(a.kamera));
  const nye: Ordre[] = [];
  for (const k of blandet.slice(0, antall)) {
    const o: Ordre = {
      id: String(nesteNr(s)),
      sku: k.sku,
      hylle: k.hylle,
      antall: Math.min(k.har, 1 + Math.floor(Math.random() * 2)),
      tid: new Date(Date.now() - nye.length * 60e3).toISOString(),
      status: "apen",
    };
    s.ordrer.push(o);
    nye.push(o);
  }
  return nye;
}
