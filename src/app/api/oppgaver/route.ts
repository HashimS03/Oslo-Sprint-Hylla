import { NextResponse } from "next/server";
import { endreState, hentState } from "@/lib/store";
import { lagOppgave, oppgaveListe, oppgaveVisning, sikreAvvikOppdrag, sikreDemoOppgaver, trengerAvvikOppdrag, type NyOppgave } from "@/lib/oppgaver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Alle oppgaver til de ansatte (scannerappen og dashbordet). */
export async function GET() {
  let s = await hentState();
  // Første gang: legg inn demo-oppgaver, så demoen har noe å vise.
  if (!s.oppgaver) s = await endreState((st) => (sikreDemoOppgaver(st), st));
  // Åpne avvik som ingen har fått beskjed om, blir oppgaver her.
  if (trengerAvvikOppdrag(s)) s = await endreState((st) => (sikreAvvikOppdrag(st), st));
  const oppgaver = oppgaveListe(s).map((o) => oppgaveVisning(s, o));
  return NextResponse.json({ oppgaver, nye: oppgaver.filter((o) => o.status === "ny").length });
}

/** Lag en ny oppgave. Brukes av dashbordet (driftsleder) og takkameraet. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as NyOppgave;
  try {
    const oppgave = await endreState((s) => {
      sikreDemoOppgaver(s);
      return lagOppgave(s, b);
    });
    return NextResponse.json({ oppgave }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Feil" }, { status: 400 });
  }
}
