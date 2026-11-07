# Forbedringer av Hylla: få hvert avvik til å forklare hvor, når og i hvilket steg svinnet skjedde (uten å kaste fototellingen)

Bygger videre på `reports/Svinn uten kameratelling.md` og `research_notes/Svinn uten kameratelling/kodebase_og_gjenbruk.md`. Det som står der (arkitektur, verktøyliste, idé A–K, NRF-/ECR-tall) gjentas ikke. Her er fokus: **behold «ta bilde → tell → sammenlign med loggen»**, men gjør klassifiseringen etterpå forklarbar.

Tre typer påstander holdes adskilt:
- **Observert i koden**: med fil og linje (branch `Mayo`, commit 799a841). Ingen filer er endret.
- **Dokumentert kilde**: med URL.
- **Anslag / vår vurdering**: står under *Inferences*. Alle timeanslag er persontimer for noen som kjenner koden, ikke målt.

---

## 1. Hva gjør klassifiseringen i dag, og hvilke kanttilfeller blir feil?

### Takeaway
`forklar()` er en grådig regel med to grener. +N fylles først med åpne PO-er, og resten blir `korrigering`. −N fylles først med åpne ordrer på hylla, og resten blir `mulig_svinn` eller `korrigering` avhengig av terskelen. Den ser bare på **én hylle og én SKU om gangen og på nåværende status for PO-er og ordrer**, aldri på hendelsene mellom to tellinger. Derfor kan den ikke si når eller i hvilket steg noe skjedde. I tillegg finnes minst fire reelle feil: PO-er «spises» av feilplasserte varer, åpne ordrer behandles som bevis på plukk, tidsankeret er per hylle og ikke per SKU, og «funnet» bokføres alltid på den opprinnelige hylla.

### Cited Findings
Dette er observert i koden, med referanse til fil og linje.

**Slik virker det**
- `lagForslag` henter `forrige = sisteTelling(s, hylle)`, altså siste telling **for hylla**. For hver SKU i `hy.innhold` som finnes i telleresultatet regnes `diff = na - beholdning(s, sku, hylle)`, og `forklar` kalles — `src/lib/lager.ts:85, 90-114`
- `forklar` ved +N: løkke over `s.innkjop.filter(i => i.sku === sku && i.mottatt < i.bestilt)`. Filteret ser **ikke på `po.hylle`**, og rekkefølgen er array-rekkefølge, ikke eldste først. Resten blir `{type: "korrigering", aarsak: "Flere enn ventet, ingen åpen innkjøpsordre"}` — `lager.ts:135-142`
- `forklar` ved −N: løkke over åpne ordrer på samme SKU og hylle, som gir `plukk`. Resten blir `mulig_svinn` hvis `-rest >= svinnTerskel`, ellers `korrigering` («Liten nedgang under varslingsgrensen») — `lager.ts:143-157`
- `lagreForslag` kjører `forklar` på nytt når brukeren lagrer. Alle nye hendelser får `tid: telling.tid`. `mottak` øker `po.mottatt`, og `plukk` trekker fra `o.antall` og setter `status: "plukket"` — `lager.ts:181-211`
- `mulig_svinn` får `avvik: {status: "apen", forrigeTellingId: f.forrigeTellingId}`. Dette er det eneste «tidsvinduet» som lagres — `lager.ts:196`
- `lukkAvvik(..., "funnet")` lager en motpost med `hylle: h.hylle`, altså samme hylle som avviket — `lager.ts:226-237`
- `svinnTerskel` er et antall stykker, ikke kroner. Standardverdien er 1 — `types.ts:96`, `seed.ts:98`. `Vare` har **ikke** noe prisfelt — `types.ts:4-17`
- `HendelseType` har ingen `retur`, `flytting`, `justering` eller `skade` — `types.ts:28-35`. Typen er kopiert til `mobil/src/lib/typer.ts:3`, og etikettene ligger i `src/lib/format.ts:27-30`, `mobil/src/lib/format.ts:29`, `mobil/src/components/ui.tsx:116-119` og `src/app/tell/[hylle]/TellFlyt.tsx:241-242`
- Når brukeren retter et tall i appen, regner klienten forklaringen om selv (`justert`). Der blir enhver negativ delta `mulig_svinn` **uten å sjekke `svinnTerskel`**. Serveren regner riktig ved lagring — `mobil/src/app/tell/[hylle].tsx:199-206` og `src/app/tell/[hylle]/TellFlyt.tsx:249-251`
- Kortet `logg` **vises allerede** i mobilen. Det er den siste grenen i `KortVisning`, med klokkeslett, tekst og endring per rad — `mobil/src/components/KortVisning.tsx:51-62`. Dette retter kodenotatet fra forrige runde. `lagKort` lager likevel bare `vare` og `avvik` (kodenotatet, `verktoy.ts:97-105`). `klokke(r.tid)` viser bare klokkeslett, ikke dato.

**Kanttilfeller som blir feil eller misvisende**

