import "server-only";
import { nyId } from "./lager";
import type { State, StrekkodeForesporsel } from "./types";

// Dashboardet ber skanneren om å skanne strekkoden til en vare. Skannerappen spør etter
// ventende forespørsler, den ansatte godtar og skanner, og koden lagres på varen.

/** En forespørsel som ikke er besvart innen dette, regnes som utløpt. */
const LEVETID_MS = 5 * 60_000;

const aktiv = (f: StrekkodeForesporsel, naa = Date.now()) =>
  (f.status === "venter" || f.status === "godtatt") && naa - Date.parse(f.tid) < LEVETID_MS;

/** Med sku: koden lagres på varen. Uten: varen er ikke lagret ennå, og skjemaet henter koden selv. */
const navnPa = (s: State, f: StrekkodeForesporsel) =>
  (f.sku ? s.varer.find((v) => v.sku === f.sku)?.navn ?? f.sku : f.navn) ?? "ny vare";

export function nyForesporsel(s: State, sku?: string, navn?: string): StrekkodeForesporsel {
  if (sku && !s.varer.some((v) => v.sku === sku)) throw new Error(`Fant ikke ${sku}`);
  s.strekkodeForesporsler ??= [];
  // Bare én forespørsel om gangen: en ny erstatter de gamle.
  for (const f of s.strekkodeForesporsler) if (aktiv(f)) f.status = "avbrutt";
  const f: StrekkodeForesporsel = { id: nyId("sk"), ...(sku ? { sku } : { navn: navn?.trim() || "ny vare" }), tid: new Date().toISOString(), status: "venter" };
  s.strekkodeForesporsler.push(f);
  s.strekkodeForesporsler = s.strekkodeForesporsler.slice(-20);
  return f;
}

/** Ventende forespørsler med varenavn, for skannerappen. */
export function aktiveForesporsler(s: State) {
  return (s.strekkodeForesporsler ?? []).filter((f) => aktiv(f)).map((f) => ({ ...f, navn: navnPa(s, f) }));
}

export function visForesporsel(s: State, id: string) {
  const f = (s.strekkodeForesporsler ?? []).find((x) => x.id === id);
  if (!f) return null;
  const utlopt = !aktiv(f) && (f.status === "venter" || f.status === "godtatt");
  return { ...f, status: utlopt ? ("avbrutt" as const) : f.status, navn: navnPa(s, f) };
}

/** Oppdater fra skanneren (godtatt, avvist, eller ferdig med kode) eller dashboardet (avbrutt). */
export function svarForesporsel(s: State, id: string, svar: { status: StrekkodeForesporsel["status"]; kode?: string }) {
  const f = (s.strekkodeForesporsler ?? []).find((x) => x.id === id);
  if (!f) throw new Error("Fant ikke forespørselen");
  if (!aktiv(f)) throw new Error("Forespørselen er ikke aktiv lenger");
  if (svar.status === "ferdig") {
    const kode = (svar.kode ?? "").trim();
    if (!kode) throw new Error("Mangler strekkode");
    if (f.sku) {
      const v = s.varer.find((x) => x.sku === f.sku);
      if (!v) throw new Error("Varen finnes ikke lenger");
      // En strekkode hører til én vare.
      for (const andre of s.varer) if (andre !== v && andre.strekkode === kode) delete andre.strekkode;
      v.strekkode = kode;
    }
    f.kode = kode;
    f.ferdigTid = new Date().toISOString();
  }
  f.status = svar.status;
  return f;
}
