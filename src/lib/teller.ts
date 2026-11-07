import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Hylle, State, TelleResultat } from "./types";
import { beholdning, sisteTelling, vare } from "./lager";

// En teller tar et hyllebilde og returnerer antall per vare.
// Fem varianter, valgt med HYLLA_TELLER (sam31 | sam3 | claude | yolo | demo):
// - sam31:  Metas SAM 3.1 via Meta Model API (META_API_KEY), én forespørsel per vare, Claude som reserve
// - sam3:   Metas SAM 3 i en egen tjeneste (se sam3/), satt med SAM3_URL
// - claude: Claude ser på bildet og teller (når ANTHROPIC_API_KEY finnes)
// - yolo:   en egen YOLO-tjeneste (se yolo/), satt med YOLO_URL
// - demo:   faste tall fra demomanuset, uten nettverk
// Uten HYLLA_TELLER velges sam3 hvis SAM3_URL finnes, så claude, så yolo, ellers demo.

export type TellerInput = { state: State; hylle: Hylle; bilde: string /* data-URL */ };
export type Teller = { navn: string; tell: (i: TellerInput) => Promise<TelleResultat> };

export function velgTeller(tvingDemo = false): Teller {
  if (tvingDemo) return demoTeller;
  const valgt = process.env.HYLLA_TELLER;
  if (valgt === "demo") return demoTeller;
  if (valgt === "sam31" || (!valgt && !process.env.SAM3_URL && metaNokkel())) return sam31Teller;
  if (valgt === "sam3" || (!valgt && process.env.SAM3_URL)) return sam3Teller;
  if (valgt === "claude") return claudeTeller;
  if (valgt === "yolo" || (!valgt && process.env.YOLO_URL && !process.env.ANTHROPIC_API_KEY)) return yoloTeller;
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return claudeTeller;
  return demoTeller;
}

// ---------------- Claude ----------------

const MODELL = process.env.HYLLA_MODELL ?? "claude-opus-5-5";

const SYSTEM = `Du teller varer på lagerhyller fra ett bilde tatt med mobil.

Slik teller du:
- Tell hver vare for seg. Varene kan stå ved siden av hverandre på et bord eller ligge stablet. Tell hver gjenstand, og tell stabler lag for lag.
- Se på form, farge og innpakning for å skille varene fra hverandre.
- Hvis du ikke kan se hele stabelen eller er i tvil om ett plagg, gi ditt beste anslag i "antall", sett "sikkerhet" lavere og legg det nest mest sannsynlige tallet i "alternativ". Ellers er "alternativ" null.
- "merknad" er en kort setning på norsk, for eksempel "stabel 3 er delvis skjult".
- Varer du ser som ikke står på listen, beskriver du kort i "ukjente".
- Du får forrige telling som hjelp, men tell det du faktisk ser. Ikke juster mot forrige tall.`;

const SKJEMA = {
  type: "object",
  additionalProperties: false,
  required: ["varer", "ukjente", "bildekvalitet", "kommentar"],
  properties: {
    varer: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sku", "antall", "sikkerhet", "alternativ", "merknad"],
        properties: {
          sku: { type: "string" },
          antall: { type: "integer" },
          sikkerhet: { type: "number" },
          alternativ: { type: ["integer", "null"] },
          merknad: { type: "string" },
        },
      },
    },
    ukjente: { type: "array", items: { type: "string" } },
    bildekvalitet: { type: "string", enum: ["god", "ok", "darlig"] },
    kommentar: { type: "string" },
  },
} as const;

function bildeBlokk(dataUrl: string): Anthropic.Beta.BetaImageBlockParam {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Bildet må være en data-URL (jpeg, png, webp eller gif)");
  return {
    type: "image",
    source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] },
  };
}