| # | Situasjon | Hva koden gjør | Hvorfor det er feil |
|---|---|---|---|
| K1 | +N uten åpen PO | `korrigering` (`lager.ts:142`) | Planen sier «ukjent mottak, bekreft» (kodenotatet). Den vanligste årsaken er feilplassering eller retur, men det blir skjult. |
| K2 | Feilplassering: B3 −2 og B4 +2 for samme SKU, og det finnes en åpen PO for SKU-en | B4 +2 blir `mottak` på PO-en (filteret ignorerer `po.hylle`, `lager.ts:136`), og `po.mottatt += 2` (`lager.ts:199`). B3 −2 blir `mulig_svinn`. | Én fysisk flytting gir én falsk restlevering, én PO som lukkes feilaktig og ett falskt svinn. |
| K3 | Åpen ordre som ennå ikke er plukket, men varen er stjålet | −1 blir `plukk` og ordren lukkes. Når plukkeren tar den neste varen, gir neste telling −1 som `mulig_svinn` | Svinnet flyttes til feil tidsvindu og feil hylle-økt. «Ordren er åpen» blir behandlet som bevis for at plukket har skjedd. |
| K4 | Delvis telling (bare noen SKU-er talt, noe `lagForslag` tillater med `if (!r) continue`, `lager.ts:92`) | `forrigeTellingId` = siste telling av **hylla** | Hvis den forrige tellingen ikke tok med SKU-en, blir tidsvinduet for kort, og «når» blir feil. |
| K5 | Små tap under terskelen | `korrigering` uten avvik | Mange små tap (salami-svinn) blir aldri synlige. Terskelen er i stykker, så 1 stk av en vare til 2 000 kr behandles likt som 1 stk til 15 kr. |
| K6 | Mottak og plukk som utledes ved telling | `tid = telling.tid` (`lager.ts:187`) | Tidslinjen viser alt «ved telling». Den sanne tiden for steget går tapt. |
| K7 | Avvik markert «funnet» på en annen hylle | Motposten føres på den opprinnelige hylla (`lager.ts:230`) | Loggen blir feil for begge hyllene, og læringen «det var feilplassering» blir ikke lagret. |
| K8 | Brukeren retter et tall på mobil | Klienten viser `mulig_svinn` uansett terskel | Det skjermen viser og det som lagres er ulikt. |
| K9 | Én `korrigering` dekker både «flere enn ventet» og «liten nedgang» | Samme type for to ulike ting | Trend per årsak blir umulig (se spørsmål 5 om årsakskoder). |

### Inferences
- K2 og K3 er de farligste i en demo. Begge kan gi et svar som er feil, men ser sikkert ut, foran juryen. K2 er rettet på 15 minutter (`&& i.hylle === hylle`). K3 krever at plukket bekreftes (se spørsmål 2).
- Rotårsaken bak nesten alt er at `forklar` ser på **status nå** (PO og ordre), ikke på **hendelsene i vinduet** siden SKU-en sist ble verifisert.

### Gaps
- Jeg har ikke kjørt koden. Kanttilfellene er funnet ved å lese den. K3 bør testes med et lite skript før dere bruker det i pitchen.

---

## 2. Små endringer i modell, regler og output som gjør hvert avvik forklarbart

### Takeaway
Fem små grep gir «hvor, når og hvilket steg» uten å endre fototellingen. (1) Et **anker per hylle og SKU**: siste telling som faktisk inkluderte SKU-en. (2) En **tidslinje** over hendelsene fra ankeret til nå, med løpende forventet antall. (3) **Mottakssone og retursone som pseudo-hyller** pluss hendelsen `flytting`. Da blir «mottak», «plassering» og «retur» egne, synlige steg uten nye tabeller. (4) En **regelbasert hypoteseliste** med sikkerhetsnivå i stedet for én etikett. (5) **Omtelling med nytt bilde** før noe kalles svinn, og en terskel i kroner. Totalt ca. 12–17 persontimer.

