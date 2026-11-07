import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import { lagreForslag } from "@/lib/lager";
import type { Forslag, Telling } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { forslag, korrigert, bilde, kilde } = (await req.json()) as {
    forslag: Forslag;
    korrigert?: Record<string, number>;
    bilde?: string;
    kilde?: Telling["kilde"];
  };
  const res = await endreState((s) => lagreForslag(s, forslag, { kilde: kilde ?? "mobil", bilde, korrigert }));
  return NextResponse.json(res);
}
