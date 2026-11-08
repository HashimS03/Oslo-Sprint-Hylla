import { useEffect, useState } from "react";
import { router, Stack } from "expo-router";
import { hent } from "@/lib/api";
import { lastNokkel } from "@/lib/enhet";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Archivo_700Bold, Archivo_800ExtraBold } from "@expo-google-fonts/archivo";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { F, lastTema, useTema } from "@/lib/tema";
import { lastNavn, useNavn } from "@/lib/navn";
import { useStrekkodeForesporsler } from "@/lib/strekkodeForesporsel";

SplashScreen.preventAutoHideAsync();

export default function RotLayout() {
  const [fonter, feil] = useFonts({
    Archivo_700Bold, Archivo_800ExtraBold,
    IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });
  const { lastet: navnLastet } = useNavn();
  const tema = useTema();
  const [temaLastet, setTemaLastet] = useState(false);
  const [nokkelLastet, setNokkelLastet] = useState(false);

  // Hent navnet til den ansatte, valgt modus (mørk/lys) og koblingsnøkkelen fra telefonen én gang ved oppstart.
  useEffect(() => {
    lastNavn();
    lastTema().finally(() => setTemaLastet(true));
    lastNokkel().finally(() => setNokkelLastet(true));
  }, []);

  const klar = (fonter || !!feil) && navnLastet && temaLastet && nokkelLastet;

  // Er ikke telefonen koblet til (og serveren krever det), åpnes koblingsskjermen med en gang.
  useEffect(() => {
    if (!klar) return;
    hent<{ kreverKobling: boolean; koblet: boolean }>("/api/enheter/meg")
      .then((m) => {
        if (m.kreverKobling && !m.koblet) router.replace("/koble");
      })
      .catch(() => {});
  }, [klar]);
  // Si fra når dashboardet ber om å få skannet en strekkode.
  useStrekkodeForesporsler(klar);
  useEffect(() => {
    if (klar) SplashScreen.hideAsync();
  }, [klar]);

  if (!klar) return null;

  return (
    <>
      <StatusBar style={tema === "lys" ? "dark" : "light"} />
      {/* key: alt tegnes på nytt med de nye fargene når mørk/lys byttes. React Compiler husker
          ellers ferdige komponenter, så en vanlig re-render ville latt deler av appen bli i gammel modus. */}
      <Stack key={tema} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: F.bg } }}>
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
        {/* Tilgang: koble telefonen til Hylla (QR-koden vises i driftslederens dashboard) */}
        <Stack.Screen name="koble" options={{ gestureEnabled: false }} />
        {/* Takkamera (Daniel) */}
        <Stack.Screen name="takkamera" />
        <Stack.Screen name="skann" options={{ contentStyle: { backgroundColor: F.bg } }} />
        <Stack.Screen name="kameraer" />
        <Stack.Screen name="kamera/[hylle]" options={{ gestureEnabled: false, contentStyle: { backgroundColor: F.mork } }} />
        <Stack.Screen name="ny-hylle" />
        <Stack.Screen name="ny-vare" />
        <Stack.Screen name="strekkode/[id]" options={{ contentStyle: { backgroundColor: F.mork } }} />
      </Stack>
    </>
  );
}
