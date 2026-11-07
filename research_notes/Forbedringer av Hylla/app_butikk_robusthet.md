# Hylla før kodefrys: app, butikk, Holio Ops, demo og sikkerhet

Kilder: repoet `C:/Users/muhay/Oslo-Sprint-Hylla` (branch `Mayo`, commit 799a841), lest lørdag 7. november 2026. Ingen filer er endret. Linjenumre gjelder filene slik de var da. Notatet bygger på `research_notes/Svinn uten kameratelling/kodebase_og_gjenbruk.md` og gjentar ikke det som står der (datamodell, verktøy, ideer A–K).

Slik er notatet bygd opp: **Cited Findings** er observasjoner med fil:linje eller nettkilde. **Inferences** er mine vurderinger og timeanslag i persontimer. Anslagene forutsetter en person som kjenner koden. Ingenting er målt.

---

## 1. Brukerflyten skjerm for skjerm: hva er tregt, uklart eller skjørt?

### Takeaway
Hovedflyten er kort: Hjem → Tell → velg hylle → kamera → «Analyserer» → resultat → Lagre → Logg. De største svakhetene er:
- Analyseskjermen har ingen avbryt-knapp, og ingen kall har tidsavbrudd. Henger telleren, sitter brukeren fast foran juryen.
- Mobilappen leser ikke opp oppsummeringen etter lagring, selv om backend og webappen støtter det.
- Ved usikre tall kan brukeren bare velge mellom to tall. Det finnes ingen +/- for å skrive inn riktig tall.

### Cited Findings
**Flyten**
- Oppstart: rotlayouten spør `/api/oversikt` om tilgang. Svarer ikke serveren innen 8 s, regnes appen som åpen — [mobil/src/lib/tilgang.ts:8-20](mobil/src/lib/tilgang.ts), [mobil/src/app/_layout.tsx:23-26](mobil/src/app/_layout.tsx)
- Hjem: viser «N ting trenger deg i dag» og tre tall: varer på lager, hyller talt og mulig svinn. «Mulig svinn» åpner bare det første avviket — [mobil/src/app/(faner)/index.tsx](mobil/src/app/(faner)/index.tsx) (Tall-raden)
- Velg hylle: et søkefelt med `autoCapitalize="characters"` og `onSubmitEditing`. Gir søket nøyaktig én treff, åpnes hylla rett — [mobil/src/app/(faner)/tell.tsx:52-55](mobil/src/app/(faner)/tell.tsx). Hyller med avvik står først, og et gult varsel sier «Tell dem først».
- Kamera: lukk-knapp, lykt, et miniatyrbilde av forrige telling og utløser. Lenken «Ingen hylle foran deg? Bruk demotelling» vises alltid — [mobil/src/app/tell/[hylle].tsx:70-151](mobil/src/app/tell/[hylle].tsx) (lenken på 144-146)
- Analyserer: bildet skaleres til 1600 px (JPEG 0,75) og 640 px, så kalles `/api/tell` — [tell/[hylle].tsx:38-42](mobil/src/app/tell/[hylle].tsx). Fremdriften er kunstig: steg 1 blir ferdig når bildet er skalert, steg 2 når svaret kommer, og deretter ventes det 600 ms til — [tell/[hylle].tsx:41-44](mobil/src/app/tell/[hylle].tsx). Teksten sier «Tar vanligvis 3–8 sekunder» — [tell/[hylle].tsx:191](mobil/src/app/tell/[hylle].tsx).
  - Skjermen har ingen avbryt-knapp — [tell/[hylle].tsx:155-194](mobil/src/app/tell/[hylle].tsx)
  - Tilbake-sveip er slått av for `tell/[hylle]` — [_layout.tsx:272](mobil/src/app/_layout.tsx)
- Ingen nettverkskall i mobilen har tidsavbrudd. `kall()` bruker `fetch` uten `AbortSignal` — [mobil/src/lib/api.ts:52-64](mobil/src/lib/api.ts). På serveren har Claude-telleren heller ikke tidsavbrudd — [src/lib/teller.ts:108-119](src/lib/teller.ts). Ruten har `maxDuration = 60` — [src/app/api/tell/route.ts:7](src/app/api/tell/route.ts).
- Feilskjerm: knappene «Ta nytt bilde» og «Bruk demotelling» — [tell/[hylle].tsx:58-64](mobil/src/app/tell/[hylle].tsx)
- Resultat: kort med forrige → nå og fortegn, og en grunn for hver endring. Usikre varer (sikkerhet under 0,8 og et alternativ finnes) får bare valget «a eller b» eller «Ta nytt bilde» — [tell/[hylle].tsx:277-298](mobil/src/app/tell/[hylle].tsx)
- Mobilen regner om forhåndsvisningen selv i `justert`: differansen legges på siste svinn- eller korrigeringslinje — [tell/[hylle].tsx:199-207](mobil/src/app/tell/[hylle].tsx). Serveren kjører `forklar` på nytt mot dagens beholdning — [src/lib/lager.ts:181-184](src/lib/lager.ts). Mobilen bruker ikke `svinnTerskel`, så det brukeren ser kan avvike fra det som lagres.
- Lagre: mobilen sender `{ forslag, korrigert, bilde, kilde }` uten `medLyd` og går til Logg — [tell/[hylle].tsx:223-226](mobil/src/app/tell/[hylle].tsx). Webappen sender `medLyd: svarHoyt` — [src/app/tell/[hylle]/TellFlyt.tsx:275](src/app/tell/[hylle]/TellFlyt.tsx). Backend lager `oppsummering` og eventuelt lyd — [src/app/api/tell/lagre/route.ts:21-33](src/app/api/tell/lagre/route.ts). Mobilen leser ikke opp noe av dette.
- Logg: et grønt banner «Tellingen av X er lagret i loggen» i 6 s — [mobil/src/app/(faner)/logg.tsx:20-40](mobil/src/app/(faner)/logg.tsx)
- Spør Hylla: hold inne for å snakke, deretter `/api/stemme/sporsmal` (ElevenLabs STT, Claude, TTS). Svaret spilles av, eller telefonen leser det opp selv — [mobil/src/app/(faner)/spor.tsx:77-125](mobil/src/app/(faner)/spor.tsx). Skrevne spørsmål (`sporTekst`) går til `/api/spor` og leses ikke opp automatisk — [spor.tsx:62-75](mobil/src/app/(faner)/spor.tsx)
- Innstillinger: «Nullstill demoen» (med bekreftelse) og «Tøm lageret» — [mobil/src/app/innstillinger.tsx:42-66, 135](mobil/src/app/innstillinger.tsx)

