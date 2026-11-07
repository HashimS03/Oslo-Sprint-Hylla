import { NextResponse } from "next/server";
import { hentState } from "@/lib/store";
import { logRad } from "@/lib/visning";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const type = u.searchParams.get("type");
  const sku = u.searchParams.get("sku");
  const s = await hentState();
  const rader = [...s.hendelser]
    .filter((h) => (!type || h.type === type || (type === "mulig_svinn" && h.type === "svinn")) && (!sku || h.sku === sku))
    .sort((a, b) => b.tid.localeCompare(a.tid))
    .slice(0, Number(u.searchParams.get("antall") ?? 100))
    .map((h) => logRad(s, h));
  const apneAvvik = s.hendelser.filter((h) => h.type === "mulig_svinn" && h.avvik?.status === "apen").length;
  return NextResponse.json({ rader, apneAvvik });
}
