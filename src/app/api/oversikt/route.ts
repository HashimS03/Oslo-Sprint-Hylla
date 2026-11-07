import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { oversiktVisning } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(oversiktVisning(await hentState())); }
