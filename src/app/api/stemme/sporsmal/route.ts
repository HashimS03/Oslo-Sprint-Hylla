import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { sporHylla } from "@/lib/spor";
import { MAKS_SPORSMAL, ryddHistorikk } from "@/lib/validering";
import { harElevenLabs, taleTilTekst, tekstTilTale } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 60;

// Stemmesamtale for mobilappen:
// - multipart med `lyd` (opptak) og `historikk` (JSON): tale → tekst → Hylla svarer → tale
// - JSON { tekst, historikk }: hopper over tale-til-tekst
// Svaret har `lyd` (mp3 som data-URL) når ElevenLabs er satt opp. Ellers leser appen opp selv.
const MAKS_LYD = 5 * 1024 * 1024; // 5 MB holder godt for et spørsmål på noen sekunder

export async function POST(req: Request) {
  let sporsmal = "";
  let historikk: unknown = [];
  try {
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      try {
        historikk = JSON.parse(String(form.get("historikk") ?? "[]"));
      } catch {
        return NextResponse.json({ feil: "Ugyldig historikk" }, { status: 400 });
      }
      const lyd = form.get("lyd");
      if (!(lyd instanceof Blob)) return NextResponse.json({ feil: "Mangler lydopptak" }, { status: 400 });
      if (lyd.size > MAKS_LYD) return NextResponse.json({ feil: "Lydopptaket er for langt" }, { status: 413 });
      if (!harElevenLabs()) return NextResponse.json({ feil: "Tale-til-tekst krever ELEVENLABS_API_KEY", trengerTekst: true }, { status: 501 });
      sporsmal = await taleTilTekst(lyd, (lyd as File).name || "sporsmal.m4a");
      if (!sporsmal) return NextResponse.json({ sporsmal: "", svar: "Jeg hørte ikke hva du sa. Prøv igjen.", kort: [] });
    } else {
      const b = (await req.json().catch(() => null)) as { tekst?: unknown; historikk?: unknown } | null;
      sporsmal = typeof b?.tekst === "string" ? b.tekst : "";
      historikk = b?.historikk ?? [];
    }
    const samtale = ryddHistorikk([...(Array.isArray(historikk) ? historikk : []), { rolle: "bruker", tekst: sporsmal }]);
    if (!samtale) return NextResponse.json({ feil: `Spørsmålet må være tekst på høyst ${MAKS_SPORSMAL} tegn.` }, { status: 400 });
    const svar = await sporHylla(await hentState(), samtale);
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
