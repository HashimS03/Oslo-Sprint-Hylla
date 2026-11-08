import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Kort, State } from "./types";
import { VERKTOY, kjorVerktoy, finnVare, finnVareMedPoeng, varekort, hentAvvik, lagKort, lagerstatus } from "./verktoy";
import { beholdning, innkjopForVare, plukketSiden } from "./lager";

// Tekstversjonen av Spør Hylla. Brukes når ElevenLabs ikke er satt opp,
// og av appens tekstfelt. Claude bruker de samme verktøyene som stemmeagenten.

export const SYSTEM_SPOR = `Du er Hylla, en lagerassistent. Du svarer på norsk bokmål og snakker som en kollega, ikke som en rapport.

Slik fungerer lageret:
- Skanneren eier lagerbeholdningen: hver skanning (plukk eller plassering) endrer tallet.
- Takkameraet kontrollerer. Det ser hva som tas fra og settes i hver sone (T1, T2 og gangen) og sammenligner med skanningene. Det endrer aldri beholdningen selv.
- Når de to er uenige, blir det et avvik: «feil plass» (skannet én vare, tok en annen), «uregistrert uttak» (tatt uten skanning), «skannet uten uttak», «feil produkt» (en vare står i feil sone) eller «gjenglemt vare» (noe har stått i gangen for lenge).
- «Mulig svinn» er en vare som mangler uten forklaring i lagerloggen.

Slik svarer du:
- Svarene leses ofte høyt: én til tre korte setninger, med det viktigste først. Ingen lister og ingen markdown.
- Du får en fersk statusoversikt under. Bruk den direkte når den svarer på spørsmålet. Bruk verktøyene bare for detaljer som ikke står der (logg, innkjøp, søk etter en vare). Ikke gjett.
- «Hva har skjedd i dag?» → hent_oppsummering. Spørsmål om kameraet → hent_kamera. «Er det noe jeg må følge opp?» → hent_kameraavvik og hent_avvik. Om oppgaver → hent_oppgaver.
- Nevner brukeren en vare, finn den i statusen under (navn og SKU står der, med beholdning). Bruk finn_vare bare hvis den ikke står der.
- Du trenger sjelden verktøy. Svar rett fra statusen når du kan.
- Si ærlig hvis noe mangler, for eksempel at en vare ikke er skannet inn ennå, eller at kameraet ikke har sett en sone på en stund.
- Er spørsmålet uklart, still ett kort oppfølgingsspørsmål.`;

export type ChatMelding = { rolle: "bruker" | "hylla"; tekst: string };

export async function sporHylla(
  state: State,
  historikk: ChatMelding[],
): Promise<{ svar: string; kort: Kort[]; kilde: "meta" | "claude" | "demo" }> {
  const harClaude = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const harMeta = !!metaNokkel();
  const valgt = process.env.HYLLA_LLM ?? (harMeta ? "meta" : harClaude ? "claude" : "demo");

  if (valgt === "meta" && harMeta) {
    try {
      return { ...(await sporMeta(state, historikk)), kilde: "meta" };
    } catch (e) {
      console.error("Meta svarte ikke, prøver reserve:", e);
      if (!harClaude) return { ...demoSvar(state, historikk.at(-1)?.tekst ?? ""), kilde: "demo" };
    }
  } else if (!(valgt === "claude" && harClaude)) {
    return { ...demoSvar(state, historikk.at(-1)?.tekst ?? ""), kilde: "demo" };
  }

  const client = new Anthropic();
  const idag = new Date().toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const messages: Anthropic.Beta.BetaMessageParam[] = historikk.map((m, i) => ({
    role: m.rolle === "bruker" ? "user" : "assistant",
    content: i === historikk.length - 1 && m.rolle === "bruker" ? `(I dag er ${idag}.)\n${m.tekst}` : m.tekst,
  }));
  const kort: Kort[] = [];

  for (let runde = 0; runde < 8; runde++) {
    const res = await client.beta.messages.create({
      model: process.env.HYLLA_MODELL ?? "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      output_config: { effort: "low" },
      system: SYSTEM_SPOR,
      tools: VERKTOY.map((v) => ({ ...v, input_schema: v.input_schema as unknown as Anthropic.Beta.BetaTool["input_schema"] })),
      messages,
    });
    if (res.stop_reason === "refusal") return { svar: "Det kan jeg ikke svare på.", kort, kilde: "claude" };

    if (res.stop_reason !== "tool_use") {
      const svar = res.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();
      return { svar: svar || "Jeg fant ikke noe svar.", kort, kilde: "claude" };
    }

    messages.push({ role: "assistant", content: res.content });
    const resultater: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const b of res.content) {
      if (b.type !== "tool_use") continue;
      try {
        const r = kjorVerktoy(state, b.name, (b.input ?? {}) as Record<string, unknown>);
        if (r.kort) kort.push(r.kort);
        resultater.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(r.resultat) });
      } catch (e) {
        resultater.push({ type: "tool_result", tool_use_id: b.id, content: String(e), is_error: true });
      }
    }
    messages.push({ role: "user", content: resultater });
  }
  return { svar: "Det tok for lang tid å finne svaret. Prøv å spørre på en annen måte.", kort, kilde: "claude" };
}

// ---------------- Meta (Muse Spark via Responses API) ----------------
// Samme verktøy som Claude, og samme nøkkel som SAM 3.1. Dokumentasjon: https://dev.meta.ai/docs/tool-calling

