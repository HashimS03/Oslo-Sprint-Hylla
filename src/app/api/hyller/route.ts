import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { hyllerVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ hyller: hyllerVisning(await hentState()) }); }
