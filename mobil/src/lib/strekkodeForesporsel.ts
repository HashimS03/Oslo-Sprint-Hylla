import { useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { hent, send } from "./api";

// Dashboardet kan be skanneren om å skanne strekkoden til en vare («Skann strekkode» på varesiden).
// Appen spør etter slike forespørsler noen sekunder i gangen og viser en melding den ansatte kan godta.

type Foresporsel = { id: string; sku: string; navn: string; status: "venter" | "godtatt" };

const SEKUNDER = 4;

export function useStrekkodeForesporsler(aktiv: boolean) {
  const vist = useRef(new Set<string>());

  useEffect(() => {
    if (!aktiv) return;
    let stopp = false;
    const sjekk = async () => {
      if (AppState.currentState !== "active") return;
      const svar = await hent<{ foresporsler: Foresporsel[] }>("/api/strekkode").catch(() => null);
      const ny = svar?.foresporsler.find((f) => f.status === "venter" && !vist.current.has(f.id));
      if (!ny || stopp) return;
      vist.current.add(ny.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
      Alert.alert(
        "Skann strekkode",
        `Dashboardet ber deg skanne strekkoden til ${ny.navn}.`,
        [
          { text: "Avvis", style: "cancel", onPress: () => { send(`/api/strekkode/${ny.id}`, { status: "avvist" }).catch(() => undefined); } },
          {
            text: "Skann nå",
            onPress: () => {
              send(`/api/strekkode/${ny.id}`, { status: "godtatt" }).catch(() => undefined);
              router.push({ pathname: "/strekkode/[id]", params: { id: ny.id, navn: ny.navn } });
            },
          },
        ],
        { cancelable: false },
      );
    };
    sjekk();
    const t = setInterval(sjekk, SEKUNDER * 1000);
    return () => {
      stopp = true;
      clearInterval(t);
    };
  }, [aktiv]);
}
