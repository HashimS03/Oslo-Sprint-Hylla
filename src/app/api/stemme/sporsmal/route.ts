import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { sporHylla, type ChatMelding } from "@/lib/spor";
import { harElevenLabs, taleTilTekst, tekstTilTale } from "@/lib/elevenlabs";
import { HistorikkSkjema, StemmeTekstSkjema } from "@/lib/skjema";
import { begrens, lesJson, valider } from "@/lib/vern";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Største lydopptak vi tar imot (Vercel stopper uansett forespørsler over 4,5 MB). */
const MAKS_LYD = 4_000_000;

// Stemmesamtale for mobilappen:
// - multipart med `lyd` (opptak) og `historikk` (JSON): tale → tekst → Hylla svarer → tale
// - JSON { tekst, historikk }: hopper over tale-til-tekst
// Svaret har `lyd` (mp3 som data-URL) når ElevenLabs er satt opp. Ellers leser appen opp selv.
export async function POST(req: Request) {
  const stopp = begrens(req, "ai");
  if (stopp) return stopp;
  let sporsmal = "";
  let historikk: ChatMelding[] = [];
  try {
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      let raaHistorikk: unknown;
      try {
        raaHistorikk = JSON.parse(String(form.get("historikk") ?? "[]"));
      } catch {
        return NextResponse.json({ feil: "Ugyldig historikk" }, { status: 400 });
      }
      const h = valider(raaHistorikk, HistorikkSkjema);
      if ("svar" in h) return h.svar;
      historikk = h.data;
      const lyd = form.get("lyd");
      if (!(lyd instanceof Blob)) return NextResponse.json({ feil: "Mangler lydopptak" }, { status: 400 });
      if (lyd.size > MAKS_LYD) return NextResponse.json({ feil: "Lydopptaket er for langt" }, { status: 413 });
      if (!harElevenLabs()) return NextResponse.json({ feil: "Tale-til-tekst krever ELEVENLABS_API_KEY", trengerTekst: true }, { status: 501 });
      sporsmal = (await taleTilTekst(lyd, (lyd as File).name || "sporsmal.m4a")).slice(0, 2000);
      if (!sporsmal) return NextResponse.json({ sporsmal: "", svar: "Jeg hørte ikke hva du sa. Prøv igjen.", kort: [] });
    } else {
      const b = await lesJson(req, StemmeTekstSkjema);
      if ("svar" in b) return b.svar;
      sporsmal = b.data.tekst;
      historikk = b.data.historikk ?? [];
    }
    const svar = await sporHylla(await hentState(), [...historikk.slice(-10), { rolle: "bruker", tekst: sporsmal }]);
    let lyd: string | undefined;
    if (harElevenLabs()) {
      try {
        lyd = await tekstTilTale(svar.svar);
      } catch (e) {
        console.error(e);
      }
    }
    return NextResponse.json({ sporsmal, ...svar, lyd });
  } catch (e) {
    console.error("Stemme feilet", e);
    return NextResponse.json({ feil: "Hylla klarte ikke å svare akkurat nå." }, { status: 502 });
  }
}