export const claudeTeller: Teller = {
  navn: "claude",
  async tell({ state, hylle, bilde }) {
    const client = new Anthropic();
    const forrige = sisteTelling(state, hylle.id);
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];

    // Referansebilder av varene, hvis noen er lagt inn.
    for (const plass of hylle.innhold) {
      const v = vare(state, plass.sku);
      if (v?.bilder[0]) {
        content.push({ type: "text", text: `Referansebilde av ${v.sku} (${v.navn}):` });
        content.push(bildeBlokk(v.bilder[0]));
      }
    }

    const liste = hylle.innhold
      .map((p) => {
        const v = vare(state, p.sku);
        return `- ${p.sku}: ${v?.navn ?? p.sku}, ${v?.beskrivelse ?? ""}. Ligger ${p.nivaa} på hylla. Forrige antall: ${beholdning(state, p.sku, hylle.id)}`;
      })
      .join("\n");

    content.push(bildeBlokk(bilde));
    content.push({
      type: "text",
      text: `Dette er ${hylle.navn} (${hylle.id}).${forrige ? ` Forrige telling var ${new Date(forrige.tid).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" })}.` : ""}\nVarer som skal stå her:\n${liste}\n\nTell hver av varene på bildet.`,
    });

    const res = await client.beta.messages.create({
      model: MODELL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SKJEMA as unknown as Record<string, unknown> },
      },
      messages: [{ role: "user", content }],
    });

    if (res.stop_reason === "refusal") throw new Error("Telleren avslo bildet. Prøv et nytt bilde.");
    if (res.stop_reason === "max_tokens") throw new Error("Tellingen ble avbrutt. Prøv igjen.");
    const tekst = res.content.find((b) => b.type === "text");
    if (!tekst || tekst.type !== "text") throw new Error("Fikk ikke noe svar fra telleren");
    const r = JSON.parse(tekst.text) as TelleResultat;
    r.varer = r.varer.map((v) => ({ ...v, sikkerhet: Math.max(0, Math.min(1, v.sikkerhet)) }));
    return r;
  },
};

// ---------------- YOLO ----------------
// Forventer en tjeneste som tar { hylle, bilde, varer: [{sku, nivaa}] } og svarer med TelleResultat.
// Se yolo/README.md for en enkel FastAPI-tjeneste med Ultralytics.

/** Kaller en egen telletjeneste (YOLO eller SAM 3) med samme format: POST /tell → TelleResultat. */
function eksternTeller(navn: string, urlVar: string): Teller {
  return {
    navn,
    async tell({ state, hylle, bilde }) {
      const url = process.env[urlVar];
      if (!url) throw new Error(`${urlVar} er ikke satt`);
      const varer = hylle.innhold.map((i) => {
        const v = vare(state, i.sku);
        return { sku: i.sku, nivaa: i.nivaa, navn: v?.navn ?? i.sku, farge: v?.farge ?? "", beskrivelse: v?.beskrivelse ?? "" };
      });
      let res: Response;
      try {
        res = await fetch(`${url.replace(/\/$/, "")}/tell`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            // SAM3_TOKEN / YOLO_TOKEN: samme verdi som tjenesten er startet med (se sam3/ og yolo/ README).
            ...(process.env[urlVar.replace(/_URL$/, "_TOKEN")] ? { authorization: `Bearer ${process.env[urlVar.replace(/_URL$/, "_TOKEN")]}` } : {}),
          },
          body: JSON.stringify({ hylle: hylle.id, bilde, varer }),
          signal: AbortSignal.timeout(55_000),
        });
      } catch {
        throw new Error(`Får ikke kontakt med ${navn}-tjenesten på ${url}`);
      }
      if (!res.ok) throw new Error(`${navn}-tjenesten svarte ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return (await res.json()) as TelleResultat;
    },
  };
}

export const yoloTeller = eksternTeller("yolo", "YOLO_URL");
export const sam3Teller = eksternTeller("sam3", "SAM3_URL");

// ---------------- SAM 3.1 via Meta Model API ----------------
// Dokumentasjon: https://dev.meta.ai/docs/sam/segmenting
// Én forespørsel per vare med en kort engelsk beskrivelse. Svaret er tekst med tokens som
// <|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..;c=0.96|>. Vi trenger bare boksene og sikkerheten.

const META_URL = process.env.META_API_URL ?? "https://api.meta.ai/v1/responses";
const SAM_TERSKEL = Number(process.env.SAM3_TERSKEL ?? 0.5);
const SAM_LAV_TERSKEL = Number(process.env.SAM3_LAV_TERSKEL ?? 0.3);

function metaNokkel(): string | undefined {
  return process.env.META_API_KEY ?? process.env.MODEL_API_KEY;
}

/** Samler all tekst i et svar (vanlig JSON eller server-sent events), uansett hvor den ligger. */
function samleTekst(raa: string): string {
  const deler: string[] = [];
  const gaa = (v: unknown) => {
    if (typeof v === "string") deler.push(v);
    else if (Array.isArray(v)) v.forEach(gaa);
    else if (v && typeof v === "object") Object.values(v).forEach(gaa);
  };
  const linjer = raa.split("\n").filter((l) => l.startsWith("data:"));
  if (linjer.length > 0) {
    for (const l of linjer) {
      try { gaa((JSON.parse(l.slice(5)) as { delta?: unknown }).delta); } catch { /* hopp over */ }
    }
  } else {
    try { gaa(JSON.parse(raa)); } catch { deler.push(raa); }
  }
  return deler.join("");
}

/** Gir sikkerheten til hver boks i et SAM 3.1-svar. */
export function parseBokser(raa: string): number[] {
  return [...samleTekst(raa).matchAll(/<\|box;([^|]*)\|>/g)].map((m) => {
    const c = /(?:^|;)c=([0-9.]+)/.exec(m[1]);
    return c ? Number(c[1]) : 1;
  });
}

async function sam31Antall(bilde: string, prompt: string): Promise<number[]> {
  const res = await fetch(META_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${metaNokkel()}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "sam-3.1",
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: prompt }, { type: "input_image", image_url: bilde }] }],
      stream: false,
      metadata: { include_confidence: "true", mask_encoding: "one_bit" },
    }),
    signal: AbortSignal.timeout(40_000),
  });
  if (!res.ok) throw new Error(`Meta API svarte ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return parseBokser(await res.text());
}

export const sam31Teller: Teller = {
  navn: "sam3.1",
  async tell({ state, hylle, bilde }) {
    if (!metaNokkel()) throw new Error("META_API_KEY er ikke satt");
    try {
      const varer = await Promise.all(
        hylle.innhold.map(async (p) => {
          const v = vare(state, p.sku);
          const prompt = v?.prompt ?? [v?.farge, v?.navn].filter(Boolean).join(" ");
          const c = await sam31Antall(bilde, prompt);
          const sikre = c.filter((x) => x >= SAM_TERSKEL).length;
          const med = c.filter((x) => x >= SAM_LAV_TERSKEL).length;
          const snitt = c.length ? c.reduce((a, b) => a + b, 0) / c.length : 0.9;
          return {
            sku: p.sku,
            antall: sikre,
            sikkerhet: med > sikre ? Math.min(0.75, snitt) : snitt,
            alternativ: med > sikre ? med : null,
            merknad: med > sikre ? "Noen funn er usikre" : "",
          };
        }),
      );
      return { varer, ukjente: [], bildekvalitet: "god", kommentar: "Telt med SAM 3.1" };
    } catch (e) {
      // Reserve: Claude, hvis nøkkel finnes. Ellers kaster vi feilen videre.
      if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
        console.error("SAM 3.1 feilet, bruker Claude:", e);
        return claudeTeller.tell({ state, hylle, bilde });
      }
      throw e;
    }
  },
};

