import { ApiFeil, hent } from "./api";
import { settTilgang, type TilgangStatus } from "./tilgangStatus";

/**
 * Spør serveren om telefonen har tilgang. Gir "laast" hvis serveren krever PIN og koden mangler eller er feil.
 * Får vi ikke kontakt, regner vi appen som åpen: skjermene viser da selv at serveren ikke svarer.
 */
export async function sjekkTilgang(): Promise<TilgangStatus> {
  try {
    await Promise.race([
      hent("/api/oversikt"),
      new Promise((_, avvis) => setTimeout(() => avvis(new Error("tidsavbrudd")), 8000)),
    ]);
    settTilgang("apen");
    return "apen";
  } catch (e) {
    const laast = e instanceof ApiFeil && e.trengerPin;
    settTilgang(laast ? "laast" : "apen");
    return laast ? "laast" : "apen";
  }
}
