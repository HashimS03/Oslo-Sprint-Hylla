import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { sporHylla, type ChatMelding } from "@/lib/spor";
import { harElevenLabs, taleTilTekst, tekstTilTale } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 60;

// Stemmesamtale for mobilappen:
// - multipart med `lyd` (opptak) og `historikk` (JSON): tale → tekst → Hylla svarer → tale
// - JSON { tekst, historikk }: hopper over tale-til-tekst
// Svaret har `lyd` (mp3 som data-URL) når ElevenLabs er satt opp. Ellers leser appen opp selv.
export async function POST(req: Request) {
  let sporsmal = "";
  let historikk: ChatMelding[] = [];
  try {
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      historikk = JSON.parse(String(form.get("historikk") ?? "[]"));
      const lyd = form.get("lyd");
      if (!(lyd instanceof Blob)) return NextResponse.json({ feil: "Mangler lydopptak" }, { status: 400 });
      if (!harElevenLabs()) return NextResponse.json({ feil: "Tale-til-tekst krever ELEVENLABS_API_KEY", trengerTekst: true }, { status: 501 });
      sporsmal = await taleTilTekst(lyd, (lyd as File).name || "sporsmal.m4a");
      if (!sporsmal) return NextResponse.json({ sporsmal: "", svar: "Jeg hørte ikke hva du sa. Prøv igjen.", kort: [] });
    } else {
      const b = (await req.json()) as { tekst: string; historikk?: ChatMelding[] };
      sporsmal = b.tekst;
      historikk = b.historikk ?? [];
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
