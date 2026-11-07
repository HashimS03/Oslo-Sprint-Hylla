# Hylla-kodebasen: hva finnes, og hva kan gjenbrukes til svinn uten kameratelling

Kilder er filer i repoet `C:/Users/muhay/Oslo-Sprint-Hylla` (branch `Mayo`, commit 799a841) og prosjektplanen `C:/Users/muhay/Downloads/hylla-prosjektplan.pdf` (versjon 1, fredag 6. november 2026, 14 sider). Linjenumre gjelder filene slik de var da notatet ble skrevet. Under hvert spørsmål er **Cited Findings** det som står i koden eller planen. **Inferences** er mine vurderinger og timeanslag. Ingen filer i repoet er endret.

## 1. Hvordan er koden bygd i dag (arkitektur, datamodell, lagerlogikk)?

### Takeaway
All lagerlogikk er rene funksjoner over ett `State`-objekt, og hele tilstanden lagres som én JSON-rad. Derfor er endringer i datamodellen billige: det holder å endre TypeScript-typene og seed-dataene, uten SQL-migrering. Sammenligningsmotoren (`lagForslag` → `forklar` → `lagreForslag`) bryr seg ikke om hvor tallene kommer fra. Den kan ta imot tall fra strekkodeskanning eller stemme like godt som fra kamera.

### Cited Findings
**Arkitektur**
- To klienter bruker de samme Next.js-API-ene: Expo-appen i `mobil/` (den som demoes) og webappen i `src/app/` — [README.md:9](README.md)
- Prinsipper: «Lagerloggen er sannheten. Beholdningen er alltid summen av hendelsene», «Claude teller bare. Koden regner ut differansen», og ingenting lagres før brukeren trykker Lagre — [README.md:72-76](README.md)
- Lagring: hele `State` ligger som én `jsonb`-rad i tabellen `hylla_state`, eller i minnet når Supabase ikke er satt opp — [src/lib/store.ts:6-55](src/lib/store.ts), [supabase/schema.sql:3-7](supabase/schema.sql)
- `endreState(fn)` leser, endrer og lagrer i en kø. Køen gjelder bare per serverinstans — [src/lib/store.ts:57-68](src/lib/store.ts)
- Det avviker fra planen, som beskriver «Åtte tabeller og ett view» (produkter, hyller, hyllebilder, innkjop+linjer, ordre+linjer, lagerlogg, beholdning-view) — prosjektplan s. 7
- Uten nøkler kjører alt i demomodus med faste tall, regelbaserte svar og data i minnet — [README.md:21](README.md)
- Tester: ingen testrammeverk i `package.json` eller `mobil/package.json`. Den eneste testfilen er `sam3/test_telling.py` — repoets filliste

**Datamodell (`src/lib/types.ts`)**
- `Vare`: `sku, navn, farge, storrelse, leverandor?, swatch, bilder[], beskrivelse?, prompt?`. Det finnes **ingen EAN- eller strekkodefelt** og ingen modell- eller stilgruppering over størrelser — [types.ts:4-17](src/lib/types.ts)
- `Hylle`: `id` («B3»), `reol`, `navn`, `innhold: {sku, nivaa}[]`. Hylla er lokasjonen. Lavere nivå enn hylle finnes bare som fritekst i `nivaa`, og det er ingen kontrollsiffer — [types.ts:19-26](src/lib/types.ts)
- `HendelseType` = `start | mottak | plukk | mulig_svinn | svinn | funnet | korrigering`. Typene **retur, flytting/plassering (put-away), varetelling og skade** mangler — [types.ts:28-35](src/lib/types.ts)
- `Hendelse`: `id, tid (ISO), hylle, sku, endring, type, aarsak, ref? (PO- eller ordrenummer), tellingId?, avvik?{status, forrigeTellingId, lukketTid}`. Det finnes **ikke** felt for ansatt, bruker, skift eller enhet — [types.ts:39-51](src/lib/types.ts)
- `Telling`: `kilde: "mobil" | "kamera" | "manuell"`. Kilden «manuell» finnes altså allerede i typen. I tillegg `antall: Record<sku, number>` og `teller: string` — [types.ts:53-62](src/lib/types.ts)
- `Innkjop`: én PO per SKU (ingen ordrelinjer), med `bestilt, mottatt, bestiltDato, leverandor, hylle`. Det finnes **ingen ASN**, ingen forventet leveringsdato og ingen mottaksdato på selve PO-en. Mottak skrives som `Hendelse` av typen `mottak` med `ref` — [types.ts:64-72](src/lib/types.ts)
- `Ordre`: én linje per ordre, med `sku, hylle, antall, tid, status: "apen" | "plukket"`. Det finnes **ikke** plukker, plukkliste eller status for mangel ved plukk (short pick) — [types.ts:74-81](src/lib/types.ts)
- `Innstillinger`: `svinnTerskel`, `sporNaarUsikker`, `svarHoyt`, `kameraIntervallMin` — [types.ts:94-100](src/lib/types.ts)
- `Kort` (skjermkort fra assistenten) har typene `vare`, `avvik` og `logg` — [types.ts:166-189](src/lib/types.ts). Men `lagKort` lager bare `vare` og `avvik` — [verktoy.ts:97-105](src/lib/verktoy.ts). `logg` er bare deklarert i `mobil/src/lib/typer.ts:69`, og jeg fant ingen kode som viser et slikt kort.