// ---------------- Demo ----------------
// Faste tall fra demomanuset, så demoen alltid går selv uten nett eller API-nøkkel.

const DEMO: Record<string, Record<string, [number, number, number | null, string]>> = {
  // Bord 1: en brusboks plukket (ordre 20501), en penn borte uten ordre (mulig svinn), to kaffekopper kom (PO-3001).
  T1: {
    "BRUS-RED": [3, 0.96, null, ""],
    "PENN-SVART": [2, 0.74, 3, "Pennene ligger delvis oppå hverandre"],
    "KAFFE-KOPP": [5, 0.95, null, ""],
  },
};

export const demoTeller: Teller = {
  navn: "demo",
  async tell({ state, hylle }) {
    await new Promise((r) => setTimeout(r, 2500));
    const tall = DEMO[hylle.id] ?? {};
    if (!hylle.innhold.some((p) => tall[p.sku])) {
      // Demoen har bare faste tall for demovarene. For egne varer ville den bare gjentatt forrige antall.
      throw new Error("Ingen ekte teller er satt opp. Sett META_API_KEY, ANTHROPIC_API_KEY eller SAM3_URL i .env");
    }
    return {
      varer: hylle.innhold.map((p) => {
        const d = tall[p.sku];
        return d
          ? { sku: p.sku, antall: d[0], sikkerhet: d[1], alternativ: d[2], merknad: d[3] }
          : { sku: p.sku, antall: beholdning(state, p.sku, hylle.id), sikkerhet: 0.95, alternativ: null, merknad: "" };
      }),
      ukjente: [],
      bildekvalitet: "god",
      kommentar: "Demotelling (fast resultat)",
    };
  },
};
