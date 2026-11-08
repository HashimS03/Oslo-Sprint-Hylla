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

type Global = { __hyllaState?: State; __hyllaSupabase?: SupabaseClient | null; __hyllaHurtig?: { state: State; tid: number }; };
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

// Raskt: tilstanden huskes i minnet noen sekunder, og skriving til Supabase skjer i bakgrunnen.
// Én rad på flere MB over nett tok ellers titalls sekunder per kamerabilde.
const HUSK_MS = 4000;
const MAKS: Record<string, number> = { kameraHendelser: 100, matcherAvvik: 100, skanninger: 100, matchet: 300 };

function beskjaer(s: State): void {
  const x = s as unknown as Record<string, unknown>;
  for (const [k, n] of Object.entries(MAKS)) if (Array.isArray(x[k]) && (x[k] as unknown[]).length > n) x[k] = (x[k] as unknown[]).slice(-n);
}

export async function hentState(): Promise<State> {
  const sb = supabase();
  if (!sb) {
    if (!g.__hyllaState) g.__hyllaState = lagStart();
    return g.__hyllaState;
  }
  const h = g.__hyllaHurtig;
  if (h && Date.now() - h.tid < HUSK_MS) return h.state;
  const { data, error } = await sb.from("hylla_state").select("data").eq("id", RAD_ID).maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  const state = (data?.data as State | undefined) ?? lagStart();
  if (!data?.data) await lagreState(state);
  g.__hyllaHurtig = { state, tid: Date.now() };
  return state;
}

export async function lagreState(state: State): Promise<void> {
  beskjaer(state);
  const sb = supabase();
  if (!sb) {
    g.__hyllaState = state;
    return;
  }
  const { error } = await sb.from("hylla_state").upsert({ id: RAD_ID, data: state, oppdatert: new Date().toISOString() });
  if (error) throw new Error(`Supabase: ${error.message}`);
  g.__hyllaHurtig = { state, tid: Date.now() };
}

/**
 * Les, endre og lagre i ett steg.
 *
 * På Vercel kjører dashboardet og kameraet på hver sin serverinstans. Leste vi fra minnet og skrev i bakgrunnen,
 * skrev kameraet (som lagrer ved hvert bilde) over endringer fra dashboardet: avvik som ble løst og
 * demobestillinger forsvant med en gang. Derfor leser vi alltid ferskt her, venter på at skrivingen er ferdig,
 * og skriver bare hvis ingen andre har lagret siden vi leste (ellers prøver vi igjen på den nye tilstanden).
 * Vanlige lesinger (sidene) bruker fortsatt kopien i minnet.
 */
let ko: Promise<unknown> = Promise.resolve();
export function endreState<T>(fn: (s: State) => T | Promise<T>): Promise<T> {
  const neste = ko.then(async () => {
    const sb = supabase();
    if (!sb) {
      const s = structuredClone(await hentState());
      const res = await fn(s);
      await lagreState(s);
      return res;
    }
    for (let forsok = 0; ; forsok++) {
      const { data, error } = await sb.from("hylla_state").select("data, oppdatert").eq("id", RAD_ID).maybeSingle();
      if (error) throw new Error(`Supabase: ${error.message}`);
      if (!data?.data) {
        const s = lagStart();
        const res = await fn(s);
        await lagreState(s);
        return res;
      }
      const s = data.data as State;
      const res = await fn(s);
      beskjaer(s);
      const { data: skrevet, error: feil } = await sb
        .from("hylla_state")
        .update({ data: s, oppdatert: new Date().toISOString() })
        .eq("id", RAD_ID)
        .eq("oppdatert", data.oppdatert as string)
        .select("id");
      if (feil) throw new Error(`Supabase: ${feil.message}`);
      if (skrevet && skrevet.length > 0) {
        g.__hyllaHurtig = { state: s, tid: Date.now() };
        return res;
      }
      // Noen andre lagret i mellomtiden. Prøv igjen på det de lagret (et par ganger, så tar vi siste ord).
      if (forsok >= 4) {
        await lagreState(s);
        return res;
      }
    }
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
