import type { Vare } from "./types";

// SAM forstår engelsk. Når en vare mangler engelsk beskrivelse, lager vi en av farge og navn.
// Første treff vinner, så lengre ord står før kortere (vannflaske før flaske).

const FARGER: Record<string, string> = {
  svart: "black", sort: "black", hvit: "white", "grå": "grey", gra: "grey", "rød": "red", rod: "red",
  "blå": "blue", bla: "blue", "grønn": "green", gronn: "green", gul: "yellow", brun: "brown",
  beige: "beige", rosa: "pink", lilla: "purple", oransje: "orange", klar: "clear", gjennomsiktig: "clear",
};

const TING: [string, string][] = [
  ["vannflaske", "water bottle"], ["termos", "thermos bottle"], ["drikkeflaske", "drinking bottle"], ["flaske", "bottle"],
  ["brusboks", "soda can"], ["boks", "can"], ["kaffekopp", "coffee cup"], ["kopp", "cup"], ["krus", "mug"], ["glass", "drinking glass"],
  ["sjokolade", "chocolate bar"], ["kornpakke", "cereal box"], ["frokostblanding", "cereal box"], ["eske", "box"], ["pakke", "package"],
  ["notatbok", "notebook"], ["bok", "book"], ["penn", "pen"], ["blyant", "pencil"], ["saks", "scissors"], ["tape", "tape roll"],
  ["eple", "apple"], ["banan", "banana"], ["appelsin", "orange fruit"], ["sitron", "lemon"],
  ["hettegenser", "folded hoodie"], ["t-skjorte", "folded t-shirt"], ["skjorte", "folded shirt"], ["genser", "folded sweater"],
  ["bukse", "folded trousers"], ["jakke", "jacket"], ["lue", "beanie"], ["sokk", "pair of socks"], ["caps", "cap"], ["sekk", "backpack"],
  ["veske", "bag"], ["mobil", "phone"], ["telefon", "phone"], ["lader", "charger"], ["kabel", "cable"], ["mus", "computer mouse"],
  ["tastatur", "keyboard"], ["hodetelefoner", "headphones"], ["laptop", "laptop"], ["pc", "laptop"],
];

export function samPrompt(v: Pick<Vare, "navn" | "farge" | "prompt"> | undefined): string {
  if (!v) return "object";
  if (v.prompt?.trim()) return v.prompt.trim();
  return autoPrompt(v);
}

/** Søketekster å prøve i rekkefølge: egen beskrivelse først, så den automatiske engelske med farge. */
export function samPrompter(v: Pick<Vare, "navn" | "farge" | "prompt"> | undefined): string[] {
  if (!v) return ["object"];
  // Ikke prøv uten farge: «water bottle» finner også andre flasker på hylla, og da ser det ut som
  // varen fortsatt står der etter at den er tatt bort.
  return [...new Set([samPrompt(v), autoPrompt(v)].filter(Boolean))];
}

function autoPrompt(v: Pick<Vare, "navn" | "farge">): string {
  const navn = v.navn.toLowerCase();
  const farge = FARGER[(v.farge ?? "").toLowerCase().trim()] ?? Object.entries(FARGER).find(([no]) => navn.split(/[\s,]+/).includes(no))?.[1] ?? "";
  const ting = TING.find(([no]) => navn.includes(no))?.[1];
  // Finner vi ikke ordet, sender vi navnet slik det er. Det er bedre enn ingenting.
  return [farge, ting ?? v.navn].filter(Boolean).join(" ");
}
