import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { lagSeed, lagStart, lagTom } from "./seed";
import type { State } from "./types";

// Lagring av hele lagerets tilstand.
//
// Uten Supabase: tilstanden ligger i minnet på serveren (fint for lokal demo,
// nullstilles når serveren starter på nytt).
// Med SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY: tilstanden lagres som én JSON-rad i
// tabellen `hylla_state` (se supabase/schema.sql), så den overlever omstart og
// deles mellom alle serverinstanser på Vercel.

const RAD_ID = process.env.HYLLA_LAGER_ID ?? "nydalen";

type Global = { __hyllaState?: State; __hyllaEndret?: string; __hyllaSupabase?: SupabaseClient | null };
const g = globalThis as unknown as Global;

function supabase(): SupabaseClient | null {
  if (g.__hyllaSupabase !== undefined) return g.__hyllaSupabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__hyllaSupabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return g.__hyllaSupabase;
}

export function lagringstype(): "supabase" | "minne" {
  return supabase() ? "supabase" : "minne";
}

// Hele tilstanden er én stor JSON-rad (med bilder). Å hente den ved hver side og hvert kall gjorde alt tregt.
// Vi husker den i minnet og spør Supabase bare om når raden sist ble endret. Er den lik, bruker vi kopien vi har.
// Har vi sjekket det siste sekundet, bruker vi kopien uten å spørre (en side kaller hentState flere ganger).
// endreState spør alltid, så en skriving bygger på det nyeste.
type Hurtig = { oppdatert: string; state: State; sjekket: number };
const hurtig = globalThis as unknown as { __hyllaHurtig?: Hurtig; __hyllaHenter?: Promise<State> };
const FERSK_MS = 1000;

/** Når tilstanden sist ble lagret. Et lite oppslag, brukes av dashboardet for å se om noe er nytt. */
export async function sistEndret(): Promise<string> {
  const sb = supabase();
  if (!sb) return g.__hyllaEndret ?? "";
  const { data, error } = await sb.from("hylla_state").select("oppdatert").eq("id", RAD_ID).maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data?.oppdatert as string | undefined) ?? "";
}

/** Bare de koblede enhetene, uten resten av lageret. Middleware spør om dette ved nesten hvert kall. */
export async function hentEnheter(): Promise<NonNullable<State["enheter"]>> {
  const sb = supabase();
  if (!sb) return (await hentState()).enheter ?? [];
  const { data, error } = await sb.from("hylla_state").select("enheter:data->enheter").eq("id", RAD_ID).maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return ((data as { enheter?: State["enheter"] } | null)?.enheter ?? []) as NonNullable<State["enheter"]>;
}

export async function hentState(fersk = false): Promise<State> {
  const sb = supabase();
  if (!sb) {
    if (!g.__hyllaState) g.__hyllaState = lagStart();
    return g.__hyllaState;
  }
  const h = hurtig.__hyllaHurtig;
  if (h && !fersk && Date.now() - h.sjekket < FERSK_MS) return h.state;
  if (h) {
    const sjekket = Date.now();
    if (Date.parse(await sistEndret()) === Date.parse(h.oppdatert)) {
      h.sjekket = sjekket;
      return h.state;
    }
  }
  // Mange kall samtidig (en side og flere API-kall) deler på én nedlasting.
  hurtig.__hyllaHenter ??= (async () => {
    try {
      const sjekket = Date.now();
      const { data, error } = await sb.from("hylla_state").select("data, oppdatert").eq("id", RAD_ID).maybeSingle();
      if (error) throw new Error(`Supabase: ${error.message}`);
      if (data?.data) {
        hurtig.__hyllaHurtig = { oppdatert: data.oppdatert as string, state: data.data as State, sjekket };
        return data.data as State;
      }
      const start = lagStart();
      await lagreState(start);
      return start;
    } finally {
      hurtig.__hyllaHenter = undefined;
    }
  })();
  return hurtig.__hyllaHenter;
}

/** Bilder tar mest plass. Vi beholder dem bare på de nyeste oppføringene. */
const MAKS_BILDER = 60;
function trimBilder(state: State) {
  for (const liste of [state.kameraHendelser, state.tellinger, state.matcherAvvik] as ({ bilde?: string }[] | undefined)[]) {
    const med = (liste ?? []).filter((x) => x.bilde);
    for (const x of med.slice(0, Math.max(0, med.length - MAKS_BILDER))) delete x.bilde;
  }
}

export async function lagreState(state: State): Promise<void> {
  trimBilder(state);
  const sb = supabase();
  const oppdatert = new Date().toISOString();
  if (!sb) {
    g.__hyllaState = state;
    g.__hyllaEndret = oppdatert;
    return;
  }
  const { error } = await sb.from("hylla_state").upsert({ id: RAD_ID, data: state, oppdatert });
  if (error) throw new Error(`Supabase: ${error.message}`);
  hurtig.__hyllaHurtig = { oppdatert, state, sjekket: Date.now() };
}

/** Les, endre og lagre i ett steg. Kjøres i kø så samtidige kall ikke overskriver hverandre. */
let ko: Promise<unknown> = Promise.resolve();
export function endreState<T>(fn: (s: State) => T | Promise<T>): Promise<T> {
  const neste = ko.then(async () => {
    const s = structuredClone(await hentState(true));
    const res = await fn(s);
    await lagreState(s);
    return res;
  });
  ko = neste.catch(() => undefined);
  return neste;
}

/** Som endreState, men lagrer bare når noe faktisk ble endret. Brukes av matcheren, som kjøres ved hver sidevisning. */
export function endreStateHvisEndret<T>(fn: (s: State) => T | Promise<T>): Promise<T> {
  const neste = ko.then(async () => {
    const original = await hentState(true);
    const s = structuredClone(original);
    const res = await fn(s);
    if (JSON.stringify(s) !== JSON.stringify(original)) await lagreState(s);
    return res;
  });
  ko = neste.catch(() => undefined);
  return neste;
}

/** Tilbake til demodataene, eller et helt tomt lager med `tom`. Koblede enheter beholdes, så ingen blir låst ute. */
export async function nullstill(tom = false): Promise<void> {
  await endreState((s) => {
    const { enheter, koblingskoder } = s;
    for (const k of Object.keys(s)) delete (s as Record<string, unknown>)[k];
    Object.assign(s, tom ? lagTom() : lagSeed(), { enheter, koblingskoder });
  });
}
