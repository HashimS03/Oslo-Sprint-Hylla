import { NextResponse } from "next/server";
import { COOKIE, COOKIE_MAKS_ALDER, kobleTil } from "@/lib/enheter";
import { KobleSkjema } from "@/lib/skjema";
import { begrens, lesJson } from "@/lib/vern";

export const runtime = "nodejs";

// Kobler til en ny enhet med koden fra QR-koden (eller lederkoden for den første enheten).
// - Expo-appen sender headeren x-hylla-app: 1 og får nøkkelen i svaret.
// - Nettleseren får nøkkelen i en httpOnly-cookie som JavaScript ikke kan lese.
export async function POST(req: Request) {
  const stopp = begrens(req, "kobling");
  if (stopp) return stopp;
  const b = await lesJson(req, KobleSkjema);
  if ("svar" in b) return b.svar;
  const { kode, lederkode, navn } = b.data;

  try {
    const res = await kobleTil(navn || "Ukjent enhet", { kode, lederkode });
    if (!res) {
      return NextResponse.json({ feil: "Koden er feil eller utløpt. Be om en ny QR-kode." }, { status: 401 });
    }
    if (req.headers.get("x-hylla-app") === "1") {
      return NextResponse.json({ nokkel: res.nokkel, enhet: { id: res.enhet.id, navn: res.enhet.navn } });
    }
    const svar = NextResponse.json({ enhet: { id: res.enhet.id, navn: res.enhet.navn } });
    svar.cookies.set(COOKIE, res.nokkel, {
      httpOnly: true,
      secure: new URL(req.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAKS_ALDER,
    });
    return svar;
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Kunne ikke koble til" }, { status: 400 });
  }
}
