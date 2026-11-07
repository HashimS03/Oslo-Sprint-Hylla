import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Archivo_700Bold, Archivo_800ExtraBold } from "@expo-google-fonts/archivo";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { F } from "@/lib/tema";

SplashScreen.preventAutoHideAsync();

export default function RotLayout() {
  const [lastet, feil] = useFonts({
    Archivo_700Bold, Archivo_800ExtraBold,
    IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (lastet || feil) SplashScreen.hideAsync();
  }, [lastet, feil]);

  if (!lastet && !feil) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: F.bg } }}>
        <Stack.Screen name="(faner)" />
        <Stack.Screen name="tell/[hylle]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="kamera/[hylle]" options={{ gestureEnabled: false, contentStyle: { backgroundColor: F.mork } }} />
      </Stack>
    </>
  );
}
