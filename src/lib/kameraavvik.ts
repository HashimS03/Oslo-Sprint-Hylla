import type { MatcherAvvik, State } from "./types";

// Avklaring av et avvik fra kameraet (matcheren). Samme valg i dashbordet og i appen.
// Avviket blir liggende i loggen med utfall, hvem og når. Det er bare de åpne som vises som oppgaver.

export type KameraUtfall = "funnet" | "salg" | "svinn" | "falsk_alarm";
export const KAMERA_UTFALL: KameraUtfall[] = ["funnet", "salg", "svinn", "falsk_alarm"];

export const UTFALL_TEKST: Record<KameraUtfall, string> = {
  funnet: "Funnet, lagt tilbake",
  salg: "Det var et salg",
  svinn: "Bekreft svinn",
  falsk_alarm: "Falsk alarm",
};

/** Valgene som gir mening for avvikstypen. Uttak kan være salg eller svinn; resten er funnet eller falsk alarm. */
export function valgFor(a: MatcherAvvik): KameraUtfall[] {
  return a.type === "uregistrert_uttak" || a.type === "feil_plass" ? ["salg", "svinn", "funnet", "falsk_alarm"] : ["funnet", "falsk_alarm"];
}

export function losKameraAvvik(s: State, id: string, utfall: KameraUtfall, navn?: string): MatcherAvvik {
  const a = s.matcherAvvik?.find((x) => x.id === id);
  if (!a) throw new Error("Fant ikke avviket");
  if (a.status !== "apen") throw new Error("Avviket er allerede avklart");
  if (!KAMERA_UTFALL.includes(utfall)) throw new Error("Ukjent valg");
  a.status = utfall === "falsk_alarm" ? "falsk_alarm" : "loest";
  a.utfall = utfall;
  a.loestAv = navn?.trim() || a.tattAv || "Driftsleder";
  a.loestTid = new Date().toISOString();

  // Uttaket kameraet bokførte, føres nå som salg eller svinn. Funnet: kameraet ser varen igjen og fører den inn selv.
  if ((utfall === "salg" || utfall === "svinn") && a.sku) {
    const t = Date.parse(a.tid);
    const h = [...s.hendelser]
      .reverse()
      .find((x) => x.sku === a.sku && x.hylle === a.sone && x.ref === "kamera" && x.endring < 0 && x.type === "plukk" && Math.abs(Date.parse(x.tid) - t) < 10 * 60e3);
    if (h) {
      h.type = utfall === "svinn" ? "svinn" : "plukk";
      h.aarsak = utfall === "svinn" ? "Svinn, bekreftet fra kameraavvik" : "Salg, bekreftet fra kameraavvik";
      h.ref = a.id;
    }
  }
  return a;
}
