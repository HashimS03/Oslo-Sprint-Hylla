import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { kameraerVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ kameraer: kameraerVisning(await hentState()) }); }
