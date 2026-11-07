// Formatering, alltid norsk tid.
const TZ = "Europe/Oslo";

export const klokke = (iso: string) =>
  new Date(iso).toLocaleTimeString("nb-NO", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

export const dagNokkel = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });

export const erIdag = (iso: string) => dagNokkel(iso) === dagNokkel(new Date().toISOString());

export function dagTittel(iso: string): string {
  const d = dagNokkel(iso);
  if (d === dagNokkel(new Date().toISOString())) return "I dag";
  if (d === dagNokkel(new Date(Date.now() - 864e5).toISOString())) return "I går";
  return new Date(iso).toLocaleDateString("nb-NO", { timeZone: TZ, weekday: "long" });
}

export const datoLang = (iso: string) =>
  new Date(iso).toLocaleDateString("nb-NO", { timeZone: TZ, weekday: "long", day: "numeric", month: "short" }).replace(".", "");

export const kortDato = (iso: string) =>
  new Date(iso).toLocaleDateString("nb-NO", { timeZone: TZ, day: "numeric", month: "short" });

export const ukedag = (iso: string) => new Date(iso).toLocaleDateString("nb-NO", { timeZone: TZ, weekday: "long" });

export const fortegn = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

export const TYPE_NAVN: Record<string, string> = {
  start: "Start", mottak: "Mottak", plukk: "Salg", mulig_svinn: "Mulig svinn", svinn: "Svinn", funnet: "Funnet", korrigering: "Korrigering",
};

export function hilsen(): string {
  const t = Number(new Date().toLocaleTimeString("nb-NO", { timeZone: TZ, hour: "2-digit", hour12: false }));
  if (t < 10) return "God morgen.";
  if (t < 17) return "Hei.";
  return "God kveld.";
}

export function sistTalt(iso: string | null): string {
  if (!iso) return "Ikke talt";
  if (erIdag(iso)) return klokke(iso);
  return dagTittel(iso);
}

export const smaa = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
export const stor = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
