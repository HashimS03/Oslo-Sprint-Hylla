import "server-only";
import { endreState, hentState } from "./store";
import { beholdning, nyId, vare } from "./lager";
import type { KameraHendelse, MatcherAvvik, MatcherAvvikType, Skann, State } from "./types";

// Matcheren sammenligner det kameraet ser med det skanneren sier, i et tidsvindu på ±15 s.
// Vanlig kode, ingen AI: reglene under er hele logikken.
//
// Skanneren er generell: den vet hvilken vare som ble plukket, ikke hvilken hylle.
//   Kamera              Skanner (±vindu)        Resultat
//   uttak av Red Bull   plukk Red Bull          OK, ingenting vises
//   uttak av Cola       plukk Red Bull          feil_plass (feil vare tatt), varsel til skanneren med en gang
//   uttak               ingen                   uregistrert_uttak (etter vinduet)
//   ingen bevegelse     plukk Red Bull          skannet_uten_uttak (etter vinduet, hvis kameraet så varens sone)
//   plassering i sone   ingen plassering        mulig_feilplassert (etter vinduet)
//   noe i gang for lenge                        gjenglemt
//   feil produkt i sonen (cola i T1)            feil_vare, med en gang. Lukkes av seg selv når varen er borte.
//
// Mengder sammenlignes ikke ennå: ett uttak og ett plukk av samme vare regnes som samsvar.

const VINDU_MS = Number(process.env.MATCH_VINDU_S ?? 15) * 1000;
const t = (iso: string) => Date.parse(iso);

const TITTEL: Record<MatcherAvvikType, string> = {
  feil_vare: "Feil produkt",
  feil_plass: "Feil plass",
  uregistrert_uttak: "Uregistrert uttak",
  skannet_uten_uttak: "Skannet uten uttak",
  mulig_feilplassert: "Mulig feilplassert vare",
  gjenglemt: "Gjenglemt vare",
};
export const avvikTittel = (type: MatcherAvvikType) => TITTEL[type];