**Lagerlogikk (`src/lib/lager.ts`)**
- `beholdning(s, sku, hylle?)` = summen av `endring` i hendelsene — [lager.ts:22-26](src/lib/lager.ts). `beholdningPerHylle` — [28-33](src/lib/lager.ts). `totalBeholdning` — [35-37](src/lib/lager.ts)
- `sisteTelling`, `apneAvvik`, `erIdag` og `hylleStatus` (gir `avvik | ok | ikke_talt`) — [lager.ts:39-58](src/lib/lager.ts)
- `innkjopForVare` og `plukketSiden(s, sku, iso)` — [lager.ts:60-69](src/lib/lager.ts)
- `lagForslag(s, hylle, resultat: TelleResultat, teller, sekunder)` går gjennom `hy.innhold` og hopper over SKU-er som mangler i resultatet (`if (!r) continue`). En telling av bare én SKU fungerer altså allerede. Differansen regnes mot beholdningen i loggen — [lager.ts:76-130](src/lib/lager.ts)
- `forklar(s, hylle, sku, diff)`: Ved økning brukes først åpne PO-er for SKU-en (uansett hylle) som `mottak`, og resten blir `korrigering` («ingen åpen innkjøpsordre»). Ved nedgang brukes først åpne ordrer for SKU-en på denne hylla som `plukk`. Resten blir `mulig_svinn` hvis det er minst `svinnTerskel`, ellers `korrigering` — [lager.ts:132-160](src/lib/lager.ts)
- Planen sier at «+N uten åpen PO» skal bli «Ukjent mottak, brukeren blir bedt om å bekrefte» — prosjektplan s. 4. Koden gjør det til `korrigering` — [lager.ts:142](src/lib/lager.ts)
- `lagreForslag(s, f, {kilde, bilde?, korrigert?})` skriver `Telling` og `Hendelse`-er, oppdaterer `po.mottatt` og trekker plukkede antall fra åpne ordrer — [lager.ts:163-215](src/lib/lager.ts)
- `lukkAvvik(s, id, "funnet" | "svinn" | "salg")` — [lager.ts:218-243](src/lib/lager.ts). API: `POST /api/avvik/[id]` — [src/app/api/avvik/[id]/route.ts:17](src/app/api/avvik/[id]/route.ts)
- `oppsummerTelling` lager en norsk setning per hendelsestype, som leses høyt etter lagring — [src/lib/oppsummering.ts:16-37](src/lib/oppsummering.ts)
- `POST /api/tell` velger teller og returnerer et `Forslag` uten å lagre — [src/app/api/tell/route.ts](src/app/api/tell/route.ts). `POST /api/tell/lagre` kjører `lagreForslag` og `oppsummerTelling` og legger ved TTS-lyd fra ElevenLabs (`medLyd`) — [src/app/api/tell/lagre/route.ts](src/app/api/tell/lagre/route.ts)
- `POST /api/ordrer` registrerer et salg som åpen ordre — [src/app/api/ordrer/route.ts:12-35](src/app/api/ordrer/route.ts). `GET /api/logg?type=&sku=&antall=` — [src/app/api/logg/route.ts](src/app/api/logg/route.ts)
- Tellerne (Claude, SAM 3, SAM 3.1, YOLO, demo) velges i `velgTeller` — [src/lib/teller.ts:18-28](src/lib/teller.ts). Demotelleren gir faste tall for T1 — [teller.ts:262-293](src/lib/teller.ts)

**Mobilappen (`mobil/`)**
- Fanene er `index`, `tell`, `spor`, `logg` og `varer`. I tillegg finnes skjermene `tell/[hylle]` (kamera → analyse → resultat med retting av tall), `avvik/[id]`, `vare/[sku]`, `ny-vare`, `ny-hylle`, `kamera/[hylle]` (kamerastasjon) og `innstillinger` — repoets filliste og [mobil/src/app/tell/[hylle].tsx:20-223](mobil/src/app/tell/[hylle].tsx)
- `Resultat` i `tell/[hylle].tsx` viser `ForslagEndring`, lar brukeren velge et annet tall (`valg`) og lagrer via `/api/tell/lagre` med `korrigert` — [tell/[hylle].tsx:209-223](mobil/src/app/tell/[hylle].tsx)
- Fanen «Velg hylle» viser hyllene med status (`avvik` filtreres ut separat) — [mobil/src/app/(faner)/tell.tsx:19-29](mobil/src/app/(faner)/tell.tsx)
- Avhengigheter: `expo-camera`, `expo-audio`, `expo-speech`, `expo-haptics`, `expo-image-picker` og flere. Det finnes ikke et eget bibliotek for strekkoder — [mobil/package.json](mobil/package.json)

