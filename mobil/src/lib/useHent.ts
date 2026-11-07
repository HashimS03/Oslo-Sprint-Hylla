import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiFeil, hent } from "./api";

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
        setFeil(e instanceof Error ? e.message : "Noe gikk galt");
        // Mangler vi tilgang (PIN fjernet eller feil), skal ingen gamle data bli stående på skjermen.
        // Ved vanlige nettverksfeil beholder vi det vi hadde, så skjermen ikke blir tom i et dødt hjørne av lageret.
        if (e instanceof ApiFeil && (e.status === 401 || e.status === 403)) setData(null);
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
