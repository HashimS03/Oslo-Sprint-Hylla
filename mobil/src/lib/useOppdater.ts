import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

/**
 * Kjører `last` hvert `sekunder` sekund så lenge skjermen er i fokus og appen er åpen.
 * Samme idé som dashbordet, som henter nye data hvert 10. sekund.
 */
export function useOppdater(last: () => void, sekunder = 15) {
  const fokus = useRef(false);
  useFocusEffect(
    useCallback(() => {
      fokus.current = true;
      const t = setInterval(() => {
        if (AppState.currentState === "active") last();
      }, sekunder * 1000);
      return () => {
        fokus.current = false;
        clearInterval(t);
      };
    }, [last, sekunder]),
  );

  // Hent på nytt når appen kommer tilbake fra bakgrunnen.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && fokus.current) last();
    });
    return () => sub.remove();
  }, [last]);
}
