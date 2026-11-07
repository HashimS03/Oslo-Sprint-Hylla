import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { hent } from "./api";

/** Henter JSON fra backenden, og henter på nytt hver gang skjermen kommer i fokus. */
export function useHent<T>(sti: string | null) {
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
      if (aktiv.current) {
        // Ved nettverksfeil beholder vi det vi hadde, så skjermen ikke blir tom i et dødt hjørne av lageret.
        setFeil(e instanceof Error ? e.message : "Noe gikk galt");
      }
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

  useFocusEffect(
    useCallback(() => {
      last();
    }, [last]),
  );

  return { data, feil, laster, last, setData };
}
