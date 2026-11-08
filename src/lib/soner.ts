import "server-only";
import sharp from "sharp";
import { endreState, hentState } from "./store";
import { beholdning, nyId, vare } from "./lager";
import { ferdigTelt, vurder, type RammeStatus } from "./ramme";
import { velgTeller } from "./teller";
import { kjorMatcher } from "./matcher";
import type { Bokse, Hylle, KameraHendelse, Sone, State } from "./types";

// Takkamera: ett bilde ser flere soner (hyller og gang). Kameraet gjør én ting: det sier fra om hva som skjer i hver sone.
//   uttak      færre varer i sonen enn sist
//   plassering flere varer i sonen enn sist (hjemmehorende = false betyr mulig feilplassert)
//   gjenglemt  noe har stått i gang-sonen lenger enn GJENGLEMT_MS
//   feil_vare  en vare som ikke hører hjemme i sonen står der (cola i T1). antall 0 = fjernet igjen
// Kameraet endrer aldri lagerloggen. Matcheren sammenligner hendelsene med skanninger (±15 s).
// «Ingen bevegelse» er fravær av hendelser, så vi lagrer også når hver sone sist ble sett (soneSett).

const GJENGLEMT_MS = Number(process.env.GJENGLEMT_MS ?? 10 * 60 * 1000);
const LAV_SIKKERHET = 0.6;
/** Takkameraet teller raskere enn den gamle telle-flyten: ett stille bilde holder, og bare en kort pause mellom tellinger. */
const TAK_STILLE = Number(process.env.KAMERA_STILLE ?? 1);
const TAK_PAUSE_MS = Number(process.env.KAMERA_PAUSE_MS ?? 1200);
/** Har kameraet ikke sett sonen på så lenge, regnes neste bilde som en ny start: det setter bare utgangspunktet. */
const NY_START_MS = Number(process.env.KAMERA_NY_START_S ?? 60) * 1000;

type SoneHylle = Hylle & { sone: Sone };

export type SoneResultat = {
  sone: string;
  navn: string;
  status: RammeStatus | "talt" | "feil";
  bevegelse: number;
  endring: number;
  /** Antall funnet per vare i sonen, også varer som ikke hører hjemme her. */
  funnet?: { sku: string; navn: string; antall: number; hjemmehorende: boolean; bokser: Bokse[] }[];
  hendelser?: KameraHendelse[];
  /** Ting telleren så, men som ikke er registrert som varer. */
  ukjente?: string[];
  /** Kort kommentar fra telleren om bildet. */
  kommentar?: string;
  /** Hvilken teller som telte (claude, sam31, demo …). «demo» betyr at ingen ekte teller er satt opp. */
  teller?: string;
  feil?: string;
};

type Global = { __hyllaGang?: Map<string, number> };
const g = globalThis as unknown as Global;
const gangSiden = () => (g.__hyllaGang ??= new Map());

