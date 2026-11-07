# Hylla teller, loggen forklarer, stemmen leder

**Kortversjon:** Behold «ta bilde → tell → sammenlign med loggen». Dere vinner mest på fire grep før kodefrys søndag kl. 12:00. **(1) Demoen må ikke kunne henge.** I dag har verken mobilappen eller Claude-telleren tidsavbrudd, og bare SAM 3.1 har en reserve. **(2) Ikke kall noe «mulig svinn» før tellingen er sikker.** I dag påvirker sikkerheten i tellingen ikke om noe blir merket som svinn. Dessuten får Claude se loggtallet («Forrige antall») mens den teller, så den kan dras mot loggen og skjule svinn. **(3) La hvert avvik svare på *når* og *i hvilket steg*.** Det gjøres med en tidslinje per vare og noen få faste regler, for eksempel «samme vare har dukket opp på nabohylla = feilplassert, ikke svinn». **(4) Flytt stemmen fra en egen fane og inn i selve telleflyten.** Stemmen skal lese opp resultatet, forklare hvorfor og spørre «skal jeg telle igjen?». Forskningen er tydelig på at generelle KI-modeller teller dårlig når varene står tett eller ligger oppå hverandre. Den beste modellen i én test fikk bare **42,9 % riktig** ([CountQA, arXiv 2508.06585](https://arxiv.org/abs/2508.06585)). Derfor er «menneske bekrefter, loggen er fasiten» både riktig design og det sterkeste svaret til juryen. Alle «Må»-tiltakene tar til sammen ca. **14–21 persontimer** (eget anslag). Det går innenfor helgen med fire personer hvis dere kutter i den rekkefølgen som står i del 5.

> **Slik leser du rapporten.** Hver påstand er merket:
> **[Dok]** = dokumentert i en kilde (lenke i teksten).
> **[Kode]** = observert i koden på branch `Mayo`, commit 799a841, med `fil:linje`. Ingen filer er endret.
> **[Anslag]** = vår egen vurdering. Alle timetall er anslag for én person som kjenner koden. Ingenting er målt.

---

## 1. Sju justeringer gir mest verdi per time

1. **Tidsavbrudd, reserveteller og Avbryt-knapp (ca. 1–2 t).** [Kode] Mobilens `kall()` bruker `fetch` uten tidsavbrudd (`mobil/src/lib/api.ts:52-64`), og Claude-telleren har heller ikke tidsavbrudd (`src/lib/teller.ts:108-119`). Ruten venter opptil 60 s (`src/app/api/tell/route.ts:7`), og Analyserer-skjermen har ingen Avbryt-knapp. Henger en telling foran juryen, sitter dere fast. Dette er den største demorisikoen.
2. **«Tell igjen» før «mulig svinn» (ca. 1–1,5 t).** [Kode] `mulig_svinn` lages når nedgangen er minst `svinnTerskel` (standard 1), uansett hvor sikker tellingen er (`src/lib/lager.ts:150-156`). [Dok] Lagerposter er ofte feil uansett: over 65 % av ca. 370 000 poster stemte ikke i en stor studie ([DeHoratius & Raman 2008](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641)). Bransjen starter derfor alltid med en ny telling ([Racklify](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/)). En ny telling bygger på kameraet, så konseptet blir sterkere, ikke svakere.
3. **Fjern «Forrige antall» fra Claude-prompten (15 min + test).** [Kode] Prompten sier «ikke juster mot forrige tall» (`teller.ts:42`), men sender likevel `Forrige antall: ${beholdning(...)}` for hver vare (`teller.ts:98`). Det kan få Claude til å «telle» det loggen sier, og da forsvinner svinnet.
4. **Rett to logikkfeil i `forklar` (ca. 1 t).** [Kode] Åpne innkjøpsordrer (PO) brukes uten å sjekke hylla (`lager.ts:135-136`). En vare som er satt på feil hylle kan derfor «lukke» en PO og samtidig gi falskt svinn på den riktige hylla. En økning uten PO blir stille `korrigering` (`lager.ts:142`), mens planen sier «ukjent mottak, bekreft».
5. **Tidslinje og regelen «feilplassert, ikke svinn» (ca. 4–6 t).** Med en tidslinje kan svaret lyde: «Avviket oppstod mellom tellingen tirsdag 08:00 og nå. Ingen plukk i perioden. Bord 2 har én penn for mye. Trolig feilplassert.» Det svarer på kritikken om at kameraet bare sier *at* noe mangler. [Dok] Feilplassering er en stor kilde: 60 % av utsolgt-tilfellene i ett utvalg ([Raman, DeHoratius & Ton 2001](https://cmr.berkeley.edu/2001/05/43-3-execution-the-missing-link-in-retail-operations/), lest som sammendrag).
6. **Stemmen inn i kjerneløpet (ca. 3–5 t).** [Kode] Stemmen har i dag bare leseverktøy og ligger på en egen fane. Mobilen leser ikke opp oppsummeringen etter lagring, selv om serveren kan lage den (`mobil/src/app/tell/[hylle].tsx:223-226` mot `src/app/api/tell/lagre/route.ts:21-33`). [Dok] Juryer i ElevenLabs-hackathons vurderer hvor godt teknologien er integrert ([lablab.ai](https://lablab.ai/ai-hackathons/elevenlabs-ai-audio-challenge)) og «stemme i en ekte arbeidsflyt» ([luma.com London AI Hackathon](https://luma.com/ja5x0m76)).
7. **Tett sikkerhetshullet i webhooken og si ærlige setninger i pitchen (ca. 0,5 t kode + pitch).** [Kode] `/api/verktoy` er unntatt fra PIN (`src/middleware.ts:11`). Hemmeligheten sjekkes bare *hvis* `HYLLA_WEBHOOK_SECRET` er satt, og da med vanlig `!==` (`src/app/api/verktoy/[navn]/route.ts:10-13`). En etisk hacker i juryen finner dette fort. Si heller ikke «bildene slettes». Bilder som et avvik viser til, beholdes uten tidsgrense (`lager.ts:246-257`).

---

## 2. Tiltak per vinkel

### 2a. Tellepresisjon: få varer per bilde, ingen fasit i prompten, og punkter i stedet for et tall

[Dok] Anthropic skriver selv at Claude gir omtrentlige tall, «especially with large numbers of small objects» ([Anthropic Vision docs](https://docs.anthropic.com/en/docs/build-with-claude/vision)). Roboflow testet i juni 2026. Claude Fable 5 klarte 3 av 10 telleoppgaver. Roboflow skriver at tellinger holder når objektene er få og står adskilt, men faller sammen med rot og overlapp ([Roboflow](https://roboflow.com/blog/claude-fable-5-for-vision)). SAM 3 teller bedre på enkle tester med 2–10 objekter, men sliter med «fine-grained out-of-domain concepts» ([SAM 3, arXiv 2511.16719](https://arxiv.org/html/2511.16719v2)). Brettede stabler hører trolig til den gruppen [Anslag]. Den best dokumenterte prompt-endringen er **«pek først, tell så»** (Point-then-Count): modellen gir én koordinat per gjenstand, og koden teller punktene ([arXiv 2603.21746](https://arxiv.org/abs/2603.21746); [Hou et al. 2025](https://arxiv.org/abs/2512.15254)). Det motsatte, å dele bildet opp i biter, ga *dårligere* resultat i én test ([VLMCountBench-oppsummering, sekundærkilde](https://www.themoonlight.io/review/your-vision-language-model-cant-even-count-to-20-exposing-the-failures-of-vlms-in-compositional-counting)).

| Tiltak | Hva dere endrer | Hvorfor | Timer | Risiko |
|---|---|---|---|---|
| Blindtelling | Fjern `Forrige antall` i `src/lib/teller.ts:98`. Test 3 bilder før og etter. | [Kode] Ankeret ligger i prompten | 0,25 | Lav. Hvis det blir dårligere, behold ankeret og si det ærlig |
| Point-then-Count | Legg `punkter: [{x,y}]` per SKU i `SKJEMA` i `teller.ts`. Sett `antall = punkter.length` i koden. | [Dok] høyest treff i studien, over 94 % F1 på punktene ([arXiv 2603.21746](https://arxiv.org/abs/2603.21746)) | 1,5–2 | Middels. Prompt-endring, test før frys |
| Høyere oppløsning | `maks` 1568 → 2576 i `src/lib/bilde.ts:3`. Mobilen bruker 1600 px og JPEG 0,75 (`tell/[hylle].tsx:38-42`). | [Dok] Claude 4.7+ tar 2 576 px ([Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/vision)) | 0,5 | Lav, men tregere opplasting. Mål tiden |
| Kvalitetsport | Hvis `bildekvalitet === "darlig"`, lag ikke forslag. Be om nytt bilde. | [Dok] Claude feiler oftere på dårlige bilder ([Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/vision)). [Kode] feltet finnes allerede | 0,5 | Lav |
| Tell igjen ved usikkerhet | I `forklar`/`lagForslag`: sikkerhet < 0,8, et `alternativ` eller avvik ≤ usikkerheten gir `tell_igjen`, ikke `mulig_svinn` | [Kode] `lager.ts:150-156`. [Dok] omtelling først ([Racklify](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/)) | 1–1,5 | Lav–middels (`lager.ts` har ingen tester) |
| +/- per vare | Pluss- og minusknapper ved hvert tall på resultatskjermen, i stedet for bare «a eller b» (`tell/[hylle].tsx:277-298`) | [Kode] i dag kan man ikke rette når begge tallene er feil | 1–1,5 | Lav |
| Ensemble | Ny `ensembleTeller`: Claude og SAM 3.1 i `Promise.all`. Er de uenige, settes sikkerheten lav. | [Dok] anbefalt mønster: detektor teller, VLM resonnerer ([Roboflow](https://roboflow.com/blog/claude-fable-5-for-vision)) | 2–3 | Middels (dobbel ventetid og kostnad) |
| Skann, så foto av én vare | `Vare.ean` + `CameraView` med `barcodeTypes: ["ean13","code128"]`. Send bare den SKU-en. | [Dok] `expo-camera` leser EAN-13 ([Expo](https://docs.expo.dev/versions/latest/sdk/camera/)). [Kode] en telling av én vare virker allerede (`lager.ts:91-92`) | 1,5–2,5 | Middels |
| Prikkoverlegg | Tegn punktene på bildet. Trykk for å fjerne eller legge til. | Gjør tellingen etterprøvbar [Anslag] | 3–4 | Høy før frys |
| Sidebilde av stabler | Bilde nummer to fra siden. Tell lag eller kanter. | [Dok] forskning på stabler bruker 3D/dybde ([arXiv 2411.19149](https://arxiv.org/abs/2411.19149v2)). Et sidebilde er en billig tilnærming [Anslag] | 1,5–2 | Middels, ikke målt |

**Ikke bygg nå:** YOLO. [Kode] Den krever en egentrent `hylla.pt` (`yolo/app.py`). [Dok] Ultralytics har ingen ferdig SKU-110K-modell ([Ultralytics](https://docs.ultralytics.com/datasets/detect/sku-110k/)). **Demovalg [Anslag]:** hold dere til bordet T1 med tydelige, adskilte varer. Ikke bruk brettede t-skjorter i flere størrelser. Det er nettopp der tellingen er svakest.

### 2b. Forklare hvor, når og i hvilket steg: tidslinje og faste regler, der koden bestemmer og Claude forteller

[Kode] `forklar()` ser bare på én hylle og én vare om gangen. Den ser på hvordan PO-er og ordrer står *nå*, ikke på hendelsene siden forrige telling (`lager.ts:133-157`). Derfor kan den ikke si *når*. [Dok] Bransjen undersøker et avvik i fast rekkefølge: (1) ny telling, (2) transaksjonene rundt tellingen, (3) nabolokasjoner og mottakssone, (4) varer som ligner, og til slutt (5) tyveri ([Racklify](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/)). SAP slår sammen pluss og minus for samme vare på tvers av lokasjoner før noe bokføres ([SAP EWM](https://help.sap.com/saphelp_ewm70/helpdata/en/4c/b4e7d24c1f1921e10000000a15822b/content.htm)). Det er samme idé som «−1 her og +1 på nabohylla = flytting, ikke svinn».

| Tiltak | Hva dere endrer | Hvorfor | Timer | Risiko |
|---|---|---|---|---|
| Anker per vare | `sisteVerifisert(s, hylle, sku)` = nyeste telling der `sku in t.antall`. Erstatter `sisteTelling(s, hylle)` (`lager.ts:85`). | [Kode] når bare noen varer telles, blir tidsvinduet feil | 0,5 | Lav |
| Tidslinje | `tidslinje(s, hylle, sku)` går gjennom hendelsene fra ankeret til nå og regner forventet antall underveis. Vis den i `lagKort("logg")`. | [Kode] Logg-kortet vises allerede i mobilen (`mobil/src/components/KortVisning.tsx:51-62`). `klokke()` viser bare klokkeslett, så legg til dato | 2–2,5 | Lav |
| To bilder side om side | Vis bildet fra «da den sist stemte» og bildet fra nå | [Kode] bildene finnes allerede, fordi `ryddBilder` beholder bilder for avvik (`lager.ts:246-257`) | 0,5–1 | Lav |
| Hypoteser med regler | `forklarAvvik()` gir rangerte forklaringer: H1 feilplassert (nabohylla har +k av samme vare), H6 tellefeil (lav sikkerhet), H7 uforklart, altså mulig svinn | [Dok] støttet av praksis ([Racklify](https://racklify.com/encyclopedia/when-numbers-dont-match-understanding-cycle-count-variance/), [SAP](https://help.sap.com/saphelp_ewm70/helpdata/en/4c/b4e7d24c1f1921e10000000a15822b/content.htm)). Ingen kilde har målt hvor treffsikre slike regler er | 2–2,5 (bare H1, H6, H7) | Middels |
| PO-filter | `&& i.hylle === hylle` og sorter eldste først (`lager.ts:136`) | [Kode] feilplasserte varer «spiser» PO-er | 0,25 | Lav |
| Ukjent økning | +N uten PO gir «Flere enn ventet, sjekk nabohylle eller retur. Bekreft.» (ny type eller `korrigering` + bekreft-flagg) | [Kode] `lager.ts:142` mot planen | 0,5–1 | Lav–middels (typen finnes flere steder i UI) |
| Pris i kroner | `Vare.pris` + `toleranseNok`. Varsle hvis antall × pris ≥ grensen. | [Kode] terskelen er i stykker, og det finnes ikke noe prisfelt (`types.ts:4-17, 96`) | 1–2 | Lav, men prisene i demoen blir oppdiktet. Si det |
| Soner + flytting | `MOTTAK`- og `RETUR`-hyller + hendelsen `flytting`. Bare i seed og tidslinje. | Gjør «steg» ekte uten nye tabeller [Anslag] | 1 (bare seed) – 3 | Middels |
| «Funnet» på riktig hylle | `lukkAvvik(..., "funnet", {hylle})` | [Kode] motposten føres i dag på den opprinnelige hylla (`lager.ts:226-237`) | 0,5 | Lav |
| Mini-fotoliste «Tell disse i dag» | `fotoliste()` med 3–4 signaler: åpent avvik, mottak siden siste telling, nabohylle med +, dager siden telling. Én grunn per hylle. | [Dok] telling styrt av transaksjonsdata ga god gevinst i forhold til kostnaden ([Chuang, Oliva & Liu 2016](https://econpapers.repec.org/RePEc:bla:popmgt:v:25:y:2016:i:5:p:935-951)). Treffer ordrett «Finn hyllene med avvik» | 2–3 | Lav |

**Ikke pek på skift eller ansatte [Anslag].** [Kode] Tiden på utledede hendelser er telletiden (`lager.ts:187`), ikke tidspunktet for tapet. Trender per skift ville derfor vært misvisende. Si heller: «vi peker på hylle, tidsvindu og steg, ikke på folk».

### 2c. Stemme og ElevenLabs: fra «spør» til «gjør», inne i telleflyten

[Kode] Webappen bruker en ekte ElevenLabs-agent (`src/app/spor/ElevenLabsStemme.tsx`, WebRTC, ett client tool `vis_kort`). Mobilen bruker Scribe (tale til tekst), Claude og TTS (tekst til tale) hver for seg, ikke Agents-plattformen (`src/app/api/stemme/sporsmal/route.ts`). Alle verktøyene i `src/lib/verktoy.ts` er lesende. Skriveendepunktene finnes allerede (`/api/tell/lagre`, `/api/avvik/[id]`).

| Tiltak | Hva | Hvorfor | Timer | Risiko |
|---|---|---|---|---|
| Innstillinger i dashbordet | TTS → Eleven v4 Turbo og en norsk stemme. `text_normalisation_type: elevenlabs`. ASR-`keywords` (T1, penn, kaffekopp, PO). Tool call sound + pre-tool speech. Overskriften `# Guardrails` i prompten: «Si aldri et antall som ikke kom fra et verktøy.» | [Dok] v4 Turbo er ekspressiv, ~100 ms, og norsk er støttet ([Models](https://elevenlabs.io/docs/overview/models)). Flash v2.5 normaliserer ikke tall ([Models](https://elevenlabs.io/docs/overview/models)). ElevenLabs-normalisering er «more reliable» ([Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide.md)) | 1–1,5 | Lav. Lytt til norsk uttale av tall først |
| Opplesning etter lagring (mobil) | Send `medLyd: true` og spill av `lyd`, ellers `Speech.speak(oppsummering)` | [Kode] backend støtter det, mobilen bruker det ikke | 0,5–1 | Lav |
| Verktøyet `forklar_avvik` | Ny case i `kjorVerktoy` som returnerer tidslinje + hypoteser. Registreres som webhook i ElevenLabs. | Stemmen kan svare på «hvorfor mangler det?» med fakta fra koden | 1,5–2 | Lav |
| Stemmen tar ordet etter tellingen (web) | `sendContextualUpdate("T1 talt: penn 2, logg 3 …")` når forslaget kommer | [Dok] finnes i `useConversationControls` ([React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react)) | 2–3 | Middels |
| Skriveverktøy med tilbakelesing | `registrer_aarsak`, `be_om_omtelling`, `lukk_avvik`. Agenten leser tilbake «hylle, vare, antall» og venter på ja. Serveren krever `bekreftet: true`. | Fra «spør» til «gjør» [Anslag]. Krever M3-hullet tettet | 2–3 | Middels (skriver i loggen) |
| Morgenbrief | `dynamicVariables` ved `startSession` (antall åpne avvik, verste hylle) i førstemeldingen | [Dok] dynamic variables ([docs](https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables)). Tallene kommer fra koden, ikke fra LLM-en | 1 | Lav |
| Scribe v2 + keyterms (mobil) | `scribe_v1` → `scribe_v2`, send hyllenavn og varenavn som keyterms | [Dok] norsk har ≤ 5 % WER, og keyterms hjelper på sjeldne ord ([Models](https://elevenlabs.io/docs/overview/models.md); [Keyterm](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/keyterm-prompting.md)). Keyterms koster ekstra | 0,5 | Lav |
| Støy i rommet | `turn_eagerness: low`, headset, tekstfelt som reserve (`sendUserMessage` finnes allerede) | [Dok] ([Conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow.md)) | 0,25 | Lav |

**Ikke før frys:** React Native-SDK-en på mobilen. [Dok] Den «requires development builds and cannot be used with Expo Go» ([RN SDK](https://elevenlabs.io/docs/agents-platform/libraries/react-native)). [Kode] Appen kjører Expo ~58 / RN 0.88 og har ikke `@elevenlabs/react-native`. Anslag 4–8 t med høy risiko. Vis heller agenten i webappen, og si tydelig hvilke ElevenLabs-deler mobilen bruker. Workflows har også lav synlighet i en demo på 2 minutter.

### 2d. App, butikk og Holio Ops: bruk skanneren og ordene Holio-kundene allerede har

| Tiltak | Hva | Hvorfor | Timer | Risiko |
|---|---|---|---|---|
| Zebra uten ny kode | Hylleetiketter med QR/Code128 («T1»). DataWedge-profil med Keystroke + ENTER. `autoFocus` på søket bare på Zebra (`expo-device`). | [Dok] DataWedge sender skannet data som tastetrykk ([Zebra](https://techdocs.zebra.com/datawedge/latest/guide/output/keystroke/)). [Kode] søket åpner hylla ved ENTER når det er nøyaktig ett treff (`mobil/src/app/(faner)/tell.tsx:52-55`) | 0,5–1 | Middels (krever en Zebra-enhet, og dette er ikke testet med RN `TextInput`) |
| Store trykkflater | «Forkast» og «Bruk demotelling» blir `Knapp`. Valgknappene går fra 44 til 56 px. Tilbake-knappen blir 48×48. | [Kode] lenketekst på 13–14 px (`tell/[hylle].tsx:144-146, 307`). Vanskelig med hansker | 0,5–1 | Lav |
| Vis teller og ekte sekunder | «Claude teller … 4,2 s» i stedet for kunstig fremdrift | [Kode] fremdriften er kunstig (`tell/[hylle].tsx:41-44`). Ærlig overfor juryen | 0,25 | Lav |
| «Mulig svinn» på Hjem åpner en liste | Filtrer Logg på type | [Kode] åpner i dag bare det første avviket | 0,5 | Lav |
| Holio-ord | «lokasjon», «EAN», «PO», «ordre» i UI og pitch | [Dok] Holio WMS har modulene Locations and Stock, Purchase Orders og Returns ([holio.ai/software/wms](https://holio.ai/software/wms/)) | 0,25 | Ingen |
| Deep link | Test `hylla://tell/T1` med `adb`. Vis på en slide. | [Kode] `"scheme": "hylla"` (`mobil/app.json:8`). Krever et utviklings- eller release-bygg, ikke Expo Go | 0,5 | Lav |
| CSV-eksport av avvik | `GET /api/avvik.csv` | [Dok] Holio sier at «alt … er tilgjengelig gjennom API-et», men nevner ikke webhooks eller CSV ([holio.ai/integrasjoner](https://holio.ai/software/integrasjoner/)) | 1 | Lav |

**Ikke påstå at Holio-API-et har bestemte endepunkter.** Det finnes ingen offentlig API-dokumentasjon. Spør Martin (Head of Holio) i stedet. **Lager først, butikk etterpå [Anslag]:** det er på lageret loggen og håndterminalene finnes ([holio.ai](https://holio.ai/software/wms/)).

### 2e. Demo-robusthet: alt skal ha en reserve, og demoen skal tåle å kjøres to ganger

| Tiltak | Hva | Hvorfor | Timer | Risiko |
|---|---|---|---|---|
| Reserve i `/api/tell` | Tidsavbrudd 20 s (`HYLLA_TELLE_TIMEOUT`). Ekstern teller → Claude → demo. Merk `teller: "demo (reserve)"`. | [Kode] bare SAM 3.1 faller tilbake (`teller.ts:249-255`). SAM 3 og YOLO kaster feil etter opptil 55 s (`teller.ts:146-161`) | 0,5–1 | Lav. Mål tiden først, slik at en treg men fungerende telling ikke går til reserven |
| Tidsavbrudd + Avbryt i mobilen | `AbortSignal.timeout(30000)` i `kall()`. Avbryt-knapp på Analyserer. | [Kode] `api.ts:52-64`. Tilbake-sveip er slått av (`_layout.tsx:272`) | 0,5–1 | Lav |
| Demotelleren tåler gjentakelse | Regn relativt (−1, −1, +2) i stedet for faste tall, eller gjør Nullstill til en stor knapp | [Kode] faste absolutte tall (`teller.ts:263-275`) gir «ingen endringer» etter første lagring | 0,5 | Lav |
| Demotall for alle demohyller | Legg til tall for nye hyller (T2) | [Kode] andre hyller enn T1 gir feilen «Ingen ekte teller …» (`teller.ts:277-280`) | 0,25–0,5 | Lav |
| Lagrede demobilder | 2–3 ekte bilder av demobordet i `mobil/assets/demo/`, sendt til *ekte* telling | Hjelper hvis lys eller kamera svikter [Anslag] | 0,5–1 | Lav |
| Rate-grense | `/api/tell` fra 15 til 30 per minutt i demoen | [Kode] alle på samme Wi-Fi deler én IP (`src/lib/ratebegrensning.ts:10-18`) | 0,1 | Lav |
| Sjekkliste i Vercel | Sett `HYLLA_TELLER` eksplisitt. Supabase på (ellers ligger tilstanden i minnet per instans, `src/lib/store.ts:31-35`). `HYLLA_PIN` og `HYLLA_WEBHOOK_SECRET` satt. Utgiftstak hos Anthropic, ElevenLabs og Meta. Release-bygg med https. 4G-deling som reserve. Video av hele løpet. | [Kode] + plan | 1–1,5 | — |

### 2f. Sikkerhet og personvern: tett tre hull og si bare det koden faktisk gjør

| Tiltak | Hva | Hvorfor | Timer | Risiko |
|---|---|---|---|---|
| Lukk webhook-hullet | Mangler `HYLLA_WEBHOOK_SECRET`: avvis i produksjon eller krev PIN. Bruk `likeTrygt` (sammenligning i konstant tid). Egen header `x-hylla-webhook`. | [Kode] `route.ts:10-13`, `middleware.ts:11`. PIN og webhook deler headeren `x-hylla-secret` (`src/lib/tilgang.ts:10`) | 0,25–0,5 | Lav. Oppdater headeren i ElevenLabs-dashbordet samtidig |
| Valider lagring | Bare SKU-er i `hylle.innhold`, heltall fra 0 til 10 000, forslag yngre enn 10 min | [Kode] `/api/tell/lagre` stoler på tallene fra klienten (`lagre/route.ts:14-24`) | 0,5–1 | Lav |
| Sletting av bilder | `Telling.bilde = undefined` etter 7 dager. Lukkede avvik slettes med en gang. | [Kode] avviksbilder beholdes for alltid (`lager.ts:246-257`). [Dok] 7 dager er vanlig praksis for kameraopptak ([Varner](https://varner.com/globalassets/contact/informasjon-om-kameraovervaking-i-varner.pdf)) | 0,5 | Lav |
| Personer i bildet | Prompt: «beskriv ikke personer, sett `bildekvalitet: darlig`». Hint i kameraet: «Pek på hylla, ikke på folk.» | [Dok] arbeidsgiver kan ikke bruke kameraovervåking til å følge med på hvor mye de ansatte jobber ([Datatilsynet](https://www.datatilsynet.no/personvern-pa-ulike-omrader/overvaking-og-sporing/kameraovervaking/)) | 0,25 | Lav |
| Kameratelefonen | Gjør den til et valgfritt tillegg «etter stengetid». Ikke vis den i demoen. | [Kode] den lagrer uten at noen bekrefter (`src/lib/kameratelling.ts:22-23`), mot prinsippet i README:76. [Dok] egen forskrift om kameraovervåking i virksomhet ([Datatilsynet](https://www.datatilsynet.no/personvern-pa-ulike-omrader/overvaking-og-sporing/kameraovervaking/kameraovervaking-arbedsliv/)) | 0 | — |
| Rate-grense på `/api/varer` | `["/api/varer", 20]` | [Kode] mangler i dag | 0,1 | Lav |

### 2g. Pitch og forretning: «finner hyllene som lyver, og forklarer hvorfor»

[Dok] Utfordringsteksten setter «Finn hyllene med avvik» først. Holio OPS dekker plukk og varemottak, men ikke varetelling ([holio.ai](https://holio.ai/software/wms/)). Holio WMS koster «fra 3 990 kr» i måneden ([holio.ai](https://holio.ai/software/wms/)). Norsk svinn har ligget på ca. **0,75–0,83 %** av omsetningen ([Security Today](https://securitytoday.com/articles/2014/11/06/global-retail-theft-barometer-study-finds-shrink-cost-retailers.aspx)) og ca. 1,4 % i et eldre SNL-tall ([SNL](https://snl.no/butikktyveri)). [Anslag] For en nettbutikk med 20 MNOK i omsetning blir det **150 000–280 000 kr/år**. Et tillegg til 990 kr/mnd (vårt prisanslag) betaler seg hvis det fjerner **4–8 %** av svinnet: *«betaler seg om Hylla finner én av tolv tapte kroner.»*

| Endre linje i planen | Til | Hvorfor |
|---|---|---|
| «Ingen skannet en eneste strekkode» | «Skanningen dere allerede gjør er loggen. Hylla leser loggen og sier hvilke hyller som bør sjekkes.» | Den gamle linjen sier indirekte at Holios kjerneprodukt er unødvendig |
| «holder lageret oppdatert fra bilder» | «finner hyllene der tallene ikke stemmer, og forklarer hvorfor, med stemmen» | Speiler utfordringsteksten |
| «appen sier selv hva som skjedde» | «appen foreslår, du bekrefter» | Tåler spørsmålet om presisjon |
| «neste steg: faste kameraer» | «neste steg: tellelister ut fra risiko i Holio OPS, og retur og flytting i loggen» | Faste kameraer gjør både presisjons- og personvernproblemet større |

[Dok] Gode hackathon-pitcher har ett problem på én linje, en live demo halve tiden med ferdige data, **ett** minneverdig øyeblikk, en reservevideo, og ærlige svar på «hva er ekte og hva er mocket» ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/)). Nevn også hvordan dere har sjekket kvaliteten. Det betyr at **D må måle tellingen på 10–20 egne bilder i kveld** og ha tallet klart.

---

## 3. Feil og uoverensstemmelser som bør rettes før demoen

Alt i tabellen er **[Kode]**. Linjene i rad 1, 2, 3, 6, 10 og 14 er kontrollert på nytt for denne rapporten. Resten kommer fra kodelesingen i notatene.

| # | Feil | Hvor | Hvorfor det er farlig | Retting (timer) |
|---|---|---|---|---|
| 1 | Claude får «Forrige antall» selv om prompten sier «ikke juster» | `src/lib/teller.ts:42, 98` | Tellingen kan dras mot loggen, og svinnet blir skjult. Juryen kan spørre om «Claude teller bare» stemmer | Fjern og test (0,25) |
| 2 | PO brukes uten å sjekke hylla, og i tilfeldig rekkefølge | `src/lib/lager.ts:135-136` | Én feilplassering gir falsk restlevering, en PO som lukkes feil, og falskt svinn | `&& i.hylle === hylle` + sortering (0,25) |
| 3 | +N uten PO blir stille `korrigering` | `lager.ts:142` | Planen sier «ukjent mottak, bekreft». Feilplassering og retur blir skjult | Ny type eller bekreft-flagg (0,5–1) |
| 4 | Sikkerheten i tellingen påvirker ikke svinn | `lager.ts:150-156` | Usikre tellinger blir «mulig svinn» foran juryen | «Tell igjen»-regel (1–1,5) |
| 5 | En åpen ordre regnes som bevis på at varen er plukket | `lager.ts:143-148` | Svinn havner i feil tidsvindu | Nevn ærlig, eller merk som «plukk ikke bekreftet» (0,5) |
| 6 | Webhook-verktøyene er åpne når hemmeligheten mangler. `!==` er ikke i konstant tid. Samme header som PIN. | `src/app/api/verktoy/[navn]/route.ts:10-13`, `src/middleware.ts:11`, `src/lib/tilgang.ts:10` | Hvem som helst kan lese beholdning og logg | (0,25–0,5) |
| 7 | Ingen tidsavbrudd, ingen Avbryt-knapp, og tilbake-sveip er slått av | `mobil/src/lib/api.ts:52-64`, `teller.ts:108-119`, `mobil/src/app/_layout.tsx:272` | Låst skjerm i opptil 60 s | (1–2) |
| 8 | Bare SAM 3.1 har en reserve. SAM 3 og YOLO kaster feil etter opptil 55 s. | `teller.ts:146-161, 249-255` | Ett tjenestebrudd stopper demoen | Felles reserve i `/api/tell` (0,5–1) |
| 9 | Demotelleren har bare tall for T1, og tallene er absolutte | `teller.ts:262-280` | Andre hyller gir feil. Andre gjennomkjøring gir «ingen endringer» | (0,5–1) |
| 10 | Seed-tider: tellingen kl. 08:00 viser BANAN 3, men plukket av 2 bananer står 08:30 | `src/lib/seed.ts:56, 82`. Fast UTC+1 i `seed.ts:8-15` | Nullstilles demoen før ca. 08:45, ligger hendelser i fremtiden. (UTC+1 er riktig i november, så sommertid er ikke et problem nå.) | Flytt til 07:30/07:45 (0,25) |
| 11 | README beskriver B3/t-skjorter/PO-2291. Koden har T1/PO-3001. | `README.md:21`, `src/lib/types.ts:22` | Juryen eller Holio kan lese README | (0,25) |
| 12 | Mobilens forhåndsvisning (`justert`) bruker ikke `svinnTerskel` | `mobil/src/app/tell/[hylle].tsx:199-206`, `src/app/tell/[hylle]/TellFlyt.tsx:249-251` | Skjermen viser noe annet enn det som lagres | (0,5–1) |
| 13 | Mobilen sender ikke `medLyd` og leser ikke opp | `tell/[hylle].tsx:223-226` | Planen og README lover opplesning | (0,5–1) |
| 14 | Bildestørrelsen er ulik på web (1568 px, JPEG 0,85) og mobil (1600 px, 0,75) | `src/lib/bilde.ts:3`, `tell/[hylle].tsx:38-42` | Ulik presisjon på de to klientene | Samme verdi (0,25) |
| 15 | `/api/tell/lagre` stoler på klientens tall | `src/app/api/tell/lagre/route.ts:14-24` | Lett å manipulere | Validering (0,5–1) |
| 16 | Avviksbilder lagres for alltid | `lager.ts:246-257` | «Bildene slettes» er ikke sant i dag | Sletting etter 7 dager (0,5) |
| 17 | Kameratelefonen lagrer uten at noen bekrefter | `src/lib/kameratelling.ts:22-23` mot `README.md:76` | Bryter prinsippet «ingenting lagres før du trykker Lagre» | Ikke vis den, eller krev bekreftelse |
| 18 | «Funnet» føres på den opprinnelige hylla | `lager.ts:226-237` | Loggen blir feil for begge hyllene | (0,5) |
| 19 | Testen «Hør» i Innstillinger sier «tre brusbokser», men seed gir 4 | `mobil/src/app/innstillinger.tsx:109` | Liten, men synlig hvis juryen ser den | (0,1) |
| 20 | Rate-grensen er 15/min per IP, og `/api/varer` har ingen grense | `src/lib/ratebegrensning.ts:10-18` | Laget deler IP på venuet | (0,1) |

---

## 4. Prioritert tabell over alle tiltak

Roller: **A** app, **B** stemme/KI, **C** data/API, **D** pitch. Virkning: **H** høy, **M** middels, **L** lav, **–** ingen. Alle timer og virkninger er [Anslag].

| ID | Tiltak | Pri | Timer | Rolle | Presisjon | Forklarer hvor | Stemme | Demo-robust | Wow |
|---|---|---|---|---|---|---|---|---|---|
| M1 | Tidsavbrudd + reserveteller i `/api/tell` | Må | 0,5–1 | A | – | – | – | H | – |
| M2 | Tidsavbrudd i `kall()` + Avbryt-knapp | Må | 0,5–1 | A | – | – | – | H | – |
| M3 | Lukk webhook-hullet (feil 6) | Må | 0,25–0,5 | C | – | – | L | M | M (hacker) |
| M4 | Fjern «Forrige antall» (feil 1) | Må | 0,25 | B | M | – | – | – | – |
| M5 | «Tell igjen» før svinn (feil 4) + kvalitetsport | Må | 1–1,5 | C | H | M | M | M | M |
| M6 | PO-filter + «ukjent økning, bekreft» (feil 2–3) | Må | 0,75–1 | C | – | H | – | M | L |
| M7 | Demoteller for alle demohyller + relativ, seed-tider, README (feil 9–11) | Må | 1–1,5 | C (+D) | – | – | – | H | – |
| M8 | Feilplassering-historie: nabobord T2 i seed + regel H1 | Må | 2–3 | C + B | – | H | M | M | H |
| M9 | Anker per vare + tidslinje + logg-kort med dato | Må | 2–3 | C (data) + A (kort) | – | H | M | – | M |
| M10 | Dashbord: v4 Turbo, normalisering, keywords, tool sounds, Guardrails | Må | 1–1,5 | B | – | – | H | M | M |
| M11 | Mobil leser opp oppsummering etter lagring (feil 13) | Må | 0,5–1 | A | – | L | H | – | M |
| M12 | Verktøyet `forklar_avvik` (tidslinje + H1/H6/H7) i ElevenLabs | Må | 1,5–2 | B | – | H | H | – | H |
| M13 | Pitch: nye linjer, mål presisjon på 10–20 bilder, video, øv minst 3 ganger | Må | 3–4 | D | (måler) | – | M | H | M |
| B1 | Skriveverktøy med tilbakelesing og `bekreftet: true` | Bør | 2–3 | B | – | M | H | – | H |
| B2 | `sendContextualUpdate` etter telling (web) | Bør | 2–3 | B | – | M | H | – | H |
| B3 | Point-then-Count i skjemaet | Bør | 1,5–2 | B | H | – | – | – | M |
| B4 | 2 576 px og lik bildestørrelse på web og mobil (feil 14) | Bør | 0,5 | A | M | – | – | – | – |
| B5 | Personregel i prompten + kamerahint | Bør | 0,25 | B | – | – | – | – | L (advokat) |
| B6 | +/- per vare + store knapper | Bør | 1–1,5 | A | M | – | – | M | – |
| B7 | Lik forhåndsvisning og lagring (feil 12) | Bør | 0,5–1 | A | – | L | – | M | – |
| B8 | Validering i `lagreForslag` (feil 15) | Bør | 0,5–1 | C | – | – | – | L | L (hacker) |
| B9 | Sletting av bilder etter 7 dager (feil 16) | Bør | 0,5 | C | – | – | – | – | L (advokat) |
| B10 | Morgenbrief med dynamic variables | Bør | 1 | B | – | M | H | – | H |
| B11 | Mini-fotoliste «Tell disse i dag» | Bør | 2–3 | C | – | H | M | – | H |
| B12 | Zebra-etikett + DataWedge + `autoFocus` | Bør | 0,5–1 | A | L | – | – | – | M (Holio) |
| B13 | Vis teller og ekte sekunder, rate-grenser (feil 20) | Bør | 0,25–0,5 | A/C | – | – | – | L | L |
| K1 | Ensemble Claude + SAM 3.1 | Kan | 2–3 | B | H | – | – | – | L |
| K2 | Prikkoverlegg med trykk-retting | Kan | 3–4 | A | H | – | – | – | H |
| K3 | EAN-skann → foto av én vare | Kan | 1,5–2,5 | A | H | – | – | – | M |
| K4 | Pris i kroner + kronegrense | Kan | 1–2 | C | – | M | – | – | M |
| K5 | Soner MOTTAK/RETUR + `flytting` | Kan | 1–3 | C | – | H | – | – | M |
| K6 | CSV-eksport av avvik | Kan | 1 | C | – | – | – | – | M (Holio) |
| K7 | Deep link testet + slide | Kan | 0,5 | A | – | – | – | – | M (Holio) |
| K8 | Sidebilde for stabler | Kan | 1,5–2 | B | M | – | – | – | – |
| K9 | «Funnet» på riktig hylle (feil 18) | Kan | 0,5 | C | – | M | – | – | – |
| K10 | Scribe v2 + keyterms på mobil | Kan | 0,5 | B | – | – | M | L | – |

**Summer [Anslag]:** Må ≈ 14–21 t (A ≈ 2,5–4, B ≈ 3–4, C ≈ 6–9, D ≈ 3–4). Bør ≈ 13–19 t. Kan ≈ 13–19 t. **Ikke før frys:** React Native-SDK, workflows, offline-kø, ansiktssladding, utgående webhook. Disse hører hjemme i pitchen som «neste steg».

---

## 5. Plan fra lørdag kveld til søndag kl. 12:00

### Timeplan per rolle [Anslag]

| Tid | A (app) | B (stemme/KI) | C (data/API) | D (pitch) |
|---|---|---|---|---|
| **Lør 19–21** | M2 tidsavbrudd + Avbryt. M1 reserveteller. | M4 blindtelling (test 3 bilder). M10 dashbord. | M3 webhook. M6 PO-filter + ukjent økning. M5 tell igjen. | Ta 10–20 bilder av demobordet med fasit. Mål treff per teller og tid per telling. Rett README. |
| **Lør 21–23:30** | M11 opplesning. M9 logg-kort med dato + to bilder. | Skriv `forklarAvvik` (H1/H6/H7) + M12-verktøyet i ElevenLabs. | M7 demoteller + seed-tider. M8 T2 i seed. M9 `sisteVerifisert` + `tidslinje`. | Nye pitchlinjer, nytt manus, slides (ett tall: 150–280 k / «én av tolv»). |
| **Lør 23:30** | **Sjekkpunkt:** hele løpet på telefon mot Vercel. Henger en Må mer enn 1 t etter, kutt fra bunnen av listen under. | ← | ← | Leder sjekkpunktet |
| **Søn 08–10** | B6 +/-, B4 2 576 px, B12 Zebra (hvis enheten finnes), B13. | B1 skriveverktøy **eller** B2 contextual update (velg én). B10 morgenbrief. | B8 validering, B9 bildesletting, B11 mini-fotoliste. | Øv 2 ganger med stoppeklokke. Skriv svar på juryspørsmål. |
| **Søn 10–11:30** | Bare feilrettinger. Release-bygg. | Test stemmen i rommet (10 ytringer, støy). | Vercel-sjekkliste (`HYLLA_TELLER`, Supabase, PIN, secret, utgiftstak). | Generalprøve. Ta opp reservevideo. |
| **Søn 11:30–12:00** | **Kodefrys.** Nullstill demoen. Tag commit. | ← | ← | ← |
| **Søn 12–14:15** | Ingen ny kode | Øv | Øv | Ny video med endelig manus. Øv 3 ganger. Lever kl. 14:00. |

**Kuttrekkefølge hvis dere ikke rekker alt** (kutt fra toppen): alle Kan → B11 fotoliste → B2/B1 (behold minst én) → B10 morgenbrief → B6/B12 → M9-kortet (la stemmen fortelle tidslinjen i stedet) → M8 T2-historien (da blir T1-pennen demoen: «tell igjen» → bekreftet → mulig svinn). **Kutt aldri** M1–M7, M10, M11 eller M13.

### Nytt demomanus på 2 minutter [Anslag]

Bygger på T1 «Bord 1» fra koden (brus −1 er plukk 20501, kaffekopp +2 er PO-3001). Feilplasseringen bruker en penn som er flyttet til Bord 2. Det er tydelige, adskilte varer, ikke brettede klær.

| Tid | Si | Gjør / skjerm |
|---|---|---|
| 0:00–0:20 | «Kari driver en nettbutikk på Holio. Hver vare skannes inn og ut, men tallene stemmer likevel ikke. Full telling betyr å stenge lageret.» | Slide: «150–280 k kr/år i svinn for en nettbutikk på 20 MNOK» |
| 0:20–0:35 | «Hylla, hvor skal vi telle i dag?» *(B10/B11, hvis bygget)* | Stemmen: «Bord 1 først. Mottak i går, ikke talt siden.» |
| 0:35–1:05 | «Én brus solgt, kaffekopper kom, og noe mangler.» | Ta ett bilde av T1. Telefonen leser opp: «Brus minus én, ordre 20501. Kaffekopper pluss to, restlevering PO-3001. Én penn mangler, ingen plukk forklarer det.» **← wow: samme bilde gir tre ulike forklaringer** |
| 1:05–1:35 | «Hvorfor mangler pennen?» (til agenten på web) | Agenten (`forklar_avvik`): «Mellom tellingen 07:30 og nå: ingen plukk. Bord 2 har én penn for mye. Trolig feilplassert, ikke svinn. Skal jeg be om en ny telling av Bord 2?» Tidslinjen og to bilder vises. |
| 1:35–1:50 | «Ja.» | Foto av T2 viser +1. «Ikke svinn. Flytt den tilbake.» *(Hvis M8 er kuttet: «tell igjen» → bekreftet → «mulig svinn, ingen registrering forklarer det.»)* |
| 1:50–2:00 | «Hylla sier hvilke hyller som lyver, og hvorfor. På skannerne Holio-kundene allerede har. Den betaler seg om den finner én av tolv tapte kroner.» | Slide: «Tillegg i Holio OPS» |

**Reserve:** demoteller (merket «reserve»), lagrede bilder, tekstfelt i stedet for stemme, og en ferdig video.

### Korte svar på sannsynlige juryspørsmål [Anslag, bygger på kildene over]

| Spørsmål | Svar |
|---|---|
| «Hvor presis er tellingen?» | «På demobordet traff den X av Y bilder [tallet D måler]. Kameraet er ikke fasiten. Er det usikkert, ber Hylla om en ny telling, og ingenting lagres før du bekrefter. Brettede klær er vanskelig for alle KI-modeller. Den beste fikk 43 % på tette scener ([CountQA](https://arxiv.org/abs/2508.06585)).» |
| «Hvordan vet dere at det er svinn?» | «Det vet vi ikke. Derfor sier vi *mulig*. Koden sjekker først PO-er, ordrer, nabohyllen og en ny telling. Bare det som fortsatt er uforklart blir flagget.» |
| «Personvern?» (advokat) | «Kameraet peker på hyller. Vi lagrer tall og hendelser, og bilder slettes etter 7 dager [bare hvis B9 er bygget]. Ingen felt for ansatte. Vi peker på hylle, tidsvindu og steg, ikke på folk. Overvåking av ansatte ville vært et kontrolltiltak etter aml. kap. 9 ([Arbeidstilsynet](https://prod.arbeidstilsynet.no/regelverk/lover/arbeidsmiljoloven/9)).» |
| «Sikkerhet?» (hacker) | «Nøklene ligger på serveren. Stemmen får et kortlivet token. Webhookene krever en hemmelighet som sammenlignes i konstant tid. Appen har PIN og bare HTTPS. Alt som skriver, må bekreftes.» *(Si dette bare når M3 og B8 er ferdige.)* |
| «Hvorfor stemme?» | «Hendene er opptatt med varer. Stemmen sier hvor vi skal telle, ber deg telle igjen og forklarer hvorfor. Studier viser at plukk med stemme er bedre enn med håndterminal ([de Vries m.fl. 2016](https://econpapers.repec.org/RePEc:taf:tprsxx:v:54:y:2016:i:8:p:2260-2274)).» |
| «Hvorfor ikke RFID eller bare strekkode?» | «Strekkoden er loggen, og den bruker vi. RFID krever en brikke på hver vare. Hylla bruker telefonene og skannerne kunden allerede har.» |
| «Hva er ekte og hva er mocket?» | «Bildetelling, logikk og stemme går live. Lagerdataene er testdata som speiler Holios modell.» |
| «Hvem betaler?» | «Holio-kunden, som et tillegg i OPS. Den betaler seg ved 4–8 % mindre svinn.» |

---

## 6. Åpne spørsmål dere må sjekke i dag

1. **Krever ElevenLabs-prisen Agents-plattformen?** Hvis ja, må stemmeøyeblikket skje i webappen. Spør ElevenLabs-kontakten eller Discord. Vi fant ingen offentlige kriterier for Oslo Sprint, bare for andre ElevenLabs-arrangementer ([AI Tinkerers Lisboa](https://lisbon.aitinkerers.org/hackathons/h_vWDCYNJ82Jg/entries); [Devpost](https://elevenlabs-worldwide-hackathon.devpost.com/)).
2. **Juryens kriterier og formatet på minipitchen:** lengde, live eller video, og hvem som bestemmer. Planen har selv dette som et åpent spørsmål.
3. **Presisjonen på egne bilder:** 10–20 bilder med fasit per teller (Claude, SAM 3.1). Mål også tiden per telling. Det avgjør tidsavbruddet (M1) og tallet i juryboksen.
4. **Gjør blindtelling (M4) tellingen dårligere?** Test 3 bilder før og etter.
5. **Uttale:** hvordan uttaler v4 Turbo norske tall som «fjorten», «førti» og «PO-3001»? Er den bedre enn Flash v2.5?
6. **Venue:** Wi-Fi mellom klienter, felles IP, 4G-reserve.
7. **Zebra:** har dere en enhet, hvilken modell, og har den Google-tjenester og en DataWedge-profil?
8. **Holio:** har API-et hendelser for retur og flytting, og koder for lokasjoner? Spør Martin.
9. **Supabase og Vercel:** er Supabase satt opp, slik at alle serverinstanser ser samme tilstand?
10. **Uverifiserte tall:** SAM 3 sine 93,8 % / MAE 0,12 og HoloCount sine +10–15 prosentpoeng med «thinking» er bare lest i sekundærkilder. Ikke bruk dem i pitchen.

---

## Konklusjon

Kritikken mot kameratellingen var at den bare sier *at* noe mangler, og at den teller unøyaktig. Ingen av delene krever at dere bytter retning. Den første rettes med en tidslinje og tre regler (feilplassert, tellefeil, uforklart). Den andre gjøres om til en styrke: «tell igjen» før man sier svinn, og et menneske som bekrefter. Gjennomgangen viser også at noen av de farligste demofeilene ligger i koden, ikke i kameraet: en PO som ignorerer hylla, en prompt som avslører fasiten, og et svinnflagg som ignorerer usikkerhet. De er rettet på under to timer.

For prisen avgjør det mer *hvor* stemmen brukes enn hvor pen den låter. Når stemmen leser opp tellingen, forklarer avviket med data fra koden og ber om en ny telling, blir den selve arbeidsflyten og ikke en ekstra fane. Det er den historien juryen husker: **kameraet teller, loggen forklarer, koden bestemmer, og stemmen leder Kari til riktig hylle.**
