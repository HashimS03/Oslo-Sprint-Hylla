import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { lagKort } from "@/lib/verktoy";

export const runtime = "nodejs";

// Kortdata til ElevenLabs-agentens klientverktøy vis_kort.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const kort = lagKort(await hentState(), u.searchParams.get("type") ?? "vare", u.searchParams.get("id") ?? "");
  return kort ? NextResponse.json({ kort }) : NextResponse.json({ feil: "Fant ikke" }, { status: 404 });
}