**Ytelse**
- Hver forespørsel henter hele `State` (én JSON-rad). Bildene ligger som base64 inne i raden. Opptil to tellinger per hylle beholder bildet, og avviksbilder slettes aldri — [src/lib/store.ts:31-44](src/lib/store.ts), [src/lib/lager.ts:246-257](src/lib/lager.ts)

### Inferences
- **Fastlåst analyse er den største demorisikoen.** Med Opus, 1600 px bilde og `effort: "medium"` kan svaret ta lengre tid enn «3–8 s». Kommer det ikke svar før `maxDuration`, får mobilen en feil, men i opptil 60 s er det ingen vei ut. Tiltak: tidsavbrudd i `kall()` (for eksempel 30 s for `/api/tell`), «Avbryt» på Analyserer, og at feilskjermen tilbyr demotelling. Ca. 0,5–1 t.
- **Opplesning etter lagring** passer rett inn i stemmehistorien («+2 kaffekopper, restlevering PO-3001 …»). Send `medLyd: true` og spill `lyd`, eller bruk `Speech.speak(oppsummering)` med `lesHoyt`-logikken fra spor.tsx. Ca. 0,5–1 t.
- **+/- ved siden av hvert tall** i Resultat, i stedet for bare «a eller b». Det gjør retting mulig når begge forslagene er feil, og passer prinsippet «spør brukeren om det rette tallet». Ca. 1–1,5 t.
- **Lik forhåndsvisning og lagring:** la mobilen kalle en liten `POST /api/tell/forhandsvis {forslag, korrigert}`, eller flytt `justert` til delt logikk som bruker `forklar`. Ca. 1 t. Alternativ på 0,25 t: vis «Endelig fordeling regnes ut ved lagring» når brukeren har rettet et tall.
- Den kunstige fremdriften er ok i en demo, men vis heller hvilken teller som brukes («Claude teller …» eller «SAM 3 teller …») og ekte sekunder. Det gir ærlighet foran juryen. Ca. 0,25 t.
- «Mulig svinn» på Hjem bør gå til en liste over alle åpne avvik, ikke bare det første. Ca. 0,5 t (Logg-fanen kan filtreres på type).

### Gaps
- Appen er ikke kjørt, og ingen tider er målt på telefon. Hvor lang tid Claude eller SAM 3 faktisk bruker på et bilde er ukjent.
- Jeg har ikke lest `vare/[sku]`, `avvik/[id]` og `ny-vare` linje for linje.

---

## 2. Passer appen i butikk og på lager (SKU-bilde, telling etter stengetid, strekkode, Zebra, dårlig nett, hansker)?

### Takeaway
Det enkleste er Zebra-skanning som tastatur (DataWedge Keystroke + ENTER) inn i søkefeltet som finnes. Da åpner en skannet hylleetikett tellingen direkte, uten ny kode for strekkoder. EAN mangler i datamodellen, så skanning av en *vare* krever et nytt felt. `expo-camera` kan lese EAN-13 i SDK 58 som reserve på vanlige telefoner. Appen har ingen offline-støtte. Knappene er 56 px høye, men flere viktige trykkflater er små.

