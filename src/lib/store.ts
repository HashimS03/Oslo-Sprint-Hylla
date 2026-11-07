import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { lagSeed } from "./seed";
import type { State } from "./types";

// Lagring av hele lagerets tilstand.
//
// Uten Supabase: tilstanden ligger i minnet på serveren (fint for lokal demo,
// nullstilles når serveren starter på nytt).
// Med SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY: tilstanden lagres som én JSON-rad i
// tabellen `hylla_state` (se supabase/schema.sql), så den overlever omstart og
// deles mellom alle serverinstanser på Vercel.

const RAD_ID = process.env.HYLLA_LAGER_ID ?? "nydalen";

type Global = { __hyllaState?: State; __hyllaSupabase?: SupabaseClient | null };
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

export async function hentState(): Promise<State> {
  const sb = supabase();
  if (!sb) {
    if (!g.__hyllaState) g.__hyllaState = lagSeed();
    return g.__hyllaState;
  }
  const { data, error } = await sb.from("hylla_state").select("data").eq("id", RAD_ID).maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  if (data?.data) return data.data as State;
  const seed = lagSeed();
  await lagreState(seed);
  return seed;
}

export async function lagreState(state: State): Promise<void> {
  const sb = supabase();
  if (!sb) {
    g.__hyllaState = state;
    return;
  }
  const { error } = await sb
    .from("hylla_state")
    .upsert({ id: RAD_ID, data: state, oppdatert: new Date().toISOString() });
  if (error) throw new Error(`Supabase: ${error.message}`);
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

export async function nullstill(): Promise<void> {
  await lagreState(lagSeed());
}
