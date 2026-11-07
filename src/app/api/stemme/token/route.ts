import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Henter et kortlivet samtaletoken fra ElevenLabs, så API-nøkkelen aldri når nettleseren.
export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !agentId) return NextResponse.json({ aktiv: false });
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, {
    headers: { "xi-api-key": key },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("ElevenLabs-token feilet", res.status, await res.text());
    return NextResponse.json({ aktiv: false, feil: `ElevenLabs svarte ${res.status}` }, { status: 502 });
  }
  const { token } = (await res.json()) as { token: string };
  return NextResponse.json({ aktiv: true, token });
}