**Testdata (`src/lib/seed.ts`)**
- Én hylle: `T1` «Bord 1» med 10 dagligvare- og kontorvarer (BRUS-RED, VANN-KLAR, SJOK-MEL, KORN-PK, KAFFE-KOPP, KRUS-HVIT, NOTAT-BLA, PENN-SVART, EPLE-GRONN, BANAN) — [seed.ts:61-79](src/lib/seed.ts)
- 19 hendelser over 6 dager (bare `mottak` og `plukk`), 1 telling (i dag 08:00), 1 PO (PO-3001: 5 bestilt, 3 mottatt), 1 åpen ordre (20501), 1 kamera og `svinnTerskel: 1` — [seed.ts:37-98](src/lib/seed.ts)
- Planen og README bruker et annet demosett (B3 med svarte og hvite t-skjorter, PO-2291), så de er utdatert når det gjelder dette — [README.md:21](README.md), prosjektplan s. 7 og 11

### Inferences
- Motoren er uavhengig av hvor tallene kommer fra. En skann- eller stemmetelling kan pakkes som `TelleResultat { varer: [{sku, antall, sikkerhet: 1, alternativ: null, merknad: ""}], ukjente: [], bildekvalitet: "god", kommentar: "" }` og sendes til `lagForslag` og `lagreForslag` med `kilde: "manuell"`. Da trengs ingen ny sammenligningslogikk.
- Siden alt ligger i én JSON-rad, betyr «nytt felt» bare å endre typen og `seed.ts`. Det er raskt nok for en hackathon. Ulempen er at det ikke finnes ekte SQL-tabeller å vise juryen (planen s. 13 foreslo «Vis tabellen i Supabase»).
- Seed-dataene er det største hinderet for B, C og F. Med én hylle, ingen svinnhistorikk og bare `mottak`/`plukk` blir lister og mønstre meningsløse. Seed-dataene må skrives om uansett hvilken idé dere velger.

### Gaps
- Jeg har ikke kjørt appen eller sjekket at alle ruter virker. Notatet bygger bare på lesing av koden.
- Jeg fant ingen kode som viser `logg`-kortet. Jeg har ikke sjekket alle komponenter (`KortVisning.tsx`) linje for linje.

## 2. Hva sier prosjektplanen (Holio, jury, demo, roller, tidsplan)?

### Takeaway
Planen bygger hele løsningen på at «mobilkameraet er sensoren» og avslutter demoen med «Ingen skannet en eneste strekkode». En overgang til skanning og stemme snur altså pitchens hovedpoeng. Samtidig peker planen selv på at brukerne allerede går med Zebra-skannere i Holio Ops, og det gjør den nye vinklingen lett å forsvare.

