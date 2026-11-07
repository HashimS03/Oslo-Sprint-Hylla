import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Tilgangskoden (PIN) som backenden krever når HYLLA_PIN er satt på serveren.
// Den lagres kryptert på telefonen (Keychain på iPhone, Keystore på Android),
// aldri i koden eller i EXPO_PUBLIC_*-variabler, som havner i selve appen.
// På web finnes ikke SecureStore, så der bruker vi nettleserens localStorage.

const NOKKEL = "hylla-tilgangskode";

// Vi husker koden i minnet så vi slipper å lese lagringen ved hvert kall.
let husket: string | null | undefined;

function web() {
  return Platform.OS === "web" && typeof localStorage !== "undefined";
}

export async function lesPin(): Promise<string | null> {
  if (husket !== undefined) return husket;
  try {
    husket = web() ? localStorage.getItem(NOKKEL) : await SecureStore.getItemAsync(NOKKEL);
  } catch {
    husket = null;
  }
  return husket;
}

export async function lagrePin(pin: string): Promise<void> {
  const ren = pin.trim();
  if (!ren) return slettPin();
  if (web()) localStorage.setItem(NOKKEL, ren);
  else await SecureStore.setItemAsync(NOKKEL, ren);
  husket = ren;
}

export async function slettPin(): Promise<void> {
  if (web()) localStorage.removeItem(NOKKEL);
  else await SecureStore.deleteItemAsync(NOKKEL);
  husket = null;
}
