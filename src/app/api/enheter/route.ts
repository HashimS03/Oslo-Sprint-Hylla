import { NextResponse } from "next/server";
import { enhetsliste } from "@/lib/enheter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liste over koblede enheter. Middleware sørger for at bare koblede enheter slipper inn.
export async function GET(req: Request) {
  const denne = req.headers.get("x-hylla-enhet");
  const enheter = (await enhetsliste()).map((e) => ({ ...e, denne: e.id === denne }));
  return NextResponse.json({ enheter });
}