### Cited Findings
- Holio-utfordring 7, sitert i planen: «Tallene stemmer ikke. Finn hyllene med avvik, eller tell fra bilder.» — prosjektplan s. 2
- Brukere: «Lagermedarbeidere som allerede går rundt med mobil eller Zebra-skanner i Holio Ops, og lagerledere som vil vite hvor tallene ikke stemmer.» — prosjektplan s. 2
- Valgt rute: mobilkamera, ingen RFID og ingen faste kameraer — prosjektplan s. 2
- Måfunksjoner F1–F6 (produktkatalog, hyllebilde, stemmeassistent, svinn og avvik, logg og oversikt, nullstill demo). Bør: F7 (bekreft når telleren er usikker). Kan: F8 (følgeseddel fra bilde, Holio-utfordring 2), F9 (svar på eget språk, Holio-utfordring 9) og F10 (fast kameramodus) — prosjektplan s. 3
- Regler for typer: +N med åpen PO gir mottak. +N uten PO gir ukjent mottak, som brukeren bekrefter. −N med åpen plukkordre fra hylla gir plukk. −N uten ordre gir mulig svinn. 0 gir telling — prosjektplan s. 4
- Planlagt arkitektur: ElevenLabs-agent (WebRTC) med webhook-verktøyene `finn_vare`, `hent_beholdning`, `hent_innkjop`, `hent_logg` og klientverktøyet `vis_kort`. Telleresultatet skulle sendes inn i samtalen med `sendUserMessage`, merket `[HYLLEBILDE]` — prosjektplan s. 5 og 8
- Tidsplan: M1 lør 12:00 (ende til ende i tekst), M2 lør 17:00 (stemme og bilde), M3 lør 23:30 (hele demoen), M4 søn 12:00 kodefrys, M5 søn 14:00 levert, minipitch fra 14:15. Korte statusmøter lør kl. 09, 12, 17 og 21. «Henger en milepæl mer enn én time etter, kutter vi fra Bør og Kan før vi kutter søvn» — prosjektplan s. 9
- Roller: A app og skjerm, B stemme og KI, C data og API, D pitch, demo og design — prosjektplan s. 10
- Demomanus, 2 minutter: legg 5 svarte på B3 og ta bilde, som gir «+5, restlevering på PO-2291». Ta bort 2 hvite, som gir rød rad og mulig svinn. Spørsmål med stemmen om svarte t-skjorter. Logg-fanen. Avslutning: «Ingen skannet en eneste strekkode. Dette passer rett inn i Holio Ops, som lagrene allerede bruker på mobil og Zebra.» — prosjektplan s. 11
- Finalen (5–10 min): problemet, live demo (3 min), arkitektur, «hvorfor det er trygt» (loggen er fasiten, nøkler på serveren, kameraet peker på hyller og ikke på folk), forretning og neste steg, spørsmål — prosjektplan s. 12
- Juryen (planens eget anslag ut fra rollene på kickoff-lysbildene, ikke noe juryen har sagt): Martin Schi Nordvold (Head of Holio), Henrik Lexow og Chris Mansfeldt (AI-produkt og produktmarkedsføring, Opera), Andrea Claussen og Mi Le Hagen (design og digital markedsføring), Pål de Vibe (Principal Data Engineer, Knowit), Daniel Christensen (etisk hacker, Telenor), Nils Holger Koefoed (advokat, Ro Sommernes), August Sandmo (gründer, Vaskeladden), Einar Holt og Oscar Gangstad Westbye (Wybe Robotics). Kolonnen «hvordan vi treffer» kom stokket ut da PDF-en ble gjort om til tekst. Stikkordene der er: «Løser utfordring 7 og passer inn i Holio Ops», «KI som gjør ekte arbeid … wow-øyeblikk», «Rene kort, tydelig flyt», «Loggen er fasiten … Vis tabellen i Supabase», «Nøkler på serveren, token, hemmelig header», «Bare testdata. Kameraet peker på hyller», «tillegg i Holio Ops», «faste kameraer eller en robot» — prosjektplan s. 13
- Åpent spørsmål til Holio: «Kan vi låne en Zebra TC27, og har den en leser for RFID?» — prosjektplan s. 14
- Utenfor omfanget i helgen: innlogging og brukere, flere lagre, Shopify, RFID, egen app i App Store — prosjektplan s. 3

### Inferences
- «Ingen innlogging og brukere» står i planen. Skal F (avvik per ansatt) vises, må ansatt være et enkelt felt eller et valg i appen, ikke innlogging.
- Juryen har en advokat og en etisk hacker. Analyse per navngitt ansatt (F) vil trolig få kritiske spørsmål om personvern. «Kameraet peker på hyller og ikke på folk» var et salgspoeng, og å følge med på enkeltansatte trekker i motsatt retning. Bedre å vise mønstre per lokasjon, skift eller leverandør.
- Den nye vinklingen kan bygges på planens egen setning om Zebra i Holio Ops. Avslutningen bør endres fra «ingen skannet en strekkode» til noe som «skanneren dere allerede har, pluss stemmen, finner hvor og når svinnet skjer».

### Gaps
- Holio-PDF-en med de ni utfordringene og hvordan de bedømmer finnes ikke i repoet. Jeg har bare lest planens referat av den.
- Planen sier ikke om Zebra-skanneren faktisk ble lånt, eller hvilken modell og oppsett (DataWedge) laget har tilgang til.

## 3. Hva kan stemmeassistenten gjøre i dag, og hvilke nye webhook-verktøy trengs?

### Takeaway
Det finnes seks verktøy, og alle bare leser. Ingen av dem kan skrive til lageret. Et nytt verktøy lages med tre små kodeendringer i `verktoy.ts`, og ruten `/api/verktoy/[navn]` gjør det automatisk tilgjengelig som webhook. Hvert verktøy må likevel registreres for hånd i ElevenLabs-dashbordet. Viktig: mobilappen bruker **ikke** ElevenLabs-agenten. Den bruker ElevenLabs tale-til-tekst og tekst-til-tale rundt Claude med verktøy. Agenten (WebRTC-samtale) brukes bare i webappen.

