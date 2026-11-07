import { NextResponse } from "next/server";
import { nullstill } from "@/lib/store";

export const runtime = "nodejs";

export async function POST() {
  await nullstill();
  return NextResponse.json({ ok: true });
}
