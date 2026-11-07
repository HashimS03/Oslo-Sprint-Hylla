import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Archivo_700Bold, Archivo_800ExtraBold } from "@expo-google-fonts/archivo";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { F } from "@/lib/tema";
import { sjekkTilgang } from "@/lib/tilgang";
import { useTilgang } from "@/lib/tilgangStatus";

SplashScreen.preventAutoHideAsync();

export default function RotLayout() {
  const [lastet, feil] = useFonts({
    Archivo_700Bold, Archivo_800ExtraBold,
    IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });
  const tilgang = useTilgang();

  // Spør serveren én gang ved oppstart om telefonen har tilgang (PIN).
  useEffect(() => {
    sjekkTilgang();
  }, []);

  const klar = (lastet || !!feil) && tilgang !== "sjekker";
  useEffect(() => {
    if (klar) SplashScreen.hideAsync();
  }, [klar]);

  if (!klar) return null;
  const laast = tilgang === "laast";

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: F.bg } }}>
        {/* Når serveren krever PIN og koden mangler, er bare PIN-skjermen tilgjengelig.
            Blir appen låst mens du bruker den (koden fjernet eller byttet), sendes du hit automatisk. */}
        <Stack.Protected guard={!laast}>
          <Stack.Screen name="(faner)" />
          <Stack.Screen name="tell/[hylle]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="kamera/[hylle]" options={{ gestureEnabled: false, contentStyle: { backgroundColor: F.mork } }} />
          <Stack.Screen name="avvik/[id]" />
          <Stack.Screen name="vare/[sku]" />
          <Stack.Screen name="innstillinger" />
          <Stack.Screen name="kameraer" />
          <Stack.Screen name="ny-hylle" />
          <Stack.Screen name="ny-vare" />
        </Stack.Protected>
        <Stack.Protected guard={laast}>
          <Stack.Screen name="tilgang" options={{ gestureEnabled: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
