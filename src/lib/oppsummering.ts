import type { Hendelse, State } from "./types";
import { vare } from "./lager";

// Lager en kort norsk setning om hva en lagret telling endret, så Hylla kan si det høyt.
// Svinn nevnes alltid tydelig (F4: «assistenten sier fra»).

// Varenavnet står først («Kaffekopp: 2 kom inn»), så vi slipper å bøye det i flertall.
function varenavn(s: State, sku: string): string {
  const navn = vare(s, sku)?.navn ?? sku;
  // «Brusboks, rød» leses bedre som «Brusboks rød».
  return navn.replace(/,\s*/g, " ").replace(/^./, (c) => c.toUpperCase());
}

const antall = (n: number) => (n === 1 ? "én" : String(n));

function setning(s: State, h: Hendelse): string {
  const n = antall(Math.abs(h.endring));
  const navn = varenavn(s, h.sku);
  switch (h.type) {
    case "mottak":
      return `${navn}: ${n} kom inn${h.ref ? ` på ${h.ref}` : ""}.`;
    case "plukk":
      return `${navn}: ${n} ble plukket${h.ref ? ` til ordre ${h.ref}` : ""}.`;
    case "mulig_svinn":
      return `${navn}: ${n} mangler, og ingen plukkordre forklarer det. Det er mulig svinn.`;
    default:
      return `${navn}: ${n} ${h.endring > 0 ? "flere" : "færre"} enn ventet.`;
  }
}

export function oppsummerTelling(s: State, hylleId: string, hendelser: Hendelse[], venter: string[] = []): string {
  const hylle = s.hyller.find((h) => h.id === hylleId)?.navn ?? `Hylle ${hylleId}`;
  const omtelling = venter.length
    ? `${venter.map((sku) => varenavn(s, sku)).join(" og ")} må telles på nytt før vi kaller det svinn.`
    : "";
  if (hendelser.length === 0)
    return omtelling ? `${hylle} er talt. ${omtelling}` : `${hylle} er talt, og alt stemmer med lagerloggen.`;
  const deler = hendelser.map((h) => setning(s, h));
  const svinn = hendelser.some((h) => h.type === "mulig_svinn");
  return [`${hylle} er talt.`, ...deler, omtelling, svinn ? "Sjekk avviket i loggen." : "Det er lagt i loggen."]
    .filter(Boolean)
    .join(" ");
}
