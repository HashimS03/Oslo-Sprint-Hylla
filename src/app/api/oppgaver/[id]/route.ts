import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { apnetOppgave, fullforOppgave, oppgaveListe, oppgaveVisning, taOppgave } from "@/lib/oppgaver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await hentState();
  const o = oppgaveListe(s).find((x) => x.id === id);
  return o ? NextResponse.json({ oppgave: oppgaveVisning(s, o) }) : NextResponse.json({ feil: "Fant ikke oppgaven" }, { status: 404 });
}

/**
 * { handling: "apnet", navn }                    – den ansatte åpnet oppgaven (oppdrag blir «mottatt»)
 * { handling: "ta", navn }                       – en ansatt tar oppgaven
 * { handling: "ferdig", navn, utfall?, svar? }   – ferdig. For avvik-oppgaver og oppdrag: utfall "funnet" | "svinn"
 * Id-en kan være en oppgave ("opg_…") eller et oppdrag fra dashbordet ("o_…").
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { handling?: string; navn?: string; utfall?: "funnet" | "svinn"; svar?: string };
  if (b.handling !== "ta" && b.handling !== "ferdig" && b.handling !== "apnet") return NextResponse.json({ feil: "Ukjent handling" }, { status: 400 });
  try {
    const { s, o } = await endreState((s) => {
      if (b.handling === "apnet") apnetOppgave(s, id, b.navn);
      const o =
        b.handling === "ta" ? taOppgave(s, id, b.navn) :
        b.handling === "ferdig" ? fullforOppgave(s, id, b.navn, b.utfall, b.svar) :
        oppgaveListe(s).find((x) => x.id === id);
      if (!o) throw new Error("Fant ikke oppgaven");
      return { s, o };
    });
    return NextResponse.json({ oppgave: oppgaveVisning(s, o) });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