/** Kjører reglene over alt som ikke er behandlet. Trygt å kalle ofte. Endrer state og returnerer nye avvik. */
export function avstem(s: State, naa = Date.now()): MatcherAvvik[] {
  s.skanninger ??= [];
  s.kameraHendelser ??= [];
  s.matcherAvvik ??= [];
  s.matchet ??= {};
  const m = s.matchet;
  const nye: MatcherAvvik[] = [];
  const navn = (sku?: string) => (sku ? vare(s, sku)?.navn ?? sku : "noe");

  const lag = (a: Omit<MatcherAvvik, "id" | "tid" | "status">, ...ider: string[]): MatcherAvvik => {
    const avvik: MatcherAvvik = { id: nyId("m"), tid: new Date(naa).toISOString(), status: "apen", ...a };
    s.matcherAvvik!.push(avvik);
    nye.push(avvik);
    for (const id of ider) m[id] = avvik.id;
    return avvik;
  };
  const nær = (a: string, b: string) => Math.abs(t(a) - t(b)) <= VINDU_MS;
  const ledige = (type: Skann["type"], sku?: string) => s.skanninger!.filter((x) => !m[x.id] && x.type === type && (!sku || x.sku === sku));

  // 1. Uttak i kamera mot plukk på skanner. Skanneren er generell: den vet hvilken vare, ikke hvilken hylle.
  const uttak = s.kameraHendelser.filter((x) => x.type === "uttak" && !m[x.id]);
  const naermest = (k: KameraHendelse, liste: Skann[]) => liste.filter((x) => nær(x.tid, k.tid)).sort((p, q) => Math.abs(t(p.tid) - t(k.tid)) - Math.abs(t(q.tid) - t(k.tid)))[0];
  // 1a. Samme vare skannet og tatt: OK.
  for (const k of uttak) {
    const skann = naermest(k, ledige("plukk", k.sku));
    if (skann) m[k.id] = m[skann.id] = "ok";
  }
  // 1b. En annen vare skannet enn den som ble tatt: feil vare plukket, varsel til skanneren med en gang.
  for (const k of uttak.filter((x) => !m[x.id])) {
    const feil = naermest(k, ledige("plukk"));
    if (feil) {
      lag(
        {
          type: "feil_plass",
          sone: k.sone,
          sone2: hjem(s, feil.sku)[0],
          sku: k.sku,
          antall: k.antall,
          bilde: k.bilde,
          tekst: `Skannet ${navn(feil.sku)}, men tok ${k.antall} × ${navn(k.sku)} fra ${k.sone}`,
          varsel: { melding: `Feil plass: du skannet ${navn(feil.sku)}, men tok ${navn(k.sku)} fra ${k.sone}` },
        },
        k.id,
        feil.id,
      );
    } else if (naa - t(k.tid) > VINDU_MS) {
      lag({ type: "uregistrert_uttak", sone: k.sone, sku: k.sku, antall: k.antall, bilde: k.bilde, tekst: `${k.antall} × ${navn(k.sku)} er tatt fra ${k.sone}, men ikke skannet` }, k.id);
    }
  }

  // 2. Plassering i kamera mot plassering på skanner (samme vare, uansett sone).
  for (const k of s.kameraHendelser.filter((x) => x.type === "plassering" && !m[x.id])) {
    const skann = ledige("plassering", k.sku).find((x) => nær(x.tid, k.tid));
    if (skann) {
      m[k.id] = m[skann.id] = "ok";
      continue;
    }
    if (naa - t(k.tid) > VINDU_MS) {
      lag({ type: "mulig_feilplassert", sone: k.sone, sku: k.sku, antall: k.antall, bilde: k.bilde, tekst: `${k.antall} × ${navn(k.sku)} er satt ned i ${k.sone} uten registrert plassering` }, k.id);
    }
  }

  // 2b. Feil produkt i sonen: avvik med en gang, uavhengig av skanning. Lukkes når kameraet ser at varen er borte.
  for (const k of s.kameraHendelser.filter((x) => x.type === "feil_vare" && !m[x.id])) {
    const apent = s.matcherAvvik.find((a) => a.type === "feil_vare" && a.sone === k.sone && a.sku === k.sku && a.status === "apen");
    if (k.antall === 0) {
      if (apent) apent.status = "loest";
      m[k.id] = "lukket";
      continue;
    }
    const tekst = `${k.antall} × ${navn(k.sku)} står i ${k.sone}, men hører til ${hjemSoner(s, k)}`;
    if (apent) {
      apent.antall = k.antall;
      apent.tekst = tekst;
      m[k.id] = apent.id;
    } else {
      lag({ type: "feil_vare", sone: k.sone, sku: k.sku, antall: k.antall, bilde: k.bilde, tekst }, k.id);
    }
  }

  // 3. Gjenglemt i gang-sonen.
  for (const k of s.kameraHendelser.filter((x) => x.type === "gjenglemt" && !m[x.id])) {
    lag({ type: "gjenglemt", sone: k.sone, sku: k.sku, antall: k.antall, bilde: k.bilde, tekst: `${k.antall} × ${navn(k.sku)} har stått i ${k.sone} lenge` }, k.id);
  }

  // 4. Skanninger uten uttak: bare hvis kameraet har sett varens hjemmesone etter skanningen (ellers er kameraet kanskje av).
  for (const x of s.skanninger.filter((y) => y.type === "plukk" && !m[y.id])) {
    if (naa - t(x.tid) <= VINDU_MS) continue;
    const soner = hjem(s, x.sku);
    const sett = Math.max(0, ...soner.map((z) => (s.soneSett?.[z] ? t(s.soneSett[z]) : 0)));
    if (!sett || sett < t(x.tid) + VINDU_MS) continue;
    lag({ type: "skannet_uten_uttak", sone: soner[0] ?? "?", sku: x.sku, antall: x.antall, tekst: `Plukk av ${navn(x.sku)} er skannet, men kameraet så ikke noe uttak` }, x.id);
  }
  return nye;
}

function hjemSoner(s: State, k: KameraHendelse): string {
  return hjem(s, k.sku ?? "").join(", ") || "en annen sone";
}

/** Sonene (hyller med kamerasone) en vare hører hjemme i. */
function hjem(s: State, sku: string): string[] {
  return s.hyller.filter((h) => h.sone && h.innhold.some((p) => p.sku === sku)).map((h) => h.id);
}

/** Finner varen en strekkode (eller en sku) hører til. */
export function finnVare(s: State, kode: string) {
  const k = kode.trim().toLowerCase();
  return s.varer.find((v) => v.sku.toLowerCase() === k || (v.strekkode && v.strekkode.toLowerCase() === k));
}

