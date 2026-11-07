import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Navnet til den ansatte som bruker scanneren. Lagres på telefonen og sendes med når hen
// tar en oppgave eller melder et avvik, så driftsleder ser hvem som gjorde hva.

const NOKKEL = "hylla_ansatt_navn";
let navn: string | null = null;
let lastet = false;
const lyttere = new Set<() => void>();
const varsle = () => lyttere.forEach((l) => l());

async function les(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(NOKKEL) ?? null;
    return await SecureStore.getItemAsync(NOKKEL);
  } catch {
    return null;
  }
}

/** Leses én gang ved oppstart (se app/_layout.tsx). */
export async function lastNavn(): Promise<void> {
  navn = (await les())?.trim() || null;
  lastet = true;
  varsle();
}

export async function lagreNavn(nytt: string): Promise<void> {
  const rent = nytt.trim().slice(0, 40);
  navn = rent || null;
  varsle();
  try {
    if (Platform.OS === "web") {
      if (rent) globalThis.localStorage?.setItem(NOKKEL, rent);
      else globalThis.localStorage?.removeItem(NOKKEL);
    } else if (rent) await SecureStore.setItemAsync(NOKKEL, rent);
    else await SecureStore.deleteItemAsync(NOKKEL);
  } catch {
    // Får vi ikke lagret, gjelder navnet bare til appen lukkes. Det er greit.
  }
}

export const hentNavn = () => navn;

/** { navn, lastet } som oppdateres når navnet endres. */
export function useNavn() {
  const n = useSyncExternalStore(
    (l) => (lyttere.add(l), () => lyttere.delete(l)),
    () => navn,
  );
  const l = useSyncExternalStore(
    (cb) => (lyttere.add(cb), () => lyttere.delete(cb)),
    () => lastet,
  );
  return { navn: n, lastet: l };
}
