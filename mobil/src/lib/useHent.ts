import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { hent } from "./api";

/**
 * Henter JSON fra backenden, og henter på nytt hver gang skjermen kommer i fokus.
 * Med `hvert` (ms) hentes det også i bakgrunnen så lenge skjermen er synlig, så det kameratelefonen
 * lagrer dukker opp her av seg selv.
 */
export function useHent<T>(sti: string | null, { hvert }: { hvert?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(true);
  const aktiv = useRef(true);

  const last = useCallback(async () => {
    if (!sti) return;
    setLaster(true);
    try {
      const d = await hent<T>(sti);
      if (aktiv.current) {
        setData(d);
        setFeil(null);
      }
    } catch (e) {
      if (aktiv.current) setFeil(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      if (aktiv.current) setLaster(false);
    }
  }, [sti]);

  useEffect(() => {
    aktiv.current = true;
    return () => {
      aktiv.current = false;
    };
  }, []);

  // Stille henting: ingen lastespinner, og en feil midt i en visning skjules til neste forsøk.
  const oppdater = useCallback(async () => {
    if (!sti) return;
    try {
      const d = await hent<T>(sti);
      if (aktiv.current) {
        setData(d);
        setFeil(null);
      }
    } catch {
      /* prøver igjen neste runde */
    }
  }, [sti]);

  useFocusEffect(
    useCallback(() => {
      last();
      if (!hvert) return;
      const t = setInterval(oppdater, hvert);
      return () => clearInterval(t);
    }, [last, oppdater, hvert]),
  );

  return { data, feil, laster, last, setData };
}