### Cited Findings
- Verktøyene (`VERKTOY`) er `finn_vare`, `hent_beholdning`, `hent_innkjop`, `hent_logg`, `hent_avvik` og `vis_kort` — [src/lib/verktoy.ts:108-149](src/lib/verktoy.ts). De kjøres via `kjorVerktoy` (switch) — [verktoy.ts:153-173](src/lib/verktoy.ts)
- `finnVare` gjør et uskarpt fritekstsøk med enkel norsk bøyning. Ord på én bokstav og «xl» vektes høyere for å treffe størrelser — [verktoy.ts:18-34](src/lib/verktoy.ts)
- `hentLogg` filtrerer på sku, hylle og type og gir som standard de 10 siste — [verktoy.ts:75-81](src/lib/verktoy.ts)
- `oversikt(s)` finnes, men er **ikke** med i `VERKTOY` — [verktoy.ts:87-95](src/lib/verktoy.ts)
- Webhook-ruten krever headeren `x-hylla-secret` når `HYLLA_WEBHOOK_SECRET` er satt. Den kjører `kjorVerktoy(await hentState(), navn, input)` og returnerer bare `resultat` (kortet kastes) — [src/app/api/verktoy/[navn]/route.ts](src/app/api/verktoy/[navn]/route.ts). Den bruker `hentState` og ikke `endreState`, så den kan bare lese.
- `/api/verktoy` er unntatt fra PIN-kravet i middleware — [src/middleware.ts:11](src/middleware.ts)
- Oppsett i dashbordet: hvert webhook-verktøy legges inn for hånd (POST og JSON), og `vis_kort` som klientverktøy med «Wait for response» — [docs/elevenlabs.md](docs/elevenlabs.md)
- Systemprompten `SYSTEM_SPOR` sier blant annet: svar kort, med tallet først, bruk verktøyene, ikke gjett, kall `vis_kort` — [src/lib/spor.ts:10-18](src/lib/spor.ts). `sporHylla` kjører opptil 8 runder med verktøykall mot `claude-opus-5-5` — [spor.ts:38-74](src/lib/spor.ts). `demoSvar` er en regelbasert reserve — [spor.ts:79-101](src/lib/spor.ts)
- Mobil stemme: `mobil/src/app/(faner)/spor.tsx` tar opp lyd med `expo-audio` og sender den til `/api/stemme/sporsmal`, eller sender tekst til `/api/spor` — [spor.tsx:68, 114](mobil/src/app/(faner)/spor.tsx). Ruten gjør tale om til tekst med ElevenLabs Scribe (`language_code: "nor"`), lar Claude svare med verktøy og gjør svaret om til tale med ElevenLabs (`eleven_flash_v2_5`) — [src/app/api/stemme/sporsmal/route.ts](src/app/api/stemme/sporsmal/route.ts), [src/lib/elevenlabs.ts](src/lib/elevenlabs.ts)
- Web-stemme: `useConversation` fra `@elevenlabs/react` med klientverktøyet `vis_kort` og `sendUserMessage` — [src/app/spor/ElevenLabsStemme.tsx:33-60](src/app/spor/ElevenLabsStemme.tsx). Token hentes fra `/api/stemme/token` — [src/app/api/stemme/token/route.ts](src/app/api/stemme/token/route.ts)

### Inferences
- Slik lager dere et nytt verktøy: (1) en funksjon i `verktoy.ts`, (2) et objekt i `VERKTOY` med `input_schema`, (3) en `case` i `kjorVerktoy`. Claude-chatten og mobilstemmen får verktøyet med en gang. ElevenLabs-agenten må få det lagt inn i dashbordet. Regn ca. 0,5–1 time per lesende verktøy, inkludert oppsett i dashbordet.
- Skrivende verktøy (for eksempel `registrer_telling` og `lukk_avvik`) trenger en ny variant av `kjorVerktoy` som kjører inne i `endreState`, eller en egen rute. Regn 1–2 timer for det felles grunnlaget. Det må også vurderes om skriving fra webhook kan gjøres uten at brukeren bekrefter. README sier at ingenting lagres før brukeren trykker Lagre.
- Blind telling: `hent_beholdning`, `hent_logg` og `vis_kort(vare)` viser forventet antall. En blindtellingsmodus må derfor ha en egen systemprompt eller agent og et eget, begrenset sett verktøy. Ellers kan assistenten avsløre fasiten. Det er en reell risiko i en LLM-samtale.
- Om ElevenLabs-premien: dagens mobildemo bruker ElevenLabs STT og TTS, ikke Agents. Hvis premien krever bruk av Agents-plattformen, er webappen eller en webvisning den sikre veien for stemmeflyten.

Nye verktøy per idé (navnene er forslag):

| Idé | Nye webhook-verktøy | Leser/skriver |
|---|---|---|
| A Blindtelling | `neste_lokasjon` (neste fra tellelisten, uten forventet antall), `registrer_telling {hylle, sku, antall}` (gir forslag), `bekreft_telling` | L, S |
| B Telleliste | `hent_telleliste {antall?}`, gjerne `oversikt` | L |
| C Detektiv | `spor_avvik {sku, hylle?}` (gir en strukturert trinnliste), `hent_innkjop` finnes | L |
| D Plukk med stemme | `neste_plukk`, `bekreft_lokasjon {kontrollsiffer}`, `bekreft_plukk {antall}`, `meld_mangel` | L, S |
| E Butikkmodus | `rask_sjekk {sok}` (finn_vare + beholdning på én lokasjon), `registrer_telling` (fra A) | L, S |
| F Mønstre | `hent_svinnmonster {gruppering: hylle\|leverandor\|skift\|ansatt}` | L |
| H/I Oppfølging | `lukk_avvik {id, handling}` (logikken finnes i `lukkAvvik`) | S |

