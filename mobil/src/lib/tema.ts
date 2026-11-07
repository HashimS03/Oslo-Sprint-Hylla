import { useSyncExternalStore } from "react";
import { Platform, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";

// Farger og skrift fra dashboardet, så skanneren og dashboardet ser ut som samme program.
// Verdiene speiler src/app/globals.css: MORK = [data-theme="dark"], LYS = standard.

const MORK = {
  bg: "#0E1214",
  /** Bakgrunn for kort, felt og lister. */
  kort: "#182024",
  meny: "#151B1E",
  /** Hvit tekst over kamerabilder og mørke flater. */
  hvit: "#FFFFFF",
  tekst: "#EEF1EF",
  dempet: "#A3ADB2",
  /** Mørk tekst og kant på gule knapper, som .knapp-gul i dashboardet. */
  blekk: "#1B2226",
  gul: "#F4C430",
  /** Gul brukt som tekst. Mørkere i lys modus så den kan leses. */
  gultekst: "#F4C430",
  gullys: "#2A2510",
  gulkant: "#5C4C12",
  gronn: "#6FE0A5",
  gronnlys: "#143224",
  rod: "#FF7A6B",
  rodlys: "#2B1714",
  rodkant: "#8A3A30",
  kant: "#2E383D",
  linje: "#232C30",
  graa: "#222B2F",
  skifer: "#0A0D0F",
  /** Bakgrunn bak kamerabildet. Mørk i begge modusene. */
  mork: "#0A0D0F",
  blaa: "#9CBCFF",
  blalys: "#1D2B45",
  lillalys: "#2A2140",
};

const LYS: typeof MORK = {
  bg: "#F3F4F2",
  kort: "#FFFFFF",
  meny: "#FFFFFF",
  hvit: "#FFFFFF",
  tekst: "#1B2226",
  dempet: "#4E5A61",
  blekk: "#1B2226",
  gul: "#F4C430",
  gultekst: "#7A5800",
  gullys: "#FCF0C8",
  gulkant: "#E2C25A",
  gronn: "#1E6B45",
  gronnlys: "#D5EEDF",
  rod: "#B3362A",
  rodlys: "#FBE3DF",
  rodkant: "#C8402F",
  kant: "#C9D1CE",
  linje: "#E4E8E6",
  graa: "#E6EAE8",
  skifer: "#2B3134",
  mork: "#111517",
  blaa: "#1E3F8A",
  blalys: "#DCE6FA",
  lillalys: "#ECE4FA",
};

export type Tema = "mork" | "lys";

/** Fargene for gjeldende modus. Objektet byttes ut på stedet når modusen endres. */
export const F = { ...MORK };

export const S = {
  display: "Archivo_800ExtraBold",
  displayMedium: "Archivo_700Bold",
  tekst: "IBMPlexSans_400Regular",
  tekstMedium: "IBMPlexSans_500Medium",
  tekstHalvfet: "IBMPlexSans_600SemiBold",
  tekstFet: "IBMPlexSans_700Bold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
};

// ---- Valgt modus, lagret på telefonen (samme mønster som navn.ts) ----

const NOKKEL = "hylla_tema";
let tema: Tema = "mork";
let versjon = 0;
const lyttere = new Set<() => void>();

function bruk(nytt: Tema) {
  tema = nytt;
  Object.assign(F, nytt === "lys" ? LYS : MORK);
  versjon++;
  lyttere.forEach((l) => l());
}

/** Leses én gang ved oppstart (se app/_layout.tsx). Mørk er standard, som dashboardet. */
export async function lastTema(): Promise<void> {
  let lagret: string | null = null;
  try {
    lagret = Platform.OS === "web"
      ? globalThis.localStorage?.getItem(NOKKEL) ?? null
      : await SecureStore.getItemAsync(NOKKEL);
  } catch {
    // Ingen lagret modus. Da blir det mørk.
  }
  bruk(lagret === "lys" ? "lys" : "mork");
}

export async function settTema(nytt: Tema): Promise<void> {
  if (nytt === tema) return;
  bruk(nytt);
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(NOKKEL, nytt);
    else await SecureStore.setItemAsync(NOKKEL, nytt);
  } catch {
    // Får vi ikke lagret, gjelder valget bare til appen lukkes.
  }
}

export function useTema(): Tema {
  return useSyncExternalStore((l) => (lyttere.add(l), () => lyttere.delete(l)), () => tema);
}

/**
 * Som StyleSheet.create, men stilene regnes ut på nytt når modusen byttes, så F.* alltid
 * gir fargene for gjeldende modus. Bruk: const st = lagStil(() => ({ ... }));
 */
type Stiler = Parameters<typeof StyleSheet.create>[0];

export function lagStil<T extends Stiler>(lag: () => T & Stiler): Readonly<T> {
  let bufret: Readonly<T> | null = null;
  let forVersjon = -1;
  const hent = (): Readonly<T> => {
    if (!bufret || forVersjon !== versjon) {
      bufret = StyleSheet.create(lag());
      forVersjon = versjon;
    }
    return bufret;
  };
  return new Proxy({} as Readonly<T>, {
    get: (_m, k) => hent()[k as keyof T],
    has: (_m, k) => k in hent(),
    ownKeys: () => Reflect.ownKeys(hent()),
    getOwnPropertyDescriptor: (_m, k) => Object.getOwnPropertyDescriptor(hent(), k),
  });
}