### Cited Findings
- Bransjen anbefaler å undersøke et avvik i denne rekkefølgen: blind omtelling (helst av en annen person), sjekk transaksjoner rundt tellingen (mottak, utsendelse, retur, justering), sjekk **nabolokasjoner**, mottakssone og karantene, sjekk varer som ligner og har lik strekkode eller emballasje, og vurder svinnrisiko. Først til slutt dokumenteres årsaken — [Racklify: cycle count variance](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/)
- Samme kilde lister årsakene: skanne- og registreringsfeil, uklare etiketter, **flyttinger, returer og justeringer som ikke er registrert**, feil ved mottak og plassering, plukkfeil (også «returned to the wrong bin»), tyveri, skade, og telling mens transaksjoner pågår — [Racklify](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/)
- SAP EWM Difference Analyzer viser differanser «with the same stock key … in an aggregated way», uavhengig av dokumentet de oppstod i. Målet er å få saldoen ned mot null før noe bokføres. Toleransegrupper blokkerer bokføring over en grense — [SAP Help: Difference Analysis](https://help.sap.com/saphelp_ewm70/helpdata/en/4c/b4e7d24c1f1921e10000000a15822b/content.htm). Det er samme idé som å nette B3 −2 mot B4 +2 før noe kalles svinn.
- I SAP (klassisk lagerstyring) kan en egen toleransegruppe for bokføring bestemme når et dokument for **omtelling** lages automatisk. «Reason for movement» kan gjøres obligatorisk for bevegelsestypene for tellingsdifferanser (701/702) — søkeresultat-oppsummering av SAP-hjelp og SAP-KBA-er ([SAP Help 4.6C: Physical Inventory Differences](https://help.sap.com/saphelp_46C/helpdata/EN/12/0863e7470311d1894a0000e8323352/content.htm), [SAP KBA 3731770](https://userapps.support.sap.com/sap/support/knowledge/en/3731770)). Jeg har ikke lest disse sidene i sin helhet.
- Eksempler på toleranser per ABC-klasse: A ±1 stk eller ±0,5 %, B ±2 stk eller ±1 %, C ±5 stk eller ±3 %. Kilden presenterer dette som eksempler, ikke som standard — [Racklify: ABC cycle counting](https://racklify.com/encyclopedia/abc-cycle-counting-implementation-steps-kpis-and-best-practices/). En annen sjekkliste bruker ca. 2 % i antall for C-varer og en kronegrense for A-varer — [Manifest: Cycle Counting Checklist](https://app.manifest.ly/public/checklists/cycle-counting-checklist). Jeg fant **ingen** primærkilde fra APICS/ASCM med konkrete prosentsatser.
- Oracle WMS Cloud krever en årsakskode for hver justering (for eksempel «cycle count, damages, QA») — [Oracle WMS: Inventory Adjustment](https://docs.oracle.com/en/cloud/saas/warehouse-management/22c/owmim/inventory-adjustment.html). Oracle SCM bruker «Theft, Misplaced Items, Damaged Items» som eksempler på årsaker ved telling — [Oracle: Inventory Transaction Reasons](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/24b/faims/inventory-transaction-reasons.html)
- Vanlig praksis: årsakskoden er konklusjonen på en undersøkelse, ikke en erstatning for den. Ha en «annet»-kode med fritekst. Hold justeringer tilbake til de er gjennomgått når avviket er uforklart — sammendrag av praktikerkilder (Cleverence, MangoApps) i søk. [MangoApps: discrepancy investigation form](https://www.mangoapps.com/templates/forms/cycle-count-discrepancy-investigation-form) er et eksempel. Kildene er leverandørmaler.

### Inferences
Alt under er forslag og egne anslag.

**T1. Rett de raske feilene (1–1,5 t)**
- K2: `forklar` +N filtrerer også på `i.hylle === hylle` og sorterer PO-er etter `bestiltDato` (0,25 t).
- K1: +N uten PO blir en ny type, `ukjent_okning` (eller `korrigering` med `status: "bekreft"`), med teksten «Flere enn ventet. Sjekk om de kom fra en annen hylle eller en retur.» Hypotesene fra T4 fyller ut teksten (0,5 t).
- K8: la klientens `justert` bruke terskelen, eller hent forklaringen på nytt fra serveren (`/api/tell` med `korrigert`) (0,5 t).

**T2. Anker per SKU og tidslinje (2–3 t)**
- `sisteVerifisert(s, hylle, sku)`: nyeste `Telling` på hylla der `sku in t.antall`. Dette retter K4 (0,5 t).
- `tidslinje(s, hylle, sku)` returnerer `{fra: Telling, tilTid, start: t.antall[sku], rader: [{tid, type, endring, ref, forventetEtter}]}`. Den løper gjennom `s.hendelser` for hylle og SKU med `tid > fra.tid` og summerer. Ingen ny lagring (1 t).
- Output «Avviket oppstod mellom tirsdag 08:00 (talt 6, bilde) og i dag 10:15 (talt 4, bilde). I vinduet: mottak +4 (PO-2291), plukk −2 (20512). Forventet 8, talt 6.» Bruk `lagKort("logg", …)`. Visningen finnes allerede i mobilen (`KortVisning.tsx:51-62`), men `klokke()` må vise dato når vinduet går over flere dager (0,5–1 t).
- Begge **bildene** (fra- og til-tellingen) finnes allerede, fordi `ryddBilder` beholder bildene et avvik viser til (`lager.ts:246-257`). Vis dem side om side. Det er fototellingens sterkeste bevis: «slik så hylla ut da den sist stemte».
- For K6: når plukk og mottak registreres der de skjer (ordrebekreftelse eller mottaksskjerm), får de riktig `tid`. Hendelser som bare utledes ved telling bør merkes `utledet: true`, slik at tidslinjen viser at tiden er usikker.

**T3. Steg som pseudo-hyller: mottakssone og retursone + `flytting` (2–3 t)**
- Minimal modell: `Hylle.sone?: "mottak" | "retur"` og to hyller `MOTTAK` og `RETUR` i seed-dataene. `HendelseType` + `"flytting" | "retur" | "justering" | "skade"`. En flytting er to hendelser (−n fra sone, +n til hylle) med samme `ref` (for eksempel `F-0012`). Ingen ny tabell, fordi `beholdning()` virker uendret.
- Det gir stegene gratis:
  - **mottak**: PO → `MOTTAK` +n
  - **plassering**: `flytting` `MOTTAK` → B3
  - **plukk**: B3 −n med ordre
  - **retur**: kunderetur → `RETUR` +n, og senere `flytting` `RETUR` → B3
- «Står igjen i mottak eller retur» blir rett og slett `beholdning(s, sku, "MOTTAK") > 0`.
- Valgfritt felt: `Innkjop.varslet?: number` (antall på pakkseddelen). Mottaksfeil = `varslet ≠` det som ble registrert inn i `MOTTAK`. Felles med Holio-utfordring 2 og planens F8 (følgeseddel fra bilde).
- Kostnaden er mest UI-etiketter. Typen må utvides i `types.ts` og `mobil/src/lib/typer.ts`, i to `format.ts`, i `ui.tsx` og i `ETIKETT` i `TellFlyt.tsx` (ca. 1 t). Sonene må filtreres bort fra «Velg hylle», `hylleStatus` og telling (0,5 t). Et enkelt API `POST /api/flytting` (0,5–1 t). Lager dere ikke en skjerm for flytting, holder det for demoen at hendelsene ligger i seed-dataene.

**T4. Hypotese-rangering med sikkerhet (3–4 t)**
Ny ren funksjon `forklarAvvik(s, hylle, sku, diff)` → `Hypotese[] = {steg: "mottak"|"plassering"|"plukk"|"retur"|"telling"|"ukjent", tekst, sikkerhet: "hoy"|"middels"|"lav", bevis: string[] (hendelse- eller telling-id-er), forslag: string}`. Reglene kjøres i fast rekkefølge, og koden, ikke LLM-en, bestemmer. Claude forteller bare (samme prinsipp som i dag).

| Regel | Signal i loggen | Steg | Sikkerhet |
|---|---|---|---|
| H1 Feilplassering | En annen hylle (først samme `reol`, så alle) har fått **+k av samme SKU** ved telling etter ankeret, der k ≥ min(\|diff\|, 1), eller `beholdning(MOTTAK eller RETUR)` ≥ \|diff\| | plassering | **høy** ved nøyaktig samme antall, middels ved delvis |
| H2 Bytte eller feil størrelse | En SKU med samme `modell` eller farge og annen størrelse på **samme hylle** har +k mens denne har −k i samme telling | plukk/plassering | høy ved lik størrelse, ellers middels |
| H3 Mottaksfeil | Mottak av SKU-en til hylla eller `MOTTAK` i vinduet, og `varslet − mottatt` = \|diff\|, eller \|diff\| = mottatt antall (mottaket aldri plassert) | mottak | høy ved nøyaktig, middels ellers |
| H4 Retur ikke satt tilbake | `retur` i vinduet, og retursonen har fortsatt varen (−N på hylla, +N i `RETUR`), eller retur ført direkte til hylla i vinduet | retur | middels |
| H5 Plukk uten bekreftelse | Åpen ordre ble brukt som forklaring (K3), eller plukk i vinduet og en annen SKU på hylla er ±1 | plukk | middels/lav |
| H6 Tellefeil | Telleren rapporterte `sikkerhet < 0,8` eller `alternativ` = forventet, `bildekvalitet !== "god"`, eller \|diff\| = 1 og varen er liten | telling | middels → **ber om omtelling** |
| H7 Uforklart (mulig tyveri) | Ingen av H1–H6 treffer, omtellingen bekrefter, og det har vært ≥ 2 uforklarte avvik på hylla siste 14 dager eller høy verdi | ukjent | **alltid lav**. Ordet «tyveri» brukes bare som «mulig» |

- Hovedetiketten i appen blir den høyest rangerte hypotesen. «Mulig svinn» brukes bare når H7 er den eneste.
- For K7: `lukkAvvik(…, "funnet", {hylle})` fører motposten der varen ble funnet, og lagrer `avvik.arsak = "feilplassering"`. Da lærer trendene noe (0,5 t).

**T5. Omtelling før svinn, og terskel i kroner (2–3 t)**
- `AvvikStatus` + `"venter_omtelling"`. Når hovedhypotesen er H6 eller H7, eller verdien er over terskelen, settes status `venter_omtelling` i stedet for `apen`. Appen og stemmen sier «Ta ett bilde til, fra en annen vinkel» (fototelling igjen, så konseptet beholdes). Bekrefter den nye tellingen avviket, blir det `apen` med hypotesene. Hvis ikke, lukkes det som tellefeil.
- `Vare.pris?: number` (NOK) og `Innstillinger.toleranseNok` (for eksempel 200). Regel: varsle hvis `|diff| × pris ≥ toleranseNok` **eller** `|diff| ≥ svinnTerskel`. Små tap under terskelen akkumuleres per hylle og SKU over 14 dager. Når summen passerer grensen, varsles det likevel. Det tar K5 (1 t).

**Tall for hele spørsmål 2:** T1 1–1,5 + T2 2–3 + T3 2–3 + T4 3–4 + T5 2–3 ≈ **10–14,5 t**, pluss ca. 2 t for et nytt verktøy `forklar_avvik`/`spor_avvik` i `verktoy.ts`, prompttekst og registrering i ElevenLabs-dashbordet ≈ **12–17 t**.

### Gaps
- Jeg fant ingen kilde som måler hvor treffsikre slike enkle regler er. Rangeringen er et designvalg, ikke validert.
- Ingen primærkilde fra ASCM/APICS om toleranser ble funnet. Tallene over er praktikereksempler.

---

## 3. Risikobasert «hvilke hyller skal vi fotografere i dag?» fra loggen

### Takeaway
En ren funksjon `fotoliste(s, n)` som gir hver hylle poeng ut fra signaler som allerede finnes eller kommer med T2–T5. Hver hylle får lesbare grunner. Dette er ordrett «Finn hyllene med avvik» fra utfordring 7, og det gjør kameraet mer målrettet i stedet for å erstatte det. Ca. 4–5 t med kort og verktøy.

### Cited Findings
- Fantomlager (systemet viser varer som ikke finnes) viser seg typisk som lange perioder uten salg for en vare systemet sier er på lager. Tripathy (2019) bruker sannsynligheten for en slik «tørke» som signal — [Alanham-studentoppgave, MWDSI 2025](https://matthewalanham.github.io/Students/2025/2025_MWDSI_Detecting_and_Predicting_Phanton_Inventory_Using_Random_Forests_and_LSTM.pdf). En Bayesiansk variant med negativ binomisk fordeling finnes i en MIT-oppgave — [DSpace@MIT 1721.1/122257](https://dspace.mit.edu/handle/1721.1/122257)
- Praktikersignaler for spøkelseslager: SKU-er med null salg og positiv saldo, negative saldoer og plukk, plutselige hopp i beholdningen, antall justeringer per periode, og avstemming av mottak mot hovedbok — [Racklify: ghost stock](https://racklify.com/encyclopedia/ghost-stock-causes-detection-and-remediation/)
- DeHoratius & Raman (2008): 65 % av ca. 370 000 lagerposter i 37 butikker var feil. 26,4 % av variansen lå mellom varekategorier og 2,7 % mellom butikker. Revisjonspraksis reduserer feilene, mens et komplekst butikkmiljø og distribusjonsstrukturen øker dem — [EconPapers, Management Science 54(4)](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641)
- Feilplasserte produkter sto for 60 % av utsolgt-tilfellene i ett utvalg, og feil lagerposter for 24 %. Dette er en søkeoppsummering av Raman, DeHoratius & Ton (2001), og jeg har ikke lest fulltekst — [California Management Review 43(3)](https://cmr.berkeley.edu/2001/05/43-3-execution-the-missing-link-in-retail-operations/)
- Telling styrt av transaksjonsdata ga god gevinst i forhold til kostnaden i et felteksperiment (allerede sitert i forrige rapport) — [Chuang, Oliva & Liu 2016](https://econpapers.repec.org/RePEc:bla:popmgt:v:25:y:2016:i:5:p:935-951)

### Inferences
Poengregler (anslag og designvalg). Alle bygger på data som finnes, eller som kommer med T2–T5:

| Signal | Poeng | Grunn som leses høyt |
|---|---|---|
| Åpent avvik eller `venter_omtelling` på hylla | +5 | «Avvik fra i går er ikke avklart» |
| Negativ `beholdning` for en SKU | +5 | «Loggen viser minus, noe er feil registrert» |
| Nabohylle (samme `reol`) har fått + av en SKU som denne hylla har | +3 | «B4 fikk 2 svarte M for mye i går, kanskje de mangler her» |
| Mottak eller flytting til hylla siden ankeret | +2 | «Mottak av PO-2291 i går, ikke fotografert siden» |
| Varer står i `MOTTAK` eller `RETUR` > 24 t | +2 | «2 returer venter på å bli satt på plass» |
| Åpen ordre eldre enn 24 t på hylla | +1 | «Ordre 20512 er ikke bekreftet plukket» |
| ≥ 2 `mulig_svinn` eller `svinn` siste 14 dager | +3 | «Tredje avvik på to uker» |
| Lagerverdi på hylla (`Σ beholdning × pris`) | +verdi/1 000 (maks +3) | «Dyre varer» |
| Saldo > 0, men ingen plukk på ≥ 5 dager for en vare som ellers selges | +2 | «Mulig spøkelsesvare» |
| Dager siden siste verifiserte telling | +0,5 per dag (maks +3) | «Ikke fotografert på 4 dager» |

- `fotoliste()` (2 t), `GET /api/fotoliste` og verktøyet `hent_fotoliste` (1 t), og et kort eller en sortering av fanen «Velg hylle» med første grunn som undertekst (1–2 t). Totalt **4–5 t**.
- For demoen: listen må sette den plantede hylla øverst. Regn ut poengene for hånd mot seed-dataene.
- Dette er idé B fra forrige rapport, men med fototelling som handlingen. Begrunnelsene kommer fra hypotesereglene i T4, så de to delene forsterker hverandre.

### Gaps
- Vektene er ikke kalibrert mot data. Det ville kreve ekte logger fra Holio.

---

## 4. Svinnverdi i kroner og trend per hylle, leverandør og skift (ikke per ansatt)

### Takeaway
Med `Vare.pris` kan alt summeres i kroner. Trend per hylle og leverandør er enkel og ærlig. Trend per skift er **misvisende** i dag, fordi tiden på hendelsen er telletiden (K6), ikke tidspunktet for tapet. Grupper derfor på *tidsvinduet* eller på steg (hypotese), ikke på skift, inntil plukk og mottak logges der de skjer. Ca. 2–3 t.

### Cited Findings
- Bransjen bruker avviksrapporter (exception-based reporting) til å filtrere på lokasjon, vare, kasse, skift og type transaksjon, og til å sammenligne lokasjoner. Kildene er stort sett leverandørmateriell — [Envysion: retail exception reports](https://envysion.com/envysion/4-retail-exception-reports-you-should-review-daily/), [Savi: EBR for loss prevention](https://getsavi.com/blog/exception-based-reporting-loss-prevention-software)
- ECR-typologien deler tap i kategorier og behandler «unknown loss» som det som blir igjen etter at de andre kategoriene er trukket fra. ECR spør hvor mye av det ukjente tapet som egentlig er systemfeil, feil i masterdata, skannefeil og lignende — sammendrag fra søk om [ECR «Finding the shrink that is not shrink»](https://ecr-group.netlify.app/event/finding-the-shrink-that-is-not-shrink) og [ECR «Beyond Shrinkage»](https://ecr-group.netlify.app/research/beyond-shrinkage-introducing-total-retail-loss-first-paper). Sidene ga feil da jeg prøvde å hente dem, så jeg har ikke lest dem selv.
- Anbefalt praksis er å holde årsakskodene for mottaksfeil, skade og tellingsavvik adskilt, slik at trendene kan rapporteres — søkeoppsummering av [Racklify: inventory adjustments](https://racklify.com/encyclopedia/how-to-process-inventory-adjustments-in-warehouse-operations-workflow-documentation-and-wms-settings/)
- Personvernhensynet (advokat og etisk hacker i juryen, «kameraet peker på hyller») er allerede dokumentert i forrige rapport og kodenotat.

### Inferences
- `svinnRapport(s, {fra, til, gruppering: "hylle"|"leverandor"|"steg"|"vindu"})` → `{gruppe, antallAvvik, stk, nok, andelForklart}`. «Steg» kommer fra hovedhypotesen i T4. Leverandør hentes fra `Vare.leverandor` (2 t).
- **Nøkkeltall for pitchen:** «andel av avvikene som er forklart» (H1–H6 mot H7). Det viser at verktøyet gjør «ukjent svinn» om til kjente prosessfeil, akkurat det ECR peker på.
- Skift: legg det til bare når hendelsene har ekte tid. Utled skift fra `tid` (06–14, 14–22, 22–06), og vis det som «vinduet overlapper skift 2», ikke som skyld. Ingen `ansatt`-felt.
- Visning: tre tall på forsiden (kr i mulig svinn denne uka, kr forklart, topp-hylle) og verktøyet `hent_svinnmonster` (+1 t).

### Gaps
- Ingen reelle priser i seed-dataene. Kronebeløpene i demoen blir konstruerte, og det bør dere si.

---

## 5. Hva støtter reglene i bransjepraksis og forskning?

### Takeaway
Selve undersøkelsesrekkefølgen (omtelling → transaksjoner rundt tellingen → nabolokasjoner og soner → like varer → tyveri sist) er godt beskrevet i praktikerkilder. Det samme gjelder årsakskoder i WMS-er (Oracle, SAP) og netting av differanser på tvers av lokasjoner (SAP EWM). Forskningen støtter at feilplassering og registreringsfeil er store kilder, og at fantomlager kan oppdages fra transaksjonsdata. Jeg fant **ingen** kilde som måler treffsikkerheten til en slik regelbasert rotårsaksrangering.

### Cited Findings
- Rekkefølge og årsaker for undersøkelse — [Racklify: cycle count variance](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/)
- Netting per «stock key» før bokføring, og toleransegrupper — [SAP Help EWM](https://help.sap.com/saphelp_ewm70/helpdata/en/4c/b4e7d24c1f1921e10000000a15822b/content.htm)
- Obligatoriske årsakskoder ved justering — [Oracle WMS](https://docs.oracle.com/en/cloud/saas/warehouse-management/22c/owmim/inventory-adjustment.html), [Oracle SCM](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/24b/faims/inventory-transaction-reasons.html)
- Leverandøreksempler på årsakskoder som skiller steg: «short-shipped from supplier», «Found in Warehouse», «Misplaced», «Pick Error Correction», «Damaged on Receipt», «Receipt correction» — søkeoppsummering av [BigDigit: Stock Adjustment Reason Codes](https://bigdigit.atlassian.net/wiki/spaces/IH2/pages/11273542/Stock+Adjustment+Reason+Codes) og [Wineshipping inventory codes](https://developer.wineshipping.com/docs/codes/inventorycodes)
- Feil ved mottak (feil antall registrert) er en vanlig kilde til avvik — søkeoppsummering av [Infor WMS: inventory adjustment](https://docs.infor.com/wms/2026.x/en-us/useradminlib/sceinmgtug/inventory_management/adjustment_help.html)
- Feilplassering som stor kilde: 60 % av utsolgt-tilfellene i ett utvalg (Raman, DeHoratius & Ton 2001, søkeoppsummering) — [CMR](https://cmr.berkeley.edu/2001/05/43-3-execution-the-missing-link-in-retail-operations/). Feilplassering er også et eget forskningsfelt — [HAL: Execution errors … misplaced products](https://hal.archives-ouvertes.fr/hal-02311740)
- Lagerposter er ofte feil, og feilene henger mer sammen med varekategori enn med butikk — [DeHoratius & Raman 2008](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641)
- Signaler for fantomlager — [Racklify ghost stock](https://racklify.com/encyclopedia/ghost-stock-causes-detection-and-remediation/), [MWDSI 2025](https://matthewalanham.github.io/Students/2025/2025_MWDSI_Detecting_and_Predicting_Phanton_Inventory_Using_Random_Forests_and_LSTM.pdf)
- Avviksrapportering per lokasjon og skift i tapsforebygging — [Envysion](https://envysion.com/envysion/4-retail-exception-reports-you-should-review-daily/)
- ECR: ukjent tap er en restpost, og prosessfeil (masterdata, skanning, systemer) er en stor kandidat — ECR-sider via søk ([lenke](https://ecr-group.netlify.app/event/finding-the-shrink-that-is-not-shrink)), ikke lest i sin helhet

### Inferences
Slik kobles kildene til reglene:

| Regel | Støtte |
|---|---|
| H1 feilplassering, nabohylle | Racklify (nabolokasjoner, «returned to the wrong bin»), SAP-netting, CMR 2001 |
| H2 bytte eller lik vare | Racklify («trace similar SKUs») |
| H3 mottaksfeil | Infor, BigDigit-koder (short-shipped, receipt correction) |
| H4 retur | Racklify (ukjente returer), Racklify ghost stock («returns gaps») |
| H6 omtelling | Racklify (blind omtelling), SAP (automatisk omtellingsdokument) |
| H7 rest = mulig tyveri | ECR (ukjent tap som restpost) |
| Fotoliste | Fantomlager-litteraturen, DeHoratius & Raman, Chuang m.fl. |

### Gaps
- ASCM/APICS-materiale (CPIM) om variansanalyse er bak betalingsmur. Jeg fant ingen åpen primærkilde.
- Manhattan og Ongoing WMS: jeg fant ingen offentlig liste over årsakskoder.
- Sidene til ECR Retail Loss ga feil (503) og LP Magazine sperret tilgang (403). ECR-påstandene bygger derfor på søkeoppsummeringer.

---

## 6. Hvilken historie i seed-dataene gjør demoen overbevisende?

### Takeaway
Tre hyller med hver sin plantede årsak, og de tre gir hver sitt svar: «det er ikke svinn, det står på B4» (feilplassering), «leverandøren sendte for lite» (mottaksfeil), og «ingen registrering forklarer det, det er mulig tyveri, og det er tredje gang» (uforklart). Det viser at systemet skiller prosessfeil fra tyveri, og det er hele poenget. Ca. 4–6 t (samme som felles grunnlag i forrige rapport, men med denne historien).

### Cited Findings
- Dagens seed: én hylle T1, 10 dagligvarer, bare `mottak` og `plukk`, én telling i dag 08:00, PO-3001 (5/3) og ordre 20501 — `src/lib/seed.ts:37-92`. `osloTid(t, m, dager)` gir relative tider — `seed.ts:8-15`.
- Planen og README bruker B3/t-skjorter/PO-2291 (kodenotatet).

### Inferences
Forslag til historie. Alle tall må regnes for hånd. Reol B, t-skjorter i S/M/L, svart og hvit. `pris` er satt fordi kronebeløpene trengs.

**Felles:** hyllene B2, B3, B4 og C1, sonene `MOTTAK` og `RETUR`, 14 dager med mottak, flytting og plukk som går opp, og verifiserte tellinger med bilde hver morgen på B-hyllene.

1. **Feilplassering (H1, høy sikkerhet), B3 og B4.** Tirsdag 08:00 er B3 talt med TS-SVART-M = 6. Onsdag 14:10 flyttes 4 svarte M fra `MOTTAK` til B3 i loggen (`F-0031`), men fysisk havner 2 på B3 og 2 på B4. Ingen plukk i vinduet. Torsdag 08:00 viser fototellingen B3 = 8, der loggen venter 10 (−2), og B4 TS-SVART-M = 2, der loggen venter 0 (+2). Svaret: «Ikke svinn. 2 svarte M ble trolig satt på B4 ved plasseringen onsdag 14:10 (F-0031). B4 har +2. Flytt dem tilbake.» Dette viser også K2-feilen hvis den ikke er rettet, så rett den først.
2. **Mottaksfeil (H3, høy), B2 / PO-2291.** PO-2291 TS-HVIT-L: bestilt 10, `varslet` 10 på pakkseddelen, registrert mottatt 10 i `MOTTAK` mandag, flyttet 10 til B2. Fototellingen tirsdag viser 8. Ingen plukk i vinduet, og ingen nabohylle har +. Svaret: «Avviket oppstod mellom mottak mandag og telling tirsdag. Ingen plukk i vinduet. Trolig kom det bare 8 i esken. Sjekk følgeseddelen eller reklamer til leverandøren.» Det treffer reglene best hvis pakkseddelen sier 8 (`varslet: 8`), men mottaket ble registrert som 10. Da blir det **høy** sikkerhet og et tydelig «steg: mottak».
3. **Mulig tyveri (H7, lav, men gjentatt), C1 nær utgangen.** Dyr vare (for eksempel JAKKE-SVART-M, 1 499 kr). To tidligere `svinn` på C1 de siste 10 dagene (lukket). I dag: fototellingen viser −1, ingen hendelser i vinduet, ingen nabohylle med +, ingen retur. Status blir `venter_omtelling`, og omtelling med nytt bilde bekrefter. Svaret: «Ingen registrering forklarer dette. Tredje uforklarte avvik på C1 på to uker, til sammen 4 497 kr. Mulig tyveri. Vurder å flytte varen bort fra utgangen.» Vi peker på hylla, ikke på folk.
4. *(Valgfritt)* **Retur (H4)** på B3: 1 TS-SVART-S registrert som retur, men den står fortsatt i `RETUR`-sonen. Gir fotolisten grunnen «1 retur venter».

**Demoflyt (forslag, ca. 2 min):** «Hvilke hyller skal vi fotografere i dag?» → fotolisten (C1, B3, B2 med grunner) → foto av B3 → −2 → kortet sier «trolig feilplassert på B4» med tidslinje og to bilder → foto av B4 bekrefter +2 → én knapp «flytt tilbake». Deretter C1: −1 → «ta ett bilde til» → bekreftet → «mulig tyveri, tredje gang, 4 497 kr». Til slutt et tall: «2 av 3 avvik i dag var prosessfeil, ikke svinn.»

- **Risiko:** demotelleren (`teller.ts:262-293`) har faste tall for T1. Den må få faste tall for B2/B3/B4/C1 som passer historien (+1 t), ellers kan kameraet telle «feil» foran juryen. Ha den rette tallretten klar (`korrigert`).

### Gaps
- Jeg har ikke sjekket om rekvisittene (t-skjorter, jakke) finnes hos laget.

---

## 7. Samlet pakke og timeanslag

### Takeaway
Kjernen «forklar avviket» (T1 + T2 + T4 + ny seed) er ca. **12–17 t** og gir mest forklaring per time. Fotolisten (+4–5 t) og omtelling og kroner (+2–3 t) gjør at det svarer ordrett på utfordringen. Hele pakken er ca. **24–33 persontimer**. Det er i øvre kant for tre byggere fra lørdag ettermiddag til søndag 12:00, så kutt fra bunnen.

### Cited Findings
- Kodefrys søndag 12:00, og regelen om å kutte fra Bør og Kan hvis en milepæl henger mer enn én time etter (prosjektplanen, sitert i kodenotatet).

### Inferences
Prioritert rekkefølge med anslag (persontimer, ikke målt):

| # | Endring | Timer | Prioritet |
|---|---|---|---|
| 1 | T1 raske rettelser (K1, K2, K8) | 1–1,5 | Må |
| 2 | Ny seed med historien (spørsmål 6) + demotellerens tall | 5–7 | Må |
| 3 | T2 anker per SKU + tidslinje + `logg`-kort med dato og to bilder | 2–3 | Må |
| 4 | T4 `forklarAvvik` H1, H3, H7 (de tre i demoen) | 2–2,5 | Må |
| 5 | Verktøyet `forklar_avvik` + prompt + ElevenLabs-dashbord | 1,5–2 | Må |
| 6 | `fotoliste()` + kort/sortering + verktøy | 4–5 | Bør (treffer «finn hyllene med avvik») |
| 7 | T5 omtelling med nytt bilde + `Vare.pris` og kronegrense | 2–3 | Bør |
| 8 | T3 soner + `flytting`/`retur` som typer i UI | 2–3 | Bør (nødvendig for at «steg» blir ekte. Minimalt: bare i seed og tidslinje, ca. 1 t) |
| 9 | T4 H2, H4, H5, H6 | 1–1,5 | Kan |
| 10 | Svinnrapport i kroner per hylle, leverandør og steg | 2–3 | Kan |
| 11 | `lukkAvvik` funnet-på-hylle (K7) | 0,5 | Kan |

- Sum Må ≈ 12–16 t, Må + Bør ≈ 20–27 t, alt ≈ 24–33 t.
- Kuttrekkefølge: 10 → 9 → 11 → 8 (behold sonene bare i seed-dataene) → 7.
- Prinsipp for pitchen: «Kameraet teller. Loggen forklarer. Koden bestemmer årsaken, Claude forteller den.» Det beholder fototellingen og svarer på kritikken om at den bare sier *at* noe mangler.

### Gaps
- Anslagene er ikke målt på laget. Kodenotatet tok ikke stilling til klokkeslettet i dag, og jeg har ikke gjort det heller.
- Det er ikke avklart med Holio om ekte logger har hendelser for flytting og retur. Uten dem blir H1/H3/H4 i praksis begrenset til det appen selv registrerer.