### Gaps
- Selve agentoppsettet i ElevenLabs-dashbordet (hvilke verktøy som faktisk er lagt inn, prompt og stemme) ligger ikke i repoet, så jeg har ikke kunnet se det.
- Jeg har ikke sjekket om reglene for ElevenLabs-premien krever Agents eller godtar STT og TTS via API.

## 4. Gjenbruk og timeanslag per idé

### Takeaway
A (blindtelling med skanning og stemme) og B (telleliste ut fra risiko) kan i stor grad gjenbruke motoren og skjermene som finnes. De kan bygges innen fristen (ca. 10–14 og 8–12 persontimer). C (detektiven) gir best svar på «hvor og når» og passer godt med stemme, men krever nye hendelsestyper og en god seed-historie (ca. 10–16 timer). D (plukk med stemme) er for stort og risikabelt til helgen. F bør begrenses til lokasjon, leverandør og skift. G er nesten gratis. Felles for alt: ny seed-data (4–6 timer) og et EAN-felt.

### Cited Findings
(Det som finnes i koden og kan gjenbrukes er samlet under spørsmål 1 og 3. Her nevnes bare punktene som avgjør per idé.)
- `lagForslag` tåler at bare én SKU er talt (`if (!r) continue`) — [lager.ts:91-92](src/lib/lager.ts)
- `Telling.kilde` har allerede «manuell» — [types.ts:57](src/lib/types.ts)
- Det finnes ikke EAN-felt på `Vare` — [types.ts:4-17](src/lib/types.ts)
- `Hendelse` har verken ansatt- eller skiftfelt. Leverandør finnes på `Vare.leverandor` og `Innkjop.leverandor` — [types.ts:9, 39-51, 71](src/lib/types.ts)
- Plukk regnes i dag ut ved telling: åpne ordrer trekkes ned når en telling viser at varen er borte — [lager.ts:144-149, 201-207](src/lib/lager.ts). Ruten `ordrer` sier rett ut at «Når neste telling viser at varen er borte, forklares nedgangen med denne ordren» — [src/app/api/ordrer/route.ts:12-15](src/app/api/ordrer/route.ts)
- `hylleStatus` og `sisteTelling` gir allerede statusene «ikke talt i dag» og «har avvik» — [lager.ts:39-58](src/lib/lager.ts)
- Kameratellingen er ferdig og kan byttes ut (`velgTeller`, `/api/tell`, mobilens `Kamera`-komponent) — [teller.ts:18-28](src/lib/teller.ts), [mobil/src/app/tell/[hylle].tsx:70](mobil/src/app/tell/[hylle].tsx)

### Inferences
Alle tall under er **mine anslag** i persontimer for et lag på fire som kjenner koden. Planen har allerede satt av rolle D til pitch og demo, så i praksis bygger ca. 3 personer. Antar jeg at dere starter lørdag ettermiddag og fryser koden søndag kl. 12, med søvn, gir det ca. 30–40 persontimer til utvikling. Klokkeslettet i dag er ikke kjent, så regn om selv.

**Felles grunnlag (alle ideer trenger dette): ca. 5–8 t**
- `Vare.ean?: string` og EAN i seed-dataene. Oppslag `finnVareEan(s, ean)` (0,5 t).
- Ny seed: 6–10 lokasjoner (for eksempel A1–A4, B1–B4, C1–C2), 20–30 SKU-er med størrelser (t-skjorte S/M/L i to farger, passer med planens rekvisitter), 2 ukers historikk med mottak, plukk, noen retur- og korrigeringshendelser, 2–3 PO-er (én delvis levert), 3–5 åpne ordrer og 2–3 gamle avvik. Bygg inn én tydelig «svinnhistorie» som C kan avdekke (4–6 t, og det må være riktig regnet).
- Hjelpefunksjon som gjør skannede eller sagte tall om til `TelleResultat` (0,5 t).