/** Registrerer en skanning og kjører matcheren. Skanneren er generell: den sier bare hvilken vare som er plukket eller plassert. */
export function registrerSkann(s: State, inn: { sku: string; antall?: number; type: Skann["type"] }) {
  if (!s.varer.some((v) => v.sku === inn.sku)) throw new Error(`Ukjent vare ${inn.sku}`);
  const antall = Math.max(1, Math.round(inn.antall ?? 1));
  const skann: Skann = { id: nyId("s"), tid: new Date().toISOString(), sku: inn.sku, antall, type: inn.type };
  (s.skanninger ??= []).push(skann);
  // Skanneren oppdaterer lagerloggen for hyller uten kamera. Varen bokføres på hylla den hører hjemme på.
  // Hyller med kamerasone telles av kameraet, så der bekrefter skanningen bare (matcheren) og skriver ikke til loggen.
  const kameraTeller = hjem(s, inn.sku).length > 0 || s.hyller.some((h) => h.sone && beholdning(s, inn.sku, h.id) > 0);
  const hylle = kameraTeller ? undefined : s.hyller.find((h) => h.innhold.some((p) => p.sku === inn.sku))?.id;
  if (hylle) {
    s.hendelser.push({
      id: nyId("h"),
      tid: skann.tid,
      hylle,
      sku: inn.sku,
      endring: inn.type === "plukk" ? -antall : antall,
      type: inn.type === "plukk" ? "plukk" : "mottak",
      aarsak: inn.type === "plukk" ? "Skannet plukk" : "Skannet plassering",
    });
  }
  const nye = avstem(s);
  return { skann, varsler: nye.filter((a) => a.varsel) };
}

/** Kjør matcheren bare hvis noe venter på å bli avstemt (så sidevisninger ikke skriver til lagringen hver gang). */
export async function kjorMatcherVedBehov() {
  const s = await hentState();
  const m = s.matchet ?? {};
  const venter = (s.kameraHendelser ?? []).some((k) => !m[k.id]) || (s.skanninger ?? []).some((x) => x.type === "plukk" && !m[x.id]);
  if (venter) await kjorMatcher();
}

/** Kjør matcheren mot lagret state (brukes når kameraet har sendt nye hendelser). */
export function kjorMatcher() {
  return endreState((s) => avstem(s));
}

/** Alt dashboardet trenger: avvik, nøkkeltall, tell-liste og lagerkart. */
export async function matcherOversikt() {
  await kjorMatcher();
  const s = await hentState();
  const avvik = [...(s.matcherAvvik ?? [])].reverse();
  const apne = avvik.filter((a) => a.status === "apen");
  const iDag = new Date().toDateString();
  const loestIdag = avvik.filter((a) => a.status === "loest" && new Date(a.tid).toDateString() === iDag).length;
  const ok = Object.values(s.matchet ?? {}).filter((v) => v === "ok").length / 2;
  const totalt = ok + avvik.length;
  const soner = s.hyller.filter((h) => h.sone);
  const kart = soner.map((h) => {
    const mine = apne.filter((a) => a.sone === h.id || a.sone2 === h.id);
    return { sone: h.id, navn: h.navn, apne: mine.length, rod: mine.some((a) => a.type === "feil_plass" || a.type === "feil_vare"), vare: h.innhold.map((p) => vare(s, p.sku)?.navn ?? p.sku).join(", ") };
  });
  // Tell-liste: soner med flest uenigheter (alle avvik, åpne teller dobbelt), rangert.
  const tellListe = soner
    .map((h) => {
      const mine = avvik.filter((a) => a.sone === h.id || a.sone2 === h.id);
      const poeng = mine.length + mine.filter((a) => a.status === "apen").length;
      return { sone: h.id, navn: h.navn, uenigheter: mine.length, apne: mine.filter((a) => a.status === "apen").length, poeng };
    })
    .filter((x) => x.uenigheter > 0)
    .sort((a, b) => b.poeng - a.poeng);
  return {
    avvik,
    tall: { apne: apne.length, loestIdag, samsvar: ok, enighet: totalt ? Math.round((ok / totalt) * 100) : null },
    tellListe,
    kart,
    vinduSek: VINDU_MS / 1000,
  };
}

export async function settAvvikStatus(id: string, status: MatcherAvvik["status"]) {
  return endreState((s) => {
    const a = s.matcherAvvik?.find((x) => x.id === id);
    if (!a) throw new Error("Fant ikke avviket");
    a.status = status;
    return a;
  });
}
