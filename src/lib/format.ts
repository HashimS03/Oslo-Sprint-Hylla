// Formatering som kan brukes både på server og klient. Alltid norsk tid.
const TZ = "Europe/Oslo";

export const klokke = (iso: string) =>
  new Date(iso).toLocaleTimeString("nb-NO", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

export const dagNokkel = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });

export function dagTittel(iso: string): string {
  const d = dagNokkel(iso);
  const idag = dagNokkel(new Date().toISOString());
  const igaar = dagNokkel(new Date(Date.now() - 864e5).toISOString());
  if (d === idag) return "I dag";
  if (d === igaar) return "I går";
  return new Date(iso).toLocaleDateString("nb-NO", { timeZone: TZ, weekday: "long", day: "numeric", month: "short" });
}

export const kortDato = (iso: string) =>
  new Date(iso).toLocaleDateString("nb-NO", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });

export const fortegn = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

export const TYPE_NAVN: Record<string, string> = {
  start: "Start",
  mottak: "Mottak",
  plukk: "Salg",
  mulig_svinn: "Mulig svinn",
  svinn: "Svinn",
  funnet: "Funnet",
  korrigering: "Korrigering",
};

export function typeFarge(type: string, endring: number) {
  if (type === "mulig_svinn" || type === "svinn") return "text-rod";
  if (endring > 0) return "text-gronn";
  return "text-dempet";
}

export function hilsen(): string {
  const t = Number(new Date().toLocaleTimeString("nb-NO", { timeZone: TZ, hour: "2-digit", hour12: false }));
  if (t < 10) return "God morgen.";
  if (t < 17) return "Hei.";
  return "God kveld.";
}
