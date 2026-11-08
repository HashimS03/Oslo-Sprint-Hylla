import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, COOKIE_MAKS_ALDER, finnEnhet, kreverKobling, nokkelFra } from "@/lib/enheter";

// Kjører foran alle sider og API-ruter:
// 1. CORS, så mobilappen (også Expo i nettleser) kan kalle API-et fra en annen adresse.
// 2. Slipper bare inn enheter som er koblet til med QR-kode (se src/lib/enheter.ts).

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-hylla-secret,x-hylla-app",
};

/** Sider og ruter som må virke før enheten er koblet. /api/verktoy har sin egen hemmelighet. */
const APNE = ["/koble", "/api/enheter/koble", "/api/enheter/meg", "/api/verktoy/"];
const erApen = (sti: string) => APNE.some((a) => (a.endsWith("/") ? sti.startsWith(a) : sti === a || sti.startsWith(`${a}/`)));

export async function middleware(req: NextRequest) {
  const sti = req.nextUrl.pathname;
  const api = sti.startsWith("/api/");
  if (api && req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: CORS });

  // Ingen får sende inn x-hylla-enhet selv. Den settes bare her, etter at nøkkelen er sjekket.
  const hoder = new Headers(req.headers);
  hoder.delete("x-hylla-enhet");

  const nokkel = nokkelFra(req);
  if (kreverKobling() && !erApen(sti)) {
    const enhet = await finnEnhet(nokkel);
    if (!enhet) {
      if (api) {
        return NextResponse.json(
          { feil: "Denne enheten er ikke koblet til Hylla. Skann QR-koden fra en annen enhet.", trengerKobling: true },
          { status: 401, headers: CORS },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/koble";
      url.search = sti === "/" ? "" : `?neste=${encodeURIComponent(sti + req.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
    hoder.set("x-hylla-enhet", enhet.id);
  }

  const res = NextResponse.next({ request: { headers: hoder } });
  if (api) for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  // Fornyer cookien når en side åpnes, så en enhet som brukes jevnlig aldri blir logget ut.
  const cookie = req.cookies.get(COOKIE)?.value;
  if (!api && cookie && cookie === nokkel) {
    res.cookies.set(COOKIE, cookie, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: COOKIE_MAKS_ALDER });
  }
  return res;
}

export const config = {
  runtime: "nodejs",
  // Alt unntatt statiske filer (JS/CSS, ikoner og manifest), som må kunne lastes før kobling.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|ikon-|apple-touch-icon|manifest\\.webmanifest).*)"],
};