/** Klipper ut en sone fra et bilde (data-URL inn, data-URL ut). */
export async function klippSone(bilde: string, sone: Pick<Sone, "x" | "y" | "b" | "h">): Promise<string> {
  const buf = Buffer.from(bilde.slice(bilde.indexOf(",") + 1), "base64");
  const meta = await sharp(buf).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H) throw new Error("Kunne ikke lese bildestørrelsen");
  const left = Math.max(0, Math.min(W - 1, Math.round(sone.x * W)));
  const top = Math.max(0, Math.min(H - 1, Math.round(sone.y * H)));
  const width = Math.max(1, Math.min(W - left, Math.round(sone.b * W)));
  const height = Math.max(1, Math.min(H - top, Math.round(sone.h * H)));
  const ut = await sharp(buf).extract({ left, top, width, height }).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${ut.toString("base64")}`;
}

/** Sonene (hyller og gang) som ligger i bildet til et kamera. */
export function sonerForKamera(s: State, kameraId: string): SoneHylle[] {
  return s.hyller.filter((h): h is SoneHylle => h.sone?.kamera === kameraId);
}

/**
 * Alle varer som kan dukke opp i bildet: det som hører hjemme på en hylle med sone på dette kameraet.
 * Har ingen sone fått varer ennå, ser kameraet etter alle varene på lageret.
 */
function kandidater(s: State, soner: SoneHylle[]): string[] {
  const valgt = [...new Set(soner.flatMap((h) => h.innhold.map((p) => p.sku)))];
  return valgt.length ? valgt : s.varer.map((v) => v.sku);
}

/** Hendelser fra kameraet, nyeste sist. `etter` er en ISO-tid, `sone` filtrerer på sone. */
export async function hentKameraHendelser(opts: { etter?: string; sone?: string } = {}) {
  const s = await hentState();
  return (s.kameraHendelser ?? []).filter((h) => (!opts.etter || h.tid > opts.etter) && (!opts.sone || h.sone === opts.sone));
}

/**
 * Behandler ett bilde fra et takkamera. Hver sone vurderes for seg, så en hånd i hylle 1 stopper
 * ikke tellingen av hylle 2. Vi klassifiserer bare når bildet i sonen har roet seg og er endret.
 */
export async function behandleTakbilde(opts: {
  kameraId: string; bilde: string; liten?: string; demo?: boolean; tving?: boolean; demoTall?: Record<string, Record<string, number>>;
  /** En telefon som følger med på bare én sone: hele bildet er da sonen, og vi klipper ikke. */
  kunSone?: string;
}) {
  const state = await hentState();
  const alleSoner = sonerForKamera(state, opts.kameraId);
  const soner = opts.kunSone ? alleSoner.filter((z) => z.id === opts.kunSone) : alleSoner;
  if (opts.kunSone && soner.length === 0) throw new Error(`${opts.kunSone} er ikke en sone på kamera ${opts.kameraId}`);
  if (soner.length === 0) throw new Error(`Kamera ${opts.kameraId} har ingen soner`);
  const teller = velgTeller(!!opts.demo);
  const alle = kandidater(state, alleSoner);
  const naa = Date.now();

  // Ny start: har kameraet ikke sett en sone på en stund (eller aldri), gjelder ikke det gamle utgangspunktet.
  // Vi nullstiller det, så første bilde som telles bare setter utgangspunktet. Ellers ville forskjellen mot
  // forrige økt eller demodataene blitt meldt som uttak og plassering (for eksempel Red Bull og Cola).
  const nyStart = soner.filter((z) => {
    const sett = state.soneSett?.[z.id];
    return !sett || naa - Date.parse(sett) > NY_START_MS;
  });
  if (nyStart.length) {
    await endreState((s) => {
      s.soneStand ??= {};
      for (const z of nyStart) s.soneStand[z.id] = {};
    });
  }

  const resultater = await Promise.all(
    soner.map(async (hylle): Promise<SoneResultat> => {
      const nokkel = `${opts.kameraId}:${hylle.id}`;
      const grunn = { sone: hylle.id, navn: hylle.navn };
      const erGang = hylle.sone.type === "gang";
      let klipp: string;
      try {
        klipp = opts.kunSone ? opts.bilde : await klippSone(opts.bilde, hylle.sone);
      } catch (e) {
        return { ...grunn, status: "feil", bevegelse: 0, endring: 0, feil: e instanceof Error ? e.message : "Klipping feilet" };
      }
      const v = await vurder(nokkel, klipp, opts.tving, { stille: TAK_STILLE, pause: TAK_PAUSE_MS });
      const mal = { bevegelse: v.bevegelse, endring: v.endring };
      if (!v.skalTelle) return { ...grunn, status: v.status, ...mal };

      try {
        // Telleren får alle kjente varer som kandidater. Hjemmehørende varer er de som hører til denne hylla.
        // En sone uten valgte varer har ingen «feil» varer: alt den ser, regnes som hjemmehørende.
        const egne = hylle.innhold.length ? hylle.innhold.map((p) => p.sku) : alle;
        const utvidet: Hylle = { ...hylle, innhold: alle.map((sku) => ({ sku, nivaa: egne.includes(sku) ? (hylle.innhold.find((p) => p.sku === sku)?.nivaa ?? "") : "annen sone" })) };
        // demoTall lar demoen og testene oppgi hva kameraet «ser» per sone, uten ekte bilde.
        const oppgitt = opts.demoTall?.[hylle.id];
        const tall = oppgitt
          ? { varer: alle.map((sku) => ({ sku, antall: oppgitt[sku] ?? 0, bokser: demoBokser(oppgitt[sku] ?? 0), sikkerhet: 0.95, alternativ: null, merknad: "" })), ukjente: [], bildekvalitet: "god" as const, kommentar: "Oppgitt i demo" }
          : await teller.tell({ state, hylle: utvidet, bilde: klipp });

        // Boksene gjelder utklippet. Vi regner dem om til hele bildet, så de kan tegnes over kamerabildet.
        const iBildet = (b: Bokse): Bokse => opts.kunSone ? b : ({ x: hylle.sone.x + b.x * hylle.sone.b, y: hylle.sone.y + b.y * hylle.sone.h, b: b.b * hylle.sone.b, h: b.h * hylle.sone.h, c: b.c });
        const funnet = tall.varer.map((r) => ({
          bokser: (r.bokser ?? []).map(iBildet),
          sku: r.sku,
          navn: vare(state, r.sku)?.navn ?? r.sku,
          antall: Math.max(0, Math.round(r.antall)),
          sikkerhet: r.sikkerhet,
          hjemmehorende: egne.includes(r.sku),
        }));

        const hendelser = await endreState((s) => {
          s.kameraHendelser ??= [];
          s.soneStand ??= {};
          s.soneSett ??= {};
          s.soneSett[hylle.id] = new Date().toISOString();
          const ut: KameraHendelse[] = [];
          const lag = (h: Omit<KameraHendelse, "id" | "tid" | "kamera" | "sone" | "bilde">) => {
            const x: KameraHendelse = { id: nyId("k"), tid: new Date().toISOString(), kamera: opts.kameraId, sone: hylle.id, bilde: opts.liten, ...h };
            s.kameraHendelser!.push(x);
            ut.push(x);
          };

          if (erGang) {
            // Gang skal være tom. Står det noe der lenge nok, er det en gjenglemt vare.
            const noe = funnet.filter((f) => f.antall > 0);
            if (noe.length === 0) {
              gangSiden().delete(hylle.id);
            } else {
              const siden = gangSiden().get(hylle.id) ?? naa;
              gangSiden().set(hylle.id, siden);
              if (naa - siden >= GJENGLEMT_MS && !s.kameraHendelser!.some((k) => k.sone === hylle.id && k.type === "gjenglemt" && new Date(k.tid).getTime() >= siden)) {
                for (const f of noe) lag({ type: "gjenglemt", sku: f.sku, antall: f.antall, sikkerhet: f.sikkerhet });
              }
            }
            return ut;
          }

          const stand = (s.soneStand[hylle.id] ??= {});
          const forste = Object.keys(stand).length === 0;

          // Kameraet eier antallet på hyllene det ser. Det det teller, blir beholdningen for varen på denne hylla.
          // Første bilde etter start retter beholdningen til det kameraet ser. Senere endringer bokføres som
          // uttak eller påfylling. Skanneren bekrefter (matcheren), men skriver ikke selv til disse hyllene.
          for (const f of funnet) {
            if (!f.hjemmehorende) continue;
            const iLoggen = beholdning(s, f.sku, hylle.id);
            const forskjell = f.antall - iLoggen;
            if (forskjell === 0) continue;
            // Ble varen nettopp skannet ut mot en bestilling? Da står ordren i loggen på uttaket.
            const skann = forskjell < 0 && !forste ? [...(s.skanninger ?? [])].reverse().find((x) => x.sku === f.sku && x.ordre && !x.ordreBokfort && Date.now() - Date.parse(x.tid) < 120_000) : undefined;
            if (skann) skann.ordreBokfort = true;
            const ordre = skann?.ordre;
            s.hendelser.push({
              id: nyId("h"),
              tid: new Date().toISOString(),
              hylle: hylle.id,
              sku: f.sku,
              endring: forskjell,
              type: forste ? "korrigering" : forskjell < 0 ? "plukk" : "mottak",
              aarsak: forste ? "Talt av kamera" : forskjell < 0 ? (ordre ? `Kamera: tatt ut, ordre ${ordre}` : "Kamera: tatt ut") : "Kamera: lagt på plass",
              ref: "kamera",
            });
          }

          for (const f of funnet) {
            const for_ = stand[f.sku] ?? 0;
            const diff = f.antall - for_;
            stand[f.sku] = f.antall;
            if (!f.hjemmehorende) {
              // Feil produkt i sonen: gir avvik med en gang, også i første bilde. antall 0 betyr at den er fjernet igjen.
              if (diff !== 0) lag({ type: "feil_vare", sku: f.sku, antall: f.antall, hjemmehorende: false, sikkerhet: f.sikkerhet });
              continue;
            }
            if (forste || diff === 0) continue; // første bilde setter bare utgangspunktet
            lag({
              type: diff < 0 ? "uttak" : "plassering",
              sku: f.sku,
              antall: Math.abs(diff),
              hjemmehorende: diff > 0 ? f.hjemmehorende : undefined,
              sikkerhet: f.sikkerhet,
            });
          }
          const kam = s.kameraer.find((k) => k.id === opts.kameraId);
          if (kam) {
            kam.sistSett = new Date().toISOString();
            kam.bilderIdag += 1;
            kam.sisteBilde = opts.liten;
          }
          return ut;
        });
        await ferdigTelt(nokkel, klipp, true);
        return {
          ...grunn,
          status: "talt",
          ...mal,
          funnet: funnet.map(({ sikkerhet: _s, ...rest }) => rest),
          hendelser,
          ukjente: tall.ukjente ?? [],
          kommentar: tall.kommentar ?? "",
          teller: oppgitt ? "demo" : teller.navn,
        };
      } catch (e) {
        console.error(`Telling av sone ${hylle.id} feilet`, e);
        await ferdigTelt(nokkel, klipp, false);
        return { ...grunn, status: "feil", ...mal, feil: e instanceof Error ? e.message : "Tellingen feilet" };
      }
    }),
  );

  // Heartbeat for alle soner, også de uten endring, så matcheren kan si «ingen bevegelse».
  await endreState((s) => {
    s.soneSett ??= {};
    for (const h of soner) s.soneSett[h.id] = new Date().toISOString();
  });

  // Nye kamerahendelser kan treffe en skanning som allerede ligger der (for eksempel feil plass).
  await kjorMatcher();

  const lavSikkerhet = resultater.flatMap((r) => r.hendelser ?? []).some((h) => h.sikkerhet < LAV_SIKKERHET);
  return { kameraId: opts.kameraId, teller: teller.navn, soner: resultater, lavSikkerhet };
}

/** Falske bokser til demoen: n bokser på en rad i utklippet, så oppsettet kan vises uten ekte bilder. */
function demoBokser(n: number): Bokse[] {
  const b = Math.min(0.2, 0.9 / Math.max(n, 1));
  return Array.from({ length: n }, (_, i) => ({ x: 0.05 + i * (b + 0.02), y: 0.35, b, h: 0.3, c: 0.9 }));
}
