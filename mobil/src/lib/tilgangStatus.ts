import { useSyncExternalStore } from "react";

// Er appen låst (serveren krever PIN og telefonen mangler riktig kode)?
// Ligger i en egen fil uten andre importer, så både api.ts og skjermene kan bruke den.
//
// - "sjekker": appen har nettopp startet og spør serveren
// - "apen":    alt virker (eller serveren krever ingen kode)
// - "laast":   PIN-skjermen vises til riktig kode er skrevet inn

export type TilgangStatus = "sjekker" | "apen" | "laast";

let status: TilgangStatus = "sjekker";
const lyttere = new Set<() => void>();

export function tilgangStatus(): TilgangStatus {
  return status;
}

export function settTilgang(ny: TilgangStatus) {
  if (ny === status) return;
  status = ny;
  lyttere.forEach((f) => f());
}

export function useTilgang(): TilgangStatus {
  return useSyncExternalStore(
    (f) => {
      lyttere.add(f);
      return () => lyttere.delete(f);
    },
    () => status,
  );
}
