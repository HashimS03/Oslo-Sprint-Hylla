import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, HEADER, harTilgang, pinAktiv } from "@/lib/tilgang";
import { grenseFor, sjekkRate } from "@/lib/ratebegrensning";

// Kjøres før alle sider og API-kall:
// 1. CORS: bare appens egen adresse og adresser i HYLLA_TILLATTE_ADRESSER (f.eks. Expo i nettleser).
// 2. Rate-begrensning på rutene som koster penger.
// 3. PIN-tilgang når HYLLA_PIN er satt (se src/lib/tilgang.ts).

// Sider og ruter som må virke uten PIN.
const APNE = ["/tilgang", "/api/tilgang", "/api/verktoy"]; // verktoy har sin egen hemmelighet (ElevenLabs)

function tillattOpprinnelse(req: NextRequest, origin: string): boolean {
  try {
    const o = new URL(origin);
    if (o.host === req.headers.get("host")) return true; // samme adresse som appen
    const liste = (process.env.HYLLA_TILLATTE_ADRESSER ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (liste.includes(o.origin)) return true;
    // Lokalt (npm run dev) tillater vi localhost og lokalt nett, så Expo i nettleser virker.
    if (process.env.NODE_ENV !== "production") return /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(o.hostname);
    return false;
  } catch {
    return false;
  }
}

function ip(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "ukjent";
}

export async function middleware(req: NextRequest) {
  const sti = req.nextUrl.pathname;
  const api = sti.startsWith("/api/");
  const origin = req.headers.get("origin");
  const fremmed = !!origin && !tillattOpprinnelse(req, origin);

  const cors: Record<string, string> = {};
  if (api && origin && !fremmed) {
    cors["access-control-allow-origin"] = origin;
    cors["access-control-allow-methods"] = "GET,POST,OPTIONS";
    cors["access-control-allow-headers"] = `content-type,${HEADER}`;
    cors["vary"] = "origin";
  }
  const svar = (body: unknown, status: number, ekstra: Record<string, string> = {}) =>
    NextResponse.json(body, { status, headers: { ...cors, ...ekstra } });

  if (api && req.method === "OPTIONS") return new NextResponse(null, { status: fremmed ? 403 : 204, headers: cors });

  // Andre nettsider skal ikke kunne endre data eller hente stemmetoken.
  if (api && fremmed && (req.method !== "GET" || sti.startsWith("/api/stemme/"))) {
    return svar({ feil: "Ikke tillatt fra denne adressen" }, 403);
  }

  const grense = api ? grenseFor(sti) : null;
  if (grense && (req.method !== "GET" || sti.startsWith("/api/stemme/"))) {
    const vent = sjekkRate(`${ip(req)}:${grense.prefiks}`, grense.perMinutt);
    if (vent > 0) return svar({ feil: "For mange forespørsler. Vent litt og prøv igjen." }, 429, { "retry-after": String(vent) });
  }

  // Allerede låst opp: /tilgang sender rett videre (bare til interne stier).
  if (sti === "/tilgang" && pinAktiv() && (await harTilgang(req.headers, req.cookies.get(COOKIE)?.value))) {
    const neste = req.nextUrl.searchParams.get("neste") ?? "/";
    return NextResponse.redirect(new URL(neste.startsWith("/") && !neste.startsWith("//") ? neste : "/", req.url));
  }

  const apen = APNE.some((p) => sti === p || sti.startsWith(`${p}/`));
  if (pinAktiv() && !apen && !(await harTilgang(req.headers, req.cookies.get(COOKIE)?.value))) {
    if (api) return svar({ feil: "Mangler tilgang. Skriv inn PIN-koden.", trengerPin: true }, 401);
    const url = req.nextUrl.clone();
    url.pathname = "/tilgang";
    url.search = `?neste=${encodeURIComponent(sti + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  return res;
}

export const config = {
  // Alt unntatt statiske filer (ikoner, manifest, JS/CSS fra Next).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|ikon-|apple-touch-icon|manifest.webmanifest).*)"],
};
