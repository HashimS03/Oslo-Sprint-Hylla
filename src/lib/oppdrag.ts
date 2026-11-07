import { nyId, vare } from "./lager";
import type { Oppdrag, OppdragStatus, State } from "./types";

// Oppdrag fra dashboardet til skannerne: «gå og sjekk dette avviket».
// Skanneren henter oppdrag med GET /api/oppdrag og melder tilbake med PATCH /api/oppdrag/{id}.

export const AKTIVE: OppdragStatus[] = ["sendt", "mottatt", "pagar"];
export const STATUSER: OppdragStatus[] = ["sendt", "mottatt", "pagar", "ferdig", "avbrutt"];
export const erAktiv = (o: Oppdrag) => AKTIVE.includes(o.status);

export const STATUS_TEKST: Record<OppdragStatus, string> = {
  sendt: "Sendt, venter på skanner",
  mottatt: "Mottatt på skanneren",
  pagar: "Ansatt sjekker nå",
  ferdig: "Ferdig sjekket",
  avbrutt: "Trukket tilbake",
};

export function alleOppdrag(s: State): Oppdrag[] {
  return [...(s.oppdrag ?? [])].sort((a, b) => b.sendt.localeCompare(a.sendt));
}

/** Det nyeste oppdraget for et avvik, aktivt eller ikke. */
export function oppdragFor(s: State, avvikId: string): Oppdrag | undefined {
  return alleOppdrag(s).find((o) => o.avvikId === avvikId);
}

export function sendOppdrag(s: State, avvikId: string, valg: { melding?: string; til?: string } = {}): Oppdrag {
  const h = s.hendelser.find((x) => x.id === avvikId);
  if (!h || h.type !== "mulig_svinn" || h.avvik?.status !== "apen") throw new Error("Fant ikke et åpent avvik");
  const finnes = (s.oppdrag ?? []).find((o) => o.avvikId === avvikId && erAktiv(o));
  if (finnes) throw new Error("Avviket er allerede sendt til skanneren");
  const na = new Date().toISOString();
  const o: Oppdrag = {
    id: nyId("o"),
    avvikId,
    hylle: h.hylle,
    sku: h.sku,
    antall: Math.abs(h.endring),
    melding: valg.melding?.trim() || undefined,
    til: valg.til?.trim() || undefined,
    status: "sendt",
    sendt: na,
    oppdatert: na,
  };
  (s.oppdrag ??= []).push(o);
  return o;
}

export function oppdaterOppdrag(s: State, id: string, endring: { status?: OppdragStatus; tattAv?: string; svar?: string }): Oppdrag {
  const o = (s.oppdrag ?? []).find((x) => x.id === id);
  if (!o) throw new Error("Fant ikke oppdraget");
  if (endring.status) {
    if (!STATUSER.includes(endring.status)) throw new Error("Ukjent status");
    if (!erAktiv(o)) throw new Error("Oppdraget er allerede avsluttet");
    o.status = endring.status;
  }
  if (endring.tattAv !== undefined) o.tattAv = endring.tattAv.trim() || undefined;
  if (endring.svar !== undefined) o.svar = endring.svar.trim() || undefined;
  o.oppdatert = new Date().toISOString();
  return o;
}

/** Slik skanneren ser et oppdrag: alt den trenger for å vise det uten flere kall. */
export function oppdragVisning(s: State, o: Oppdrag) {
  const v = vare(s, o.sku);
  const plass = s.hyller.find((x) => x.id === o.hylle)?.innhold.find((i) => i.sku === o.sku)?.nivaa;
  return {
    ...o,
    navn: v?.navn ?? o.sku,
    swatch: v?.swatch ?? null,
    plassering: plass || null,
    statusTekst: STATUS_TEKST[o.status],
  };
}
