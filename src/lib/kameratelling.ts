import "server-only";
import { endreState, hentState } from "./store";
import { lagForslag, lagreForslag } from "./lager";
import { velgTeller } from "./teller";

/** Teller et kamerabilde, regner ut endringer mot loggen og lagrer dem. Brukes av begge kamerarutene. */
export async function tellOgLagre(opts: { kameraId: string; hylle: string; bilde: string; liten?: string; demo?: boolean }) {
  const state = await hentState();
  const hylle = state.hyller.find((h) => h.id === opts.hylle);
  if (!hylle) throw new Error(`Ukjent hylle ${opts.hylle}`);
  const teller = velgTeller(!!opts.demo);
  const start = Date.now();
  const resultat = await teller.tell({ state, hylle, bilde: opts.bilde });
  return endreState((s) => {
    const forslag = lagForslag(s, hylle.id, resultat, teller.navn, (Date.now() - start) / 1000);
    const kam = s.kameraer.find((k) => k.id === opts.kameraId);
    if (kam) {
      kam.sistSett = new Date().toISOString();
      kam.bilderIdag += 1;
      kam.sisteBilde = opts.liten;
    }
    const endret = forslag.endringer.some((e) => e.deler.length > 0);
    const lagret = lagreForslag(s, forslag, { kilde: "kamera", bilde: opts.liten });
    return { forslag, lagret, endret };
  });
}
