import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { lagreForslag } from "@/lib/lager";
import { oppsummerTelling } from "@/lib/oppsummering";
import { harElevenLabs, tekstTilTale } from "@/lib/elevenlabs";
import type { Forslag, Telling } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

// Lagrer en godkjent telling og svarer med en kort oppsummering som appen leser høyt.
// Med ElevenLabs følger lyden med (mp3 som data-URL), ellers bruker appen nettleserens tale.
export async function POST(req: Request) {
  const { forslag, korrigert, bilde, kilde, medLyd } = (await req.json()) as {
    forslag: Forslag;
    korrigert?: Record<string, number>;
    bilde?: string;
    kilde?: Telling["kilde"];
    medLyd?: boolean;
  };
  const res = await endreState((s) => {
    const lagret = lagreForslag(s, forslag, { kilde: kilde ?? "mobil", bilde, korrigert });
    return { ...lagret, oppsummering: oppsummerTelling(s, forslag.hylle, lagret.hendelser, lagret.venter) };
  });
  let lyd: string | undefined;
  if (medLyd && harElevenLabs()) {
    try {
      lyd = await tekstTilTale(res.oppsummering);
    } catch (e) {
      console.error("Opplesning av tellingen feilet", e); // Appen faller tilbake til nettleserens tale.
    }
  }
  return NextResponse.json({ ...res, lyd });
}
