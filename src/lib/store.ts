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

type Global = { __hyllaState?: State; __hyllaSupabase?: SupabaseClient | null; __hyllaHurtig?: { state: State; tid: number }; __hyllaVenter?: { id: string; data: State; oppdatert: string }; __hyllaSkriver?: boolean };
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
  g.__hyllaHurtig = { state, tid: Date.now() };
  // Bare siste versjon skrives: kommer det flere endringer mens en skriving pågår, hoppes de mellomliggende over.
  g.__hyllaVenter = { id: RAD_ID, data: state, oppdatert: new Date().toISOString() };
  if (g.__hyllaSkriver) return;
  g.__hyllaSkriver = true;
  void (async () => {
    try {
      while (g.__hyllaVenter) {
        const rad = g.__hyllaVenter;
        g.__hyllaVenter = undefined;
        const { error } = await sb.from("hylla_state").upsert(rad);
        if (error) console.error(`Supabase: ${error.message}`);
      }
    } catch (e) {
      console.error("Supabase-skriving feilet", e);
    } finally {
      g.__hyllaSkriver = false;
    }
  })();
}

/** Les, endre og lagre i ett steg. Kjøres i kø så samtidige kall ikke overskriver hverandre. */
let ko: Promise<unknown> = Promise.resolve();
export function endreState<T>(fn: (s: State) => T | Promise<T>): Promise<T> {
  const neste = ko.then(async () => {
    const s = structuredClone(await hentState());
    const res = await fn(s);
    await lagreState(s);
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