**A. Blindtelling med stemme og skanning: ca. 10–14 t (middels risiko)**
- Gjenbruk: `lagForslag`, `forklar` og `lagreForslag` (med `kilde: "manuell"`), `oppsummerTelling` og `tekstTilTale` (svaret leses høyt), `/api/tell/lagre` uendret, `Resultat` i `mobil/src/app/tell/[hylle].tsx` (viser endringer og retting av tall), `finnVare` (sagt varenavn → SKU) og `/api/stemme/sporsmal` (opptak → tekst).
- Nytt:
  - `POST /api/tell/manuell {hylle, antall: Record<sku,n>}` som gir `Forslag` uten teller (1–2 t).
  - Mobilskjermen «Blindtelling»: viser lokasjon og varenavn, men aldri forventet antall. Et skjult `TextInput` med autofokus fanger Zebra-skanneren som tastatur (DataWedge med tastetrykk ut), og hver EAN teller +1. Telefonkamera som reserve. Knapp eller stemme for antall, og «Ferdig» åpner `Resultat` (4–6 t).
  - Stemme: enten trykk og snakk der tallet tolkes («atten», «femten svarte medium») med Claude eller et regex (2–3 t), eller agentverktøyene `neste_lokasjon` og `registrer_telling` med skriving via `endreState` og en egen blind-prompt (3–5 t inkludert dashbordet).
- Risiko: norske tallord i tale-til-tekst, at assistenten røper forventet antall, oppsett av DataWedge på en lånt Zebra (hvis dere ikke har en, fungerer kamera eller tastatur på telefonen som skanner), og at Expo Go kanskje ikke støtter alt dere trenger.

**B. Telleliste ut fra risiko: ca. 8–12 t (lav risiko)**
- Gjenbruk: `beholdning`, `beholdningPerHylle`, `apneAvvik`, `hylleStatus`, `sisteTelling`, `plukketSiden` og `Innkjop` (`mottatt < bestilt`), fanen «Velg hylle» i mobilen (listen og statusmerkene kan gjenbrukes), og `hentLogg`.
- Nytt: `risikoListe(s, n=10)` med regler og poeng, der hver regel gir en lesbar grunn.
  - Negativ beholdning.
  - Åpent avvik på lokasjonen.
  - Ikke talt på X dager.
  - Mottak siste 48 t, eller PO som er delvis levert.
  - «Fantomlager»: beholdning over 0, men ingen plukk på N dager.
  - Korrigeringer nylig.
  - Mangel ved plukk og retur krever nye data (ny `HendelseType` `retur` og et felt eller en hendelse for mangel på `Ordre`). Det er +1–2 t hvis det tas med.
- Rute `GET /api/telleliste`, verktøyet `hent_telleliste` og en mobilskjerm eller et kort «Tell disse i dag» (2–3 t). Logikk 2–3 t. Avhenger helt av den nye seed-dataen.
- Naturlig startpunkt for A: listen bestemmer hvilken lokasjon assistenten sender deg til. Dette svarer også direkte på Holios «Finn hyllene med avvik».

**C. Detektiv i transaksjonsloggen (finner hvor kjeden brøt): ca. 10–16 t (middels til høy risiko)**
- Gjenbruk: `Hendelse.ref` (kobler til PO og ordre), `tellingId`, `Telling`-historikk, `hentInnkjop` (bestilt, mottatt, plukket siden), `plukketSiden`, `hentLogg`, `lukkAvvik` og `avvik?.forrigeTellingId` (gir tidsvinduet mellom to tellinger).
- Nytt i datamodellen:
  - `HendelseType` + `"retur" | "flytting"` (plassering fra mottakssone til hylle).
  - Eventuelt `Innkjop.varslet?: number` (forventet antall på pakkseddel eller ASN) og `Hendelse.ansatt?`.
- Funksjonen `sporAvvik(s, sku, hylle)`: går gjennom hendelsene mellom de to siste tellingene, regner ut forventet antall etter hvert steg og finner det første steget der en senere telling ikke stemmer. Eksempler: «PO-3001: 5 på pakkseddelen, 5 mottatt, men bare 3 plassert på B3», eller «differansen oppstod mellom telling tirsdag 08:00 og onsdag 08:00, da tre plukk ble registrert av skift 2». Koden skal være fast og forutsigbar, og LLM-en skal bare fortelle (samme prinsipp som «Claude teller bare»).
- Verktøyet `spor_avvik` og en tidslinje-visning: `Kort`-typen `logg` er deklarert, men vises ikke noe sted, så det trengs et kort i mobil og web (3–4 t).
- Risiko: logikken må stemme med den tilpassede seed-historien. Et for «smart» svar kan bli feil foran juryen. Uten feltene for plassering, ASN og ansatt kan C bare si *når* (mellom hvilke tellinger og hendelser), ikke *i hvilket steg*.

**D. Plukk og plassering med stemme og kontrollsiffer: ca. 16–24 t (høy risiko, anbefales ikke som kjerne)**
- Gjenbruk: `Ordre` og `Hylle`, stemmerørene og `forklar` for plukk.
- Nytt:
  - `Hylle.kontrollsiffer`, plukklister med flere linjer, plukker på ordren og status for mangel.
  - En samtale med mange omganger (passer til ElevenLabs-agenten på web, men er tungvint med trykk og snakk på mobil), fire skrivende verktøy og en ny plukkskjerm.
  - Viktig: hvis plukk logges der det skjer, må `forklar` og `lagreForslag` endres, siden de i dag *antar* plukk ut fra åpne ordrer ved telling ([lager.ts:144-149, 201-207](src/lib/lager.ts)). Det er en endring i kjernemodellen.