const META_URL = process.env.META_API_URL ?? "https://api.meta.ai/v1/responses";
const metaNokkel = () => process.env.META_API_KEY ?? process.env.MODEL_API_KEY;

type MetaUt = { id?: string; output?: { type: string; name?: string; arguments?: string; call_id?: string; content?: { type: string; text?: string }[] }[]; output_text?: string; error?: { message?: string } };

async function metaKall(body: Record<string, unknown>): Promise<MetaUt> {
  const t0 = Date.now();
  const res = await fetch(META_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${metaNokkel()}`, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.HYLLA_META_MODELL ?? "muse-spark-1.3", stream: false, ...body }),
    signal: AbortSignal.timeout(45_000),
  });
  if (process.env.HYLLA_DEBUG) console.log(`[meta] ${((Date.now() - t0) / 1000).toFixed(1)} s, status ${res.status}`);
  if (!res.ok) throw new Error(`Meta API svarte ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as MetaUt;
}

async function sporMeta(state: State, historikk: ChatMelding[]): Promise<{ svar: string; kort: Kort[] }> {
  const idag = new Date().toLocaleString("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  // vis_kort tas ikke med: koden legger ved varekortet selv, så modellen slipper en ekstra runde.
  const tools = VERKTOY.filter((v) => v.name !== "vis_kort").map((v) => ({ type: "function", name: v.name, description: v.description, parameters: v.input_schema }));
  const kort: Kort[] = [];
  const sporsmal = historikk.at(-1)?.tekst ?? "";
  const treff = finnVareMedPoeng(state, sporsmal)[0];
  if (treff && treff.poeng >= 3) {
    const k = varekort(state, treff.sku);
    if (k) kort.push(k);
  }

  let input: unknown = [
    ...historikk.map((m) => ({
      type: "message",
      role: m.rolle === "bruker" ? "user" : "assistant",
      content: [{ type: m.rolle === "bruker" ? "input_text" : "output_text", text: m.tekst }],
    })),
  ];
  let forrige: string | undefined;
  for (let runde = 0; runde < 8; runde++) {
    const res = await metaKall({
      instructions: `${SYSTEM_SPOR}\n\nNå er det ${idag}.\n\nFersk status fra lageret (bruk den direkte, og hent bare mer med verktøy når noe ikke står her):\n${JSON.stringify(lagerstatus(state))}`,
      input,
      tools,
      tool_choice: "auto",
      reasoning: { effort: process.env.HYLLA_META_TENKING ?? "minimal" },
      ...(forrige ? { previous_response_id: forrige } : {}),
    });
    forrige = res.id;
    const kall = (res.output ?? []).filter((o) => o.type === "function_call");
    if (process.env.HYLLA_DEBUG) console.log(`[meta] runde ${runde}: ${kall.map((k) => k.name).join(", ") || "svar"}`);
    if (kall.length === 0) {
      const tekst = (res.output_text ?? (res.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join(" ")).trim();
      return { svar: tekst || "Jeg fant ikke noe svar.", kort };
    }
    input = kall.map((k) => {
      let ut: unknown;
      try {
        const r = kjorVerktoy(state, k.name ?? "", JSON.parse(k.arguments || "{}") as Record<string, unknown>);
        if (r.kort) kort.push(r.kort);
        ut = r.resultat;
      } catch (e) {
        ut = { feil: String(e) };
      }
      return { type: "function_call_output", call_id: k.call_id, output: JSON.stringify(ut) };
    });
  }
  return { svar: "Det tok for lang tid å finne svaret. Prøv å spørre på en annen måte.", kort };
}

/** Enkle, regelbaserte svar så demoen fungerer uten API-nøkkel. */
function demoSvar(state: State, sporsmal: string): { svar: string; kort: Kort[] } {
  const q = sporsmal.toLowerCase();
  if (/svinn|avvik|mangler|borte/.test(q)) {
    const avvik = hentAvvik(state);
    if (!avvik.length) return { svar: "Det er ingen åpne avvik nå.", kort: [] };
    const a = avvik[0];
    const k = lagKort(state, "avvik", a.id);
    return {
      svar: `${avvik.length === 1 ? "Ett åpent avvik" : `${avvik.length} åpne avvik`}: ${Math.abs(a.endring)} av ${smaa(a.vare ?? a.sku)} mangler på ${a.hylle}, uten plukkordre.`,
      kort: k ? [k] : [],
    };
  }
  const treff = finnVare(state, q.replace(/hvor mange|har vi|igjen|på lager|av den|som vi|bestilte|forrige uke|\?/g, " "))[0];
  if (!treff) return { svar: "Jeg fant ikke den varen. Prøv å si farge, type og størrelse.", kort: [] };
  const k = varekort(state, treff.sku);
  const po = innkjopForVare(state, treff.sku)[0];
  const n = beholdning(state, treff.sku);
  let svar = `Du har ${n} av ${smaa(treff.navn)} på lager.`;
  if (po && /bestil|kjøpt|po|ordre/.test(q)) {
    svar = `Du har ${n} igjen. Av ${po.bestilt} bestilt på ${po.id} er ${po.mottatt} kommet inn og ${plukketSiden(state, treff.sku, po.bestiltDato)} plukket.`;
  }
  return { svar, kort: k ? [k] : [] };
}

const smaa = (t: string) => t; // beholder navnet slik det er skrevet (merkenavn skal ikke få liten bokstav)