### Cited Findings
- Expo `CameraView` leser strekkoder med `barcodeScannerSettings={{ barcodeTypes: [...] }}` og `onBarcodeScanned`. Typene omfatter `ean13`, `ean8`, `code128`, `qr`, `upc_a` og `datamatrix`. Biblioteket er med i Expo Go. Alternativt kan `launchScanner()` brukes, som på Android åpner Googles skanner og lukkes etter én skanning — [Expo Camera-dokumentasjon](https://docs.expo.dev/versions/latest/sdk/camera/)
- Repoet bruker `expo-camera ~58.0.0` — [mobil/package.json:13](mobil/package.json). Det finnes ingen strekkodekode (søk på «barcode» gir ingen treff i `mobil/src` eller `src`).
- DataWedge Keystroke Output sender skannet data «as a series of keystrokes» til feltet som har fokus. ENTER eller TAB kan legges til etter hver skanning for å gå videre. Intent Output er et alternativ — [Zebra DataWedge Keystroke Output](https://techdocs.zebra.com/datawedge/latest/guide/output/keystroke/)
- Søkefeltet i Velg hylle søker på hylle-ID, hyllenavn, varenavn og SKU, og åpner hylla ved ENTER når det er nøyaktig ett treff — [mobil/src/app/(faner)/tell.tsx:15-20, 52-55](mobil/src/app/(faner)/tell.tsx)
- En telling av én vare fungerer allerede i motoren (`if (!r) continue`) — [src/lib/lager.ts:91-92](src/lib/lager.ts)
- Holio OPS «krever Android 9 eller nyere» og lastes ned fra Google Play. Eksisterende terminaler kan gjenbrukes — [holio.ai/software/wms](https://holio.ai/software/wms/). Holios hjelpesider har artikkelen «Barcode Scanner User Guide (Zebra)» — [help.holio.ai/knowledge-base/terminal-device](https://help.holio.ai/knowledge-base/terminal-device)
- Appen er låst til stående format og lyst tema. Android-pakken er `no.oslosprint.hylla` — [mobil/app.json:6-20](mobil/app.json)
- Knappene (`Knapp`) er 56 px høye, eller 64 px med undertekst — [mobil/src/components/ui.tsx:197](mobil/src/components/ui.tsx). Tilbake-knappen er 32×32 px med `hitSlop` 12 — [ui.tsx:41, 189](mobil/src/components/ui.tsx). «Bruk demotelling» og «Forkast» er lenketekst på 13–14 px — [tell/[hylle].tsx:144-146, 307](mobil/src/app/tell/[hylle].tsx). Valgknappene for usikre tall er 44 px høye — [tell/[hylle].tsx:330](mobil/src/app/tell/[hylle].tsx)
- Ved nettverksfeil beholder `useHent` data den allerede har, men ingenting lagres lokalt og ingen telling settes i kø — [mobil/src/lib/useHent.ts:22-28](mobil/src/lib/useHent.ts), [mobil/src/lib/api.ts:52-64](mobil/src/lib/api.ts)
- Kameratelefonen (`kamera/[hylle]`) holder skjermen våken og sender et bilde i sekundet til `/api/kamera/ramme` — [mobil/src/app/kamera/[hylle].tsx:33-37, 78](mobil/src/app/kamera/[hylle].tsx). Det er den som passer «telling etter stengetid».

### Inferences
- **Zebra uten ny kode (0,5 t inkludert test):** Lag hylleetiketter med Code128 eller QR som inneholder hylle-ID («T1»). Sett opp en DataWedge-profil for Hylla med Keystroke og ENTER. Skann i Velg hylle, og kameraet åpner. Sett `autoFocus` på søkefeltet (5 min) så brukeren slipper å trykke først. Fungerer det samme på en Zebra med Holio OPS, er det et godt demoøyeblikk: «samme skanner, samme etikett».
- **Skann vare, så ta bilde (1,5–2,5 t):** Legg til `Vare.ean?` og EAN i seed. Søket må også matche `ean` (0,5 t). Gi `Kamera` en «Skann vare»-modus med `barcodeTypes: ["ean13","ean8","code128"]`, og send bare den SKU-en til `/api/tell` (filtrer `hylle.innhold` i telleren eller i `lagForslag`). Mindre bilde og én vare gir raskere og sikrere telling. Dette er «per-SKU quick photo».
- **Telling etter stengetid:** Hold det til pitchen («kameratelefonen teller når butikken er stengt, ingen folk i bildet»). En egen planlagt modus er for mye for helgen.
- **Hansker og store knapper (1–1,5 t):** Gjør «Forkast» og «Bruk demotelling» om til `Knapp variant="hvit"`. Øk valgknappene til 56 px, og gi tilbake-knappen 48×48. Med +/- (spørsmål 1) blir det store trykkflater.
- **Dårlig nett (1–2 t for en enkel løsning):** Vis tydelig «Ingen kontakt, prøv igjen» med tidsavbrudd (se spørsmål 1). En ekte kø for tellinger uten nett krever lokal lagring og håndtering av konflikter. Det er for stort nå, så nevn det som neste steg.
- Expo Go på Zebra: Android 9+ og Google Play-tjenester trengs for Expo Go. Mange Zebra-enheter har GMS, men ikke alle. En utviklingsbygg-APK er tryggere.

### Gaps
- Jeg har ikke testet DataWedge mot et React Native-`TextInput` på en Zebra. Noen oppsett krever litt forsinkelse mellom tegnene (dokumentasjonen nevner 100 ms-steg hvis tegn faller bort).
- Det er ukjent om laget har en Zebra-enhet, og hvilken modell.
- Jeg har ikke sjekket om `onBarcodeScanned` er stabil og rask nok på svake Android-telefoner.

---

## 3. Passer Hylla som modul i Holio Ops (deep link, EAN og lokasjoner, API og webhooks, CSV)?

### Takeaway
Holio sier at «alt Holio gjør er tilgjengelig gjennom API-et», men jeg fant ingen offentlig API-dokumentasjon, webhooks eller CSV-eksport på nettsidene. Pitchen bør derfor si «Hylla kobles på via API-et deres», ikke påstå at bestemte endepunkter finnes. Små tiltak som viser integrasjonen i demoen: et deep link-skjema (`hylla://tell/T1`), CSV-eksport av avvik, og å bruke Holios begreper (lokasjon, EAN, PO, ordre).

### Cited Findings
- Holio WMS samler «innkjøp, lagerbeholdning, ordre og retur på ett sted, med Holio OPS på håndterminal i reolgangen» — [holio.ai](https://holio.ai)
- Holio WMS har modulene Purchase Orders, Sales Orders, Products, Locations and Stock, Returns og Transport. OPS brukes til «picking, receiving, product editing, and order handling» på Android-terminaler — [holio.ai/software/wms](https://holio.ai/software/wms/) (sammendrag av siden)
- «Alt Holio gjør er tilgjengelig gjennom API-et». Ferdige integrasjoner: Shopify, WooCommerce, Business NXT og fraktselskaper. Andre integrasjoner lages på forespørsel. Webhooks og CSV nevnes ikke — [holio.ai/software/integrasjoner](https://holio.ai/software/integrasjoner/)
- Holios hjelpesenter har kategoriene Holio OMS, Shipping, Terminal device, Skyprint og Ordermatch. Ingen av dem handler om API eller utviklere — [help.holio.ai/knowledge-base](https://help.holio.ai/knowledge-base)
- Webhooks: ingen funnet. Jeg fant heller ingen offentlig API-referanse (søk ga bare treff på andre systemer, for eksempel «Holisol WMS») — [søk](https://support.easyecom.io/portal/en/kb/articles/integrating-holisol-wms-with-easyecom)
- Hylla har allerede skjemaet `"scheme": "hylla"` — [mobil/app.json:8](mobil/app.json). Expo Router gjør ruter om til lenker, så `hylla://tell/T1` peker på `tell/[hylle]` (ruten finnes — [mobil/src/app/tell/[hylle].tsx](mobil/src/app/tell/[hylle].tsx)).
- Datamodellen har `Hendelse.ref` med PO- eller ordrenummer, `Innkjop` og `Ordre`. Den har ikke EAN og ikke Holio-ID-er — [src/lib/types.ts:4-81](src/lib/types.ts). `GET /api/logg?type=&sku=` finnes — [src/app/api/logg/route.ts](src/app/api/logg/route.ts)
- Planen skriver «tillegg i Holio Ops» og «Dette passer rett inn i Holio Ops» — prosjektplan s. 11 og 13 (via kodebase_og_gjenbruk.md)

### Inferences
- **Deep link (0,5 t):** Test `hylla://tell/T1` med `adb shell am start -a android.intent.action.VIEW -d "hylla://tell/T1"` og vis det i pitchen: «Holio OPS åpner Hylla på riktig lokasjon». Merk at deep link krever et utviklings- eller release-bygg. I Expo Go er skjemaet `exp://…`. PIN-kravet gjelder fortsatt.
- **CSV-eksport av avvik (1 t):** `GET /api/avvik.csv` med kolonnene `lokasjon;sku;ean;endring;type;aarsak;ref;tid;status`, og en knapp i Logg eller Innstillinger (`Linking.openURL` eller del-funksjonen). Dette er «filen dere kan importere i Holio i dag». Krever PIN, så bruk cookie eller header. Det enkleste er å vise det i webappen.
- **Webhook ut (1–1,5 t, valgfritt):** Ved `mulig_svinn` sendes `POST` til `HYLLA_UTGAENDE_WEBHOOK` med HMAC-signatur. Det viser mønsteret «Hylla melder avvik tilbake til WMS», og det kan pekes mot webhook.site i demoen. Jeg anbefaler å bare vise det på en arkitekturslide, ikke kode det.
- **Begreper (0,5 t):** Bruk Holios ord i UI og pitch: «lokasjon» ved siden av «hylle», og «EAN». Si «PO» og «ordre» (finnes allerede). Ved import fra Holio kan `Hylle.id` være lokasjonskoden derfra.
- **Ikke påstå at API-et har bestemte endepunkter.** Formuler det som et spørsmål til Martin (Head of Holio) i Q&A: «Hvilke endepunkter for lokasjon og lagerbeholdning finnes i API-et deres?»

### Gaps
- Holios API-dokumentasjon er ikke offentlig, eller jeg fant den ikke. Det er ukjent om det finnes webhooks, telle-endepunkter og formater for lokasjonskoder.
- Det er ukjent om Holio OPS kan åpne andre apper via intent eller deep link, eller om OPS støtter innebygde moduler.
- Artikkelen om Zebra-skanneren på help.holio.ai er ikke lest i sin helhet.

---

## 4. Demo-robusthet: reserveløsninger, bufrede bilder, nullstilling, tid per steg, nett og opptak

### Takeaway
Det finnes allerede én god reserve: demotelleren med faste tall og «Bruk demotelling» på kamera- og feilskjermen, pluss «Nullstill demoen». Men:
- SAM 3 og YOLO faller ikke tilbake til Claude eller demo. Det gjør bare SAM 3.1.
- Claude har ikke tidsavbrudd.
- Demotelleren gir faste *absolutte* tall, så etter én lagring gir den «ingen endringer» til demoen nullstilles.
- Demotallene finnes bare for T1.

### Cited Findings
- `velgTeller`: uten `HYLLA_TELLER` velges SAM 3.1 hvis `META_API_KEY` finnes, så SAM 3, så Claude, så YOLO, ellers demo — [src/lib/teller.ts:18-28](src/lib/teller.ts). `/api/tell` bruker demo hvis `demo` er satt eller det ikke finnes noe bilde — [src/app/api/tell/route.ts:17](src/app/api/tell/route.ts)
- Bare SAM 3.1 faller tilbake til Claude — [teller.ts:249-255](src/lib/teller.ts). SAM 3 og YOLO (`eksternTeller`) kaster feil etter opptil 55 s — [teller.ts:146-161](src/lib/teller.ts). Claude bruker `fallbacks: "default"` (reserve på serversiden mot API-et), men har ikke tidsavbrudd — [teller.ts:108-113](src/lib/teller.ts)
- Demotelleren venter 2,5 s og gir BRUS-RED 3, PENN-SVART 2 (sikkerhet 0,74, alternativ 3) og KAFFE-KOPP 5 — [teller.ts:263-275](src/lib/teller.ts). For andre hyller enn T1 kaster den feilen «Ingen ekte teller er satt opp» — [teller.ts:277-280](src/lib/teller.ts)
- Seed etter nullstilling: brus 4, penn 3, kaffekopp 3, ordre 20501 (1 brus), PO-3001 (5 bestilt, 3 mottatt) og `svinnTerskel: 1` — [src/lib/seed.ts:57, 84-91, 98](src/lib/seed.ts). Demotellingen gir altså: brus −1 (plukk 20501), penn −1 (mulig svinn, usikker 2/3) og kaffekopp +2 (mottak PO-3001).
- Nullstilling: `POST /api/demo/nullstill`. Den er sperret i Vercel-produksjon hvis `HYLLA_PIN` mangler — [src/app/api/demo/nullstill/route.ts:12-22](src/app/api/demo/nullstill/route.ts). I appen ligger den som lenketekst nederst i Innstillinger — [mobil/src/app/innstillinger.tsx:135](mobil/src/app/innstillinger.tsx)
- Seed-tidspunktene regnes ut fra *nå* ved nullstilling, med fast UTC+1 — [seed.ts:8-15](src/lib/seed.ts). Tellingen «i dag 08:00» viser BANAN 3, men plukket av 2 bananer står 08:30, *etter* tellingen — [seed.ts:56, 82](src/lib/seed.ts). Nullstilles demoen før 08:45 en morgen, ligger ordre 20501 og plukket i fremtiden.
- Uten Supabase ligger tilstanden i minnet per serverinstans — [src/lib/store.ts:31-35](src/lib/store.ts). Køen i `endreState` gjelder også bare per instans — [store.ts:59-68](src/lib/store.ts)
- Mobilen finner backend via `EXPO_PUBLIC_API_URL`, ellers samme maskin som Metro på port 3000 over http — [mobil/src/lib/api.ts:8-13](mobil/src/lib/api.ts). Release-bygg krever https — [api.ts:20-26](mobil/src/lib/api.ts)
- Rate-grensen på `/api/tell` er 15 per minutt per IP. Alle på samme Wi-Fi bak én NAT deler IP — [src/lib/ratebegrensning.ts:10-18](src/lib/ratebegrensning.ts), [src/middleware.ts:27-29, 54-58](src/middleware.ts)

### Inferences
**Tiltak i kode (sortert etter nytte delt på tid)**
1. **Reserve i `/api/tell` (0,5–1 t):** Pakk `teller.tell` i et tidsavbrudd (for eksempel 20 s, satt med `HYLLA_TELLE_TIMEOUT`). Ved feil eller tidsavbrudd: prøv Claude hvis nøkkelen finnes, deretter demotelleren for T1. Legg `teller: "demo (reserve)"` i forslaget så det er ærlig. Mobilen viser allerede `forslag.teller` — [tell/[hylle].tsx:302](mobil/src/app/tell/[hylle].tsx).
2. **Tidsavbrudd og avbryt i mobilen (0,5–1 t):** se spørsmål 1.
3. **Demoen tåler gjentakelse (0,5 t):** La demotelleren regne *relativt* til beholdningen (brus −1, penn −1, kaffekopp +2), eller vis «Nullstill demo» som en stor knapp på feilskjermen eller i Innstillinger. Ellers gir øvelse nr. 2 «Ingen endringer» hvis noen glemmer å nullstille.
4. **Fiks seed-tidene (0,25 t):** Flytt tellingen til 07:30 og plukket av bananer til 07:45 (eller sett BANAN 5 i tellingen). Bruk `Europe/Oslo` i stedet for fast +1 hvis demoen kan kjøres etter sommertid. Nullstill kort tid før pitchen, uansett.
5. **Bufrede demobilder (0,5–1 t):** Legg 2–3 ekte bilder av bordet (før og etter) i `mobil/assets/demo/` og en skjult «Bruk lagret bilde»-knapp som sender bildet til *ekte* telling. Da er Claude eller SAM 3 med selv om kameraet eller lyset svikter. Krever at bildene er tatt på demobordet med de samme varene.
6. **Rate-grensen:** Sett `/api/tell` til 30 per minutt i demoen, eller vær klar over at hele laget deler IP på venuet. 5 min.

**Sjekkliste før minipitch (14:15)**
- [ ] Bestem *én* teller for demoen og sett `HYLLA_TELLER` eksplisitt i Vercel. Ikke la valget bero på hvilke nøkler som finnes.
- [ ] Supabase er satt opp, så tilstanden overlever kald start og flere instanser på Vercel. Uten Supabase kan to instanser vise ulik tilstand.
- [ ] `HYLLA_PIN` og `HYLLA_WEBHOOK_SECRET` er satt i Vercel. PIN er lagt inn på demotelefonen og reservetelefonen.
- [ ] Demotelefonen bruker et release- eller utviklingsbygg med `EXPO_PUBLIC_API_URL=https://…vercel.app`, ikke Expo Go mot en laptop på lokalt nett. Venue-Wi-Fi blokkerer ofte trafikk mellom klienter.
- [ ] Mobildeling via 4G/5G fra en annen telefon er klar som reserve for Wi-Fi.
- [ ] Nullstill demoen rett før pitchen. Sjekk Hjem: «1 ting trenger deg» (ikke talt), 0 mulig svinn.
- [ ] Bordet T1 er rigget som før-bildet: 4 brus, 3 penner, 3 kaffekopper (pluss resten). To kaffekopper er klare til å legges på, og én brus og én penn til å ta bort.
- [ ] Øv hele løpet 3 ganger med stoppeklokke. Mål tid for kamera → resultat med den valgte telleren. Er det over ca. 10 s, bruk lagret bilde eller demotelling.
- [ ] Stemme: test «Hvor mange kaffekopper har vi?» i rommet. Har ElevenLabs høy forsinkelse, skriv spørsmålet (forslagsknappene i spor.tsx:166).
- [ ] Ta opp skjermen på forhånd (90 s) av hele flyten med ekte teller og lyd, som reserve hvis nett eller API svikter. Ha opptaket lokalt på pitch-laptopen.
- [ ] Ha et skjermbilde av Supabase-raden og loggen klart (planen nevner «Vis tabellen i Supabase»).
- [ ] Utgiftstak er satt hos Anthropic, ElevenLabs og Meta (README:37).
- [ ] Lyd: telefonen er ikke på lydløs, eller `playsInSilentMode` er satt. Test høyttaleren mot salen.

**Tid per steg (anslag, ikke målt):** åpne app og velge hylle ca. 5 s. Ta bilde ca. 3 s. Skalering ca. 1 s. Telling: demo 2,5 s + 0,6 s, Claude eller SAM 3 ukjent (mål det). Resultat og lagring ca. 5 s. Stemmesvar: STT, Claude med verktøy (opptil 8 runder, se kodebase_og_gjenbruk.md) og TTS, ukjent.

### Gaps
- Jeg har ikke målt hvor lang tid noen av tellerne bruker. Hvordan nettet på venuet (BI Startup Village) er, vet jeg ikke.
- Jeg vet ikke om demoen skal kjøres mot Vercel eller en laptop. Sjekklisten antar Vercel.

---

## 5. Sikkerhet og personvern: raske tiltak (advokat og etisk hacker i juryen)

### Takeaway
Grunnmuren er god: PIN med sammenligning i konstant tid, rate-grense, CORS, https i release-bygg, PIN i SecureStore og sperret nullstilling. Men det finnes konkrete hull:
- Webhook-verktøyene er helt åpne når `HYLLA_WEBHOOK_SECRET` mangler, fordi `/api/verktoy` er unntatt fra PIN.
- `/api/tell/lagre` stoler på tallene klienten sender.
- Bilder lagres uten sletting eller sladding, og avviksbilder lagres for alltid.
- Kameratelefonen er i praksis kameraovervåking i virksomhet, med egne regler.

### Cited Findings
**API og tilgang**
- `/api/verktoy` er unntatt fra PIN — [src/middleware.ts:11](src/middleware.ts). Ruten sjekker bare hemmeligheten *hvis* `HYLLA_WEBHOOK_SECRET` er satt, og sammenligner med vanlig `!==` (ikke i konstant tid) — [src/app/api/verktoy/[navn]/route.ts:10-13](src/app/api/verktoy/[navn]/route.ts). Verktøyene gir beholdning, logg, innkjøp og avvik — [src/lib/verktoy.ts:108-149](src/lib/verktoy.ts)
- PIN og webhook-hemmelighet bruker samme header, `x-hylla-secret` — [src/lib/tilgang.ts:10](src/lib/tilgang.ts), [verktoy/[navn]/route.ts:11](src/app/api/verktoy/[navn]/route.ts)
- `/api/tell/lagre` tar imot hele `forslag` og `korrigert` fra klienten og skriver `antall` per SKU rett inn. SKU-en sjekkes ikke mot hylla, og tallet sjekkes ikke — [src/app/api/tell/lagre/route.ts:14-24](src/app/api/tell/lagre/route.ts), [src/lib/lager.ts:169, 181-184](src/lib/lager.ts)
- Kameraets ruter (`/api/kamera/ramme`, `/bilde`, `/ping`) har ingen egen hemmelighet utover PIN, og `kameraId` er fritt valgt — [src/app/api/kamera/ping/route.ts:7-22](src/app/api/kamera/ping/route.ts)
- Rate-grensen gjelder bare ikke-GET-kall (unntatt `/api/stemme`), og den gjelder per serverinstans — [src/middleware.ts:54-58](src/middleware.ts), [src/lib/ratebegrensning.ts:1-3](src/lib/ratebegrensning.ts). `/api/varer` (POST med opptil 3 bilder) og `/api/hyller` har ingen grense — [ratebegrensning.ts:10-18](src/lib/ratebegrensning.ts)
- Feil PIN gir 800 ms forsinkelse, og grensen er 10 forsøk per minutt per IP — [src/app/api/tilgang/route.ts:11](src/app/api/tilgang/route.ts), [ratebegrensning.ts:17](src/lib/ratebegrensning.ts). PIN må være minst 6 tegn — [README.md:35](README.md)
- Mobilen lagrer PIN i Keychain eller Keystore (SecureStore), og release-bygg krever https — [mobil/src/lib/pin.ts](mobil/src/lib/pin.ts), [mobil/src/lib/api.ts:20-26](mobil/src/lib/api.ts)
- I utvikling godtar CORS hele `192.168.*` og `10.*` — [src/middleware.ts:20](src/middleware.ts) (bare når `NODE_ENV !== "production"`)
- SAM 3 og YOLO sender `Bearer`-token hvis `SAM3_TOKEN` eller `YOLO_TOKEN` er satt — [src/lib/teller.ts:152-153](src/lib/teller.ts) (tjenestene har egen `sikkerhet.py`)

**Bilder og personvern**
- Tellebildet (640 px) lagres i `Telling.bilde`. Bildene fra de to siste tellingene per hylle beholdes, og bilder et avvik viser til beholdes **uten tidsgrense** — [src/lib/lager.ts:246-257](src/lib/lager.ts). Kameraet lagrer også `sisteBilde` — [src/lib/kameratelling.ts:20](src/lib/kameratelling.ts). Bildene sendes til appen i hylle- og avviksvisningen — [src/lib/visning.ts:39, 46-51](src/lib/visning.ts)
- Bilder sladdes eller beskjæres ikke før de sendes til Claude, Meta (SAM 3.1) eller lagres — [src/lib/teller.ts:102, 216](src/lib/teller.ts), [mobil/src/app/tell/[hylle].tsx:38](mobil/src/app/tell/[hylle].tsx)
- Kameratelefonen lagrer endringer **uten** at noen bekrefter. Det bryter med README-prinsippet «Ingenting lagres før brukeren trykker Lagre» — [src/lib/kameratelling.ts:22-23](src/lib/kameratelling.ts), [README.md:76](README.md)
- `Hendelse` og `Telling` har ikke felt for ansatt. `Telling.teller` er navnet på telleren («claude», «demo»), ikke en person — [src/lib/types.ts:39-62](src/lib/types.ts)
- Datatilsynet: kameraovervåking krever rettslig grunnlag, som regel interesseavveining, og et skriftlig formål. Opptak kan ikke brukes i strid med formålet. Arbeidsgiver kan «ikke kunne bruke kameraovervåking til å følge med på arbeidstakernes arbeidsinnsats», og lydopptak er «normalt ikke tillatt» — [Datatilsynet: Kameraovervåking](https://www.datatilsynet.no/personvern-pa-ulike-omrader/overvaking-og-sporing/kameraovervaking/)
- På arbeidsplassen gjelder GDPR, reglene om kontrolltiltak i arbeidsmiljøloven og «forskriften for kameraovervåking i virksomhet» — [Datatilsynet: Kamera på arbeidsplassen](https://www.datatilsynet.no/personvern-pa-ulike-omrader/overvaking-og-sporing/kameraovervaking/kameraovervaking-arbedsliv/)
- Flere virksomheter oppgir sletting av opptak etter 7 dager som praksis — [Stavanger kommune](https://www.Stavanger.kommune.no/siteassets/bolig-og-bygg/eiendom/kameraovervakning-eiendommer-2023.pdf), [Varner](https://varner.com/globalassets/contact/informasjon-om-kameraovervaking-i-varner.pdf). Jeg har *ikke* bekreftet paragrafen i forskriften (FOR-2018-07-02-1107).

### Inferences
**Raske tiltak**
1. **Lukk `/api/verktoy` (0,25 t):** Mangler `HYLLA_WEBHOOK_SECRET`, krev PIN (`harTilgang`) eller avvis med 503 i produksjon. Bruk `likeTrygt` for sammenligningen. Hvis ElevenLabs-agenten ikke brukes i demoen, er det enda enklere å fjerne `/api/verktoy` fra `APNE`.
2. **Valider lagring (0,5–1 t):** I `lagreForslag`, ta bare med SKU-er som finnes i `hylle.innhold`, og bare heltall fra 0 til 10 000. Avvis `forslag.tid` eldre enn 10 minutter. Det tetter det åpenbare manipuleringsangrepet.
3. **Sletting av bilder (0,5 t):** Sett `Telling.bilde` til `undefined` etter X dager (for eksempel 7), også for avvik. Lukkede avvik slettes med en gang. Si det i pitchen: «bilder slettes etter 7 dager, loggen beholdes».
4. **Personer i bildet (0,25 t):**
   - Prompt: legg til i Claude-systemprompten: «Hvis det er personer på bildet, ikke beskriv dem. Sett `bildekvalitet` til `darlig` og be om nytt bilde.»
   - Mobil: hint i kamera-UI «Pek på hylla, ikke på folk».
   - Ekte ansiktssladding (ML Kit eller en egen tjeneste) er for stort nå. Nevn det som neste steg.
   - Alternativ (1 t): beskjær bildet til hylleområdet med rammen i appen før opplasting.
5. **Kameratelefonen og jussen (0 t kode, pitch):** Gjør kameratelefonen til et valgfritt tillegg. Si at den bare skal stå på stengte hyller eller etter stengetid, at den ikke tar opp lyd, at den teller bare varer og ikke lagrer video. Ellers gjelder forskriften om kameraovervåking i virksomhet, med drøfting med tillitsvalgte, skilting og sletting. En kort «personvern»-slide dekker dette.
6. **Ingen profilering av ansatte:** Det er allerede slik i koden (ingen ansattfelt). Si det aktivt: «Avvik knyttes til lokasjon og tid, ikke til person.»
7. **Rate-grense på `/api/varer` (5 min):** Legg til `["/api/varer", 20]`.
8. **Egen header for webhook (0,25 t):** Bruk `x-hylla-webhook` så PIN og webhook-hemmelighet ikke kan forveksles.

### Gaps
- Jeg har ikke lest `sam3/sikkerhet.py` og `yolo/sikkerhet.py`.
- Forskriftens sletteregel er ikke bekreftet fra Lovdata (siden ga 404 på URL-en jeg prøvde).
- Jeg har ikke gjort noen ekte penetrasjonstest. Alt over er funnet ved å lese koden.

---

## 6. Feil og uoverensstemmelser mellom README, plan og kode

### Takeaway
README beskriver demotallene for B3 og t-skjorter, men koden har bare T1 (bord med dagligvarer og kontorvarer). «+N uten PO» blir `korrigering`, ikke «ukjent mottak, bekreft». Mobilen leser ikke opp etter lagring. Kameratelefonen bryter prinsippet om at brukeren bekrefter. Forhåndsvisningen i mobilen kan avvike fra det som lagres.

### Cited Findings
- README: «tellingen gir de faste tallene fra demomanuset (B3: 13 → 18 svarte, 16 → 14 hvite)» — [README.md:21](README.md). Koden: demotellerens tall gjelder bare T1 — [src/lib/teller.ts:263-270](src/lib/teller.ts). Seed har bare T1 — [src/lib/seed.ts:36](src/lib/seed.ts). Typekommentaren sier fortsatt `// "B3"` — [src/lib/types.ts:22](src/lib/types.ts)
- README: «spør Hylla … ElevenLabs, eller nettleserens egen tale» stemmer for mobilen (ElevenLabs STT/TTS og `expo-speech`), men ElevenLabs-*agenten* brukes bare på web — [README.md:6](README.md), [mobil/src/app/(faner)/spor.tsx:37-60](mobil/src/app/(faner)/spor.tsx)
- «+N uten åpen PO»: koden gir `korrigering` med «Flere enn ventet, ingen åpen innkjøpsordre». Planen sier «ukjent mottak, brukeren bekrefter» — [src/lib/lager.ts:142](src/lib/lager.ts), prosjektplan s. 4
- `forklar` bruker åpne PO-er for SKU-en *uansett hylle* — [lager.ts:136](src/lib/lager.ts). Plukk bruker bare ordrer for *denne* hylla — [lager.ts:144](src/lib/lager.ts). Det er asymmetrisk, men det er kanskje meningen.
- Mobilens `justert` lager `mulig_svinn` uten å sjekke `svinnTerskel`. Serveren sjekker terskelen — [mobil/src/app/tell/[hylle].tsx:205](mobil/src/app/tell/[hylle].tsx), [src/lib/lager.ts:150-156](src/lib/lager.ts)
- Ved lagring sendes ikke `medLyd` fra mobilen. Planen og README sier at oppsummeringen leses opp — [mobil/src/app/tell/[hylle].tsx:223](mobil/src/app/tell/[hylle].tsx), [src/lib/oppsummering.ts:16-37](src/lib/oppsummering.ts)
- Kameratelefonen lagrer uten at brukeren bekrefter. README sier «Ingenting lagres før brukeren trykker Lagre» — [src/lib/kameratelling.ts:23](src/lib/kameratelling.ts), [README.md:76](README.md)
- Claude-prompten sier «tell det du faktisk ser. Ikke juster mot forrige tall», men sender «Forrige antall» for hver vare — [src/lib/teller.ts:42, 98](src/lib/teller.ts). Det kan gi forankring, og en jurymedlem kan spørre om «Claude teller bare» holder.
- Seed: tellingen 08:00 viser BANAN 3, mens plukket av 2 er 08:30 — [src/lib/seed.ts:56, 82](src/lib/seed.ts)
- Innstillinger-testen «Hør» sier «Du har tre brusbokser på Bord 1». Det stemmer med T1 før tellingen (seed gir 4), men ikke etter — [mobil/src/app/innstillinger.tsx:109](mobil/src/app/innstillinger.tsx)

### Inferences
- **README (0,25 t):** Bytt B3 og t-skjorter med T1 «Bord 1»: brus −1 (plukk 20501), penn −1 (mulig svinn), kaffekopp +2 (PO-3001). Juryen eller Holio kan lese README.
- **Ukjent mottak (1 t):** Ny `HendelseType` `ukjent_mottak` (eller `korrigering` med `avvik`-flagg), en chip og «Bekreft mottak» i Resultat. Det er synlig og forsvarlig fordi det følger planen. Lav risiko, siden `forklar` er ett sted.
- **«Forrige antall» i prompten:** Fjern det (blindtelling, 5 min), men test først at nøyaktigheten ikke faller. Eller behold det og si ærlig at Claude får forventet antall som kontekst. Jeg anbefaler å teste med 3 bilder før dere bestemmer.

### Gaps
- Selve prosjektplan-PDF-en er ikke lest på nytt. Henvisningene til planen kommer fra notatet kodebase_og_gjenbruk.md.

---

## 7. Prioritert liste over justeringer før kodefrys (søndag 12:00)

### Takeaway
Gjør P0 (ca. 3–4 t) i kveld: reserveteller med tidsavbrudd, avbryt og tidsavbrudd i mobilen, lukke webhook-hullet, rette README, og øve med nullstilling. P1 (ca. 4–6 t) gir mest inntrykk: opplesning etter lagring, +/- ved retting, Zebra- eller etikettskanning i søkefeltet, sletting av bilder og validering. P2 er fint å ha (CSV, EAN-skanning, ukjent mottak, deep link). Alt som har med offline-kø, sladding av ansikter og webhook ut å gjøre hører til pitchen som neste steg.

### Cited Findings
(Grunnlaget er spørsmål 1–6. Fil:linje står der.)

### Inferences
| Pri | Tiltak | Timer | Risiko | Hvorfor |
|---|---|---|---|---|
| P0 | Tidsavbrudd (20 s) og reserve i `/api/tell`: ekstern teller → Claude → demo (T1), merket «reserve» | 0,5–1 | Lav | Demoen henger ikke |
| P0 | `AbortSignal.timeout` i mobilens `kall()` (30 s for telling, 15 s ellers) og «Avbryt» på Analyserer | 0,5–1 | Lav | Ingen fastlåst skjerm |
| P0 | Krev PIN på `/api/verktoy` når webhook-hemmeligheten mangler, og sammenlign i konstant tid | 0,25 | Lav | Den etiske hackeren finner det fort |
| P0 | Rett README (T1 i stedet for B3) og seed-tidene (banan, 08:00) | 0,5 | Ingen | Konsistens |
| P0 | `HYLLA_TELLER`, Supabase, PIN og utgiftstak i Vercel. Release- eller utviklingsbygg med https. Øv tre ganger. Ta opp video. | 1–1,5 | — | Sjekklisten i spørsmål 4 |
| P1 | Les oppsummeringen høyt etter lagring (`medLyd` + avspilling, ellers `Speech`) | 0,5–1 | Lav | Stemme-wow i flyten |
| P1 | +/- per vare i Resultat. Gjør «Forkast» og «Demotelling» til store knapper | 1–1,5 | Lav | Hansker, retting |
| P1 | Validering i `lagreForslag` (SKU på hylla, heltall 0–10 000, ferskt forslag) | 0,5–1 | Lav | Sikkerhet |
| P1 | Sletting av bilder etter 7 dager, og prompt-regel om personer i bildet | 0,5–0,75 | Lav | Advokat, GDPR |
| P1 | Hylleetiketter (QR eller Code128) + `autoFocus` på søket + DataWedge-profil (Keystroke + ENTER) | 0,5 | Middels (enheten) | «Fungerer på Zebra-en dere har» |
| P1 | Demotelleren regner relativt (tåler gjentakelse), eller en tydelig nullstill-knapp | 0,5 | Lav | Øving |
| P2 | `Vare.ean` + EAN-skanning med `expo-camera` → telling av én SKU | 1,5–2,5 | Middels | Butikk, rask sjekk |
| P2 | CSV-eksport av åpne avvik (`/api/avvik.csv`) | 1 | Lav | Holio-integrasjon i dag |
| P2 | «Ukjent mottak, bekreft» for +N uten PO | 1 | Lav–middels | Følger planen |
| P2 | Deep link `hylla://tell/T1` testet via adb, og vist på slide | 0,5 | Lav | Modul i Holio OPS |
| P2 | Lik forhåndsvisning og lagring (`justert` vs `forklar`) | 1 | Middels | Riktige tall på skjermen |
| P2 | Lagrede demobilder som ekte reserve | 0,5–1 | Lav | Dårlig lys eller kamera |
| Pitch | Offline-kø, ansiktssladding, webhook ut med HMAC, Holio API-kobling, samtykke for kameratelefonen | 0 | — | Neste steg |

Sum: P0 ≈ 3–4,5 t, P1 ≈ 4–6 t, P2 ≈ 6–8 t. Med ca. 3 utviklere og søvn er P0 + P1 realistisk innen 12:00. P2 tas bare hvis M3 (lør 23:30) er nådd.

**Risiko ved endringene**
- Endringer i `lager.ts` (ukjent mottak, validering) påvirker loggen. Det finnes ingen tester, så kjør demoflyten for hånd etter hver endring.
- `autoFocus` på søket kan åpne tastaturet på telefoner uten skanner. Slå det på bare når det er en Zebra (`Device.manufacturer === "Zebra Technologies"` via `expo-device`, som allerede er avhengighet — [mobil/package.json:15](mobil/package.json)).
- Tidsavbrudd som er for kort (under 15 s) kan sende en treg, men fungerende telling over i reserven. Mål tiden først.
- Minnet om test-servere på Windows: kjør bare én `next dev` om gangen.

### Gaps
- Timeanslagene er ikke kalibrert mot lagets tempo.
- Ingen av tiltakene er prøvd i koden. Risikoen er vurdert ut fra hvor mye kode som berøres.
