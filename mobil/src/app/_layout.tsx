import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Archivo_700Bold, Archivo_800ExtraBold } from "@expo-google-fonts/archivo";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { F } from "@/lib/tema";
import { lastNavn, useNavn } from "@/lib/navn";

SplashScreen.preventAutoHideAsync();

export default function RotLayout() {
  const [fonter, feil] = useFonts({
    Archivo_700Bold, Archivo_800ExtraBold,
    IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });
  const { lastet: navnLastet } = useNavn();

  // Hent navnet til den ansatte fra telefonen én gang ved oppstart.
  useEffect(() => {
    lastNavn();
  }, []);

  const klar = (fonter || !!feil) && navnLastet;
  useEffect(() => {
    if (klar) SplashScreen.hideAsync();
  }, [klar]);

  if (!klar) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: F.bg } }}>
        {/* Scannerappen */}
        <Stack.Screen name="index" />
        <Stack.Screen name="scann" options={{ contentStyle: { backgroundColor: F.mork } }} />
        <Stack.Screen name="oppgaver" />
        <Stack.Screen name="oppgave/[id]" />
        <Stack.Screen name="varer" />
        <Stack.Screen name="vare/[sku]" />
        <Stack.Screen name="meld-avvik" options={{ presentation: "modal" }} />
        <Stack.Screen name="spor" />
        <Stack.Screen name="innstillinger" />
        {/* Takkamera (Daniel) */}
        <Stack.Screen name="takkamera" />
        <Stack.Screen name="skann" options={{ contentStyle: { backgroundColor: F.bg } }} />
        <Stack.Screen name="kameraer" />
        <Stack.Screen name="kamera/[hylle]" options={{ gestureEnabled: false, contentStyle: { backgroundColor: F.mork } }} />
        <Stack.Screen name="ny-hylle" />
        <Stack.Screen name="ny-vare" />
      </Stack>
    </>
  );
}
