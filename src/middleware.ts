import { NextResponse, type NextRequest } from "next/server";

// Lar mobilappen (også Expo i nettleser) kalle API-et fra en annen adresse.
export function middleware(req: NextRequest) {
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-hylla-secret",
  };
  if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: cors });
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  return res;
}

export const config = { matcher: "/api/:path*" };
