import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Nøkkelen som viser at denne telefonen er koblet til Hylla.
// Lagres kryptert i SecureStore (i nettleser: localStorage) og holdes i minnet mens appen kjører.

const NOKKEL = "hylla_enhet_nokkel";
let iMinnet: string | null = null;

/** Leses én gang ved oppstart (se app/_layout.tsx), før appen gjør API-kall. */
export async function lastNokkel(): Promise<void> {
  try {
    iMinnet = Platform.OS === "web" ? (globalThis.localStorage?.getItem(NOKKEL) ?? null) : await SecureStore.getItemAsync(NOKKEL);
  } catch {
    iMinnet = null;
  }
}

export const hentNokkel = () => iMinnet;

export async function lagreNokkel(nokkel: string): Promise<void> {
  iMinnet = nokkel;
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(NOKKEL, nokkel);
    else await SecureStore.setItemAsync(NOKKEL, nokkel);
  } catch (e) {
    console.warn("Kunne ikke lagre nøkkelen", e);
  }
}

export async function glemNokkel(): Promise<void> {
  iMinnet = null;
  try {
    if (Platform.OS === "web") globalThis.localStorage?.removeItem(NOKKEL);
    else await SecureStore.deleteItemAsync(NOKKEL);
  } catch {
    // ingenting å gjøre
  }
}

/** Henter koden fra en skannet QR-kode, f.eks. https://hylla.vercel.app/koble?k=abc → abc. */
export function kodeFraQr(data: string): string | null {
  try {
    const url = new URL(data);
    return url.pathname.endsWith("/koble") ? url.searchParams.get("k") : null;
  } catch {
    return null;
  }
}