- Kan nevnes i pitchen som «neste steg».

**E. Butikkmodus (rask sjekk av én SKU eller størrelse): ca. 3–6 t ekstra oppå A**
- Gjenbruk: `lagForslag` for én SKU (fungerer allerede), `finnVare` (størrelser vektes), `hent_beholdning` (svarer allerede på «hvor mange svarte M på B3» med stemmen) og `/api/tell/manuell` fra A.
- Nytt: en «Rask sjekk»-skjerm der dere skanner EAN, teller blindt, lagrer og hører resultatet. Valgfritt: `Vare.modell` for å gruppere størrelser og vise matrise (+2 t).
- Lav risiko. Gir en butikkhistorie i pitchen med samme kode.

**F. Avvik per ansatt, skift, lokasjon eller leverandør: ca. 6–10 t (data og etikk er risikoen)**
- Gjenbruk: `Hendelse.hylle`, `tid` (skift kan avledes av klokkeslett), `Vare.leverandor` og `Innkjop.leverandor`, og `apneAvvik`.
- Nytt: `Hendelse.ansatt?` (valg i appen, uten innlogging), `hent_svinnmonster` med gruppering og en enkel statistisk regel (for eksempel andel svinn per gruppe mot snittet), og seed-data med et tydelig mønster (for eksempel «Leverandør X: 3 av 4 mottak manglet varer», «Lokasjon C1 nær utgangen: 60 % av svinnet»).
- Risiko: med så lite seed-data blir «anomali» egentlig konstruert. Personvern ved tall per ansatt (advokat og etisk hacker i juryen, se spørsmål 2). Anbefales for lokasjon, leverandør og skift.

**G. Kamera som valgfri hjelper: ca. 2–4 t**
- Gjenbruk: alt (`velgTeller`, `/api/tell`, kameraet i `tell/[hylle].tsx`, `Forslag` med `sikkerhet` og `alternativ`).
- Nytt: knappen «Foreslå tall med kamera» i blindtellingen (A), eller «be om omtelling med bilde» når blindtellingen og loggen er uenige. Kan også brukes til F8 (følgeseddel ved mottak) koblet til C.

**Ekstra ideer koden peker på**
- **H. Omtelling før mulig svinn:** Hvis blindtellingen avviker med minst `svinnTerskel`, ber assistenten om en ny telling (eventuelt av en annen person) før `mulig_svinn` lagres. Gjenbruker `svinnTerskel` og `sporNaarUsikker` ([types.ts:96-97](src/lib/types.ts)). Ca. 2–3 t. Gir færre falske avvik, noe lagerledere bryr seg om.
- **I. Følge opp avvik med stemmen:** `lukk_avvik` som verktøy («den pennen ble funnet»). Logikken finnes i `lukkAvvik` og `POST /api/avvik/[id]`. Ca. 1–2 t, men trenger skrivende verktøy.
- **J. `oversikt` som verktøy:** Funksjonen finnes, men er ikke registrert. Ca. 0,5 t.
- **K. Kontroll ved mottak med skanning:** Skann innkommende varer mot PO og varslet antall, så avvik fanges i mottaket i stedet for på hylla. Overlapper Holio-utfordring 2 (planens F8). Gjenbruker `forklar` for mottak og `Innkjop`. Ca. 4–6 t. Gir C data om «hvilket steg».
- **Rett avvik fra planen:** +N uten PO bør bli «ukjent mottak, bekreft», ikke `korrigering` ([lager.ts:142](src/lib/lager.ts) mot planen s. 4). Ca. 1 t.

**Mulig kombinasjon innen fristen (anslag):** felles grunnlag (6) + B (10) + A (12) + C i light-versjon, bare «når» og tidslinje (8) + G (3) ≈ 39 persontimer. Det er i øvre kant av det som er realistisk. Første kutt er C-light, eller A med bare trykk og snakk i stedet for agentverktøy.

### Gaps
- Jeg har ikke sjekket i koden om `expo-camera` i dette Expo-oppsettet (SDK 58, Expo Go) støtter strekkodeskanning. Det står ikke i bruk noe sted i repoet.
- Jeg har ikke sjekket hvordan en Zebra-enhet (DataWedge, tastaturmodus) oppfører seg mot et React Native-`TextInput`. Det må testes på enheten.
- Timeanslagene er mine egne vurderinger, uten målinger av lagets tempo. Klokkeslettet i dag og hvor mange timer som er igjen er ikke kjent.
- Det finnes ingen Holio-testdata i repoet. Om Holio har ekte eksempler på lagerlogger med retur og plukkmangel er ikke kjent.
