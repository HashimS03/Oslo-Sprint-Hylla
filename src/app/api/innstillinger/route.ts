import { NextResponse } from "next/server";
import { endreState } from "@/lib/store";
import type { Innstillinger } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const endring = (await req.json()) as Partial<Innstillinger>;
  const innstillinger = await endreState((s) => {
    s.innstillinger = { ...s.innstillinger, ...endring };
    return s.innstillinger;
  });
  return NextResponse.json({ innstillinger });
}
