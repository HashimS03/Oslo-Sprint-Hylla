import { NextResponse } from "next/server";
import { sistEndret } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET → { endret } : når lagerets tilstand sist ble lagret. Dashboardet spør hvert sekund og laster siden på nytt bare når den har endret seg.
export async function GET() {
  return NextResponse.json({ endret: await sistEndret() }, { headers: { "cache-control": "no-store" } });
}
