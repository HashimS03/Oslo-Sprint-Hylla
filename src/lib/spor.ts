import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Kort, State } from "./types";
import { VERKTOY, kjorVerktoy, finnVare, varekort, hentAvvik, lagKort } from "./verktoy";
import { beholdning, innkjopForVare, plukketSiden } from "./lager";

// Tekstversjonen av Spør Hylla. Brukes når ElevenLabs ikke er satt opp,
// og av appens tekstfelt. Claude bruker de samme verktøyene som stemmeagenten.

export const SYSTEM_SPOR = `Du er Hylla, en lagerassistent for et lite lager. Du svarer på norsk bokmål.

- Svarene leses ofte høyt, så svar kort: én til to setninger, med tallet først.
- Bruk verktøyene for å slå opp tall. Ikke gjett på antall, ordrer eller datoer.
- Når brukeren nevner en vare med ord, bruk finn_vare for å finne SKU-en.
- Når du svarer om én bestemt vare, kall vis_kort med type "vare" og SKU-en, så brukeren ser tallene.
- Når du svarer om svinn eller avvik, kall vis_kort med type "avvik".
- "Bestilte forrige uke" betyr den siste innkjøpsordren for varen.
- Hvis noe er uklart, still ett kort oppfølgingsspørsmål.`;

export type ChatMelding = { rolle: "bruker" | "hylla"; tekst: string };

export async function sporHylla(
  state: State,
  historikk: ChatMelding[],
): Promise<{ svar: string; kort: Kort[]; kilde: "claude" | "demo" }> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
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

const smaa = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
