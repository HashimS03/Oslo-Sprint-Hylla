import "server-only";

// ElevenLabs via REST fra serveren: tale-til-tekst (Scribe) og tekst-til-tale.
// Brukes av mobilappen, så stemmen fungerer i Expo Go uten egne native moduler.

const API = "https://api.elevenlabs.io/v1";
const nokkel = () => process.env.ELEVENLABS_API_KEY;

export const harElevenLabs = () => !!nokkel();

export async function taleTilTekst(lyd: Blob, filnavn = "sporsmal.m4a"): Promise<string> {
  const form = new FormData();
  form.append("model_id", process.env.ELEVENLABS_STT_MODELL ?? "scribe_v1");
  form.append("language_code", "nor");
  form.append("file", lyd, filnavn);
  const res = await fetch(`${API}/speech-to-text`, { method: "POST", headers: { "xi-api-key": nokkel()! }, body: form });
  if (!res.ok) throw new Error(`ElevenLabs tale-til-tekst svarte ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

export async function tekstTilTale(tekst: string): Promise<string> {
  const stemme = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`${API}/text-to-speech/${stemme}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": nokkel()!, "content-type": "application/json" },
    body: JSON.stringify({ text: tekst, model_id: process.env.ELEVENLABS_TTS_MODELL ?? "eleven_flash_v2_5", language_code: "no" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs tekst-til-tale svarte ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString("base64")}`;
}
