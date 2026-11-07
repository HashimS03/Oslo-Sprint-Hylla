import { NextResponse } from "next/server";
import { COOKIE, likeTrygt, pin, pinAktiv, tilgangsToken } from "@/lib/tilgang";

export const runtime = "nodejs";

// Sjekker PIN-koden og setter tilgangscookien. Middleware begrenser antall forsøk per IP.
export async function POST(req: Request) {
  if (!pinAktiv()) return NextResponse.json({ ok: true, apen: true });
  const { pin: forsok } = (await req.json().catch(() => ({}))) as { pin?: unknown };
  if (typeof forsok !== "string" || !likeTrygt(forsok, pin())) {
    await new Promise((r) => setTimeout(r, 800)); // gjør gjetting tregere
    return NextResponse.json({ feil: "Feil PIN-kode" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await tilgangsToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax: følger med når man åpner en lenke (f.eks. QR-koden til kameraet), men ikke på POST fra andre nettsider.
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

/** Logg ut på denne enheten. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
