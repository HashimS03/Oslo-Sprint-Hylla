import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Hylle, State, TelleResultat } from "./types";
import { beholdning, sisteTelling, vare } from "./lager";

// En teller tar et hyllebilde og returnerer antall per vare.
// Tre varianter, valgt med HYLLA_TELLER (claude | yolo | demo):
// - claude: Claude ser på bildet og teller (standard når ANTHROPIC_API_KEY finnes)
// - yolo:   en egen YOLO-tjeneste (se yolo/), satt med YOLO_URL
// - demo:   faste tall fra demomanuset, uten nettverk

export type TellerInput = { state: State; hylle: Hylle; bilde: string /* data-URL */ };
export type Teller = { navn: string; tell: (i: TellerInput) => Promise<TelleResultat> };

export function velgTeller(tvingDemo = false): Teller {
  if (tvingDemo) return demoTeller;
  const valgt = process.env.HYLLA_TELLER;
  if (valgt === "demo") return demoTeller;
  if (valgt === "yolo" || (!valgt && process.env.YOLO_URL && !process.env.ANTHROPIC_API_KEY)) return yoloTeller;
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return claudeTeller;
  return demoTeller;
}

// ---------------- Claude ----------------

const MODELL = process.env.HYLLA_MODELL ?? "claude-opus-5-5";

const SYSTEM = `Du teller varer på lagerhyller fra ett bilde tatt med mobil.

Slik teller du:
- Tell hver vare for seg. Varene ligger brettet og stablet. Tell plagg i hver stabel, og legg sammen.
- Bruk kantene av plaggene (de lyse eller mørke stripene i stabelen) for å telle lagene.
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

export const yoloTeller: Teller = {
  navn: "yolo",
  async tell({ hylle, bilde }) {
    const url = process.env.YOLO_URL;
    if (!url) throw new Error("YOLO_URL er ikke satt");
    const res = await fetch(`${url.replace(/\/$/, "")}/tell`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hylle: hylle.id, bilde, varer: hylle.innhold }),
    });
    if (!res.ok) throw new Error(`YOLO-tjenesten svarte ${res.status}`);
    return (await res.json()) as TelleResultat;
  },
};

// ---------------- Demo ----------------
// Faste tall fra demomanuset, så demoen alltid går selv uten nett eller API-nøkkel.

const DEMO: Record<string, Record<string, [number, number, number | null, string]>> = {
  B3: {
    "TS-BLK-M": [18, 0.96, null, ""],
    "TS-WHT-M": [14, 0.74, 15, "Stabel 3 er delvis skjult"],
  },
};

export const demoTeller: Teller = {
  navn: "demo",
  async tell({ state, hylle }) {
    await new Promise((r) => setTimeout(r, 2500));
    const tall = DEMO[hylle.id] ?? {};
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
