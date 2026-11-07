# Bildetelling i Hylla: tiltak som gjør tellingen mer presis og pålitelig (bygges før søndag kl. 12)

Notatet er skrevet på norsk. Kildene står inline. **Fakta** (med kilde) holdes adskilt fra **estimater** (under «Inferences»). Alle byggetimer er mine estimater for ett teammedlem som allerede kjenner koden.

Utgangspunkt i koden (lest 7. nov. 2026, ingen filer er endret):
- `src/lib/teller.ts`: fem tellere (`sam31`, `sam3`, `claude`, `yolo`, `demo`), valgt med `HYLLA_TELLER`, og bare én kjører per telling. Claude-telleren sender referansebilder per SKU, en vareliste med `nivaa` og forrige antall, og hele hyllebildet. Svaret kommer som strukturert JSON (`antall`, `sikkerhet` 0–1, `alternativ`, `merknad`, `bildekvalitet`) med `effort: "medium"`. Claude oppgir ingen koordinater eller punkter. SAM 3.1 (Meta API) teller bokser med c ≥ 0,5 som sikre og bokser med c ≥ 0,3 som `alternativ`. SAM 3.1 faller tilbake til Claude ved feil.
- `sam3/telling.py`: én engelsk tekstprompt per SKU, for eksempel «black folded t-shirt». Funn utenfor varens del av bildet (`nivaa`: øverst/nederst/venstre …) filtreres bort. Usikre funn gir `alternativ`.
- `yolo/app.py`: krever en egentrent `hylla.pt` med SKU-navn som klasser, og `conf` 0,35.
- `src/lib/lager.ts` → `lagForslag`/`forklar`: diff = telt − logg. En nedgang dekkes først av åpne ordrer, og resten blir `mulig_svinn` hvis den er ≥ `innstillinger.svinnTerskel`. **Sikkerheten påvirker ikke om noe blir merket som svinn.** Lav sikkerhet vises bare når diff = 0. Det finnes ingen regel som ber om ny telling.
- `src/lib/bilde.ts`: nettbilder skaleres til maks 1568 px langside, med JPEG-kvalitet 0,85.
- Strekkoder brukes ikke i telleflyten. `strekkode` i `mobil/src/app/(faner)/index.tsx` er bare grafikk.

---

## 1. Hvor nøyaktige er VLM-er (Claude/GPT/Gemini) og SAM 3/YOLO på hyller, og når feiler de?

### Takeaway
Generelle VLM-er teller godt når det er få gjenstander som ligger spredt. De feiler systematisk når varene står tett, rotete eller delvis skjult, og det er nettopp slik hyller og stabler ser ut. SAM 3 teller klart bedre enn VLM-er på enkle tellebenchmarks med 2–10 objekter, men den sliter med finkornede konsepter utenfor det den er trent på. YOLO-modeller må trenes på egne data før de kan telle SKU-er.

### Cited Findings
- Anthropics egen dokumentasjon sier at Claude «can give approximate counts … but might not always be precisely accurate, especially with large numbers of small objects». Den nevner også feil på bilder som er under 200 px, rotert eller av lav kvalitet. — [Anthropic Vision docs, 2026](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- Claude 4.7 og nyere tar bilder med inntil **2 576 px** langside og 4 784 visuelle tokens. Andre modeller tar 1 568 px og 1 568 tokens. Ett token tilsvarer en blokk på 28×28 px, og større bilder skaleres ned. — [Anthropic Vision docs, 2026](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- Claudes koordinater og bokser er «approximate» og bør sjekkes. Koordinatene er i pikselverdier for det skalerte bildet. — [Anthropic Vision docs, 2026](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- Roboflow Vision Evals (juni 2026): Claude Fable 5 klarte **3 av 10** telleoppgaver, og Gemini 3.5 Flash klarte **7 av 10**. Roboflow skriver: «counts hold up when objects are few and separated, and fall apart with clutter and occlusion» og «no general-purpose VLM is production-grade at counting yet». Rådet deres er å la en egen detektor telle og VLM-en resonnere. — [Roboflow blog, 2026](https://roboflow.com/blog/claude-fable-5-for-vision)
- CountQA (2025) har over 1 500 spørsmål med bilder fra virkeligheten med høy tetthet, rot og okklusjon. Den beste av 15 MLLM-er fikk **42,9 %** riktig, og treffsikkerheten falt når antallet økte. — [CountQA, arXiv 2508.06585, 2025](https://arxiv.org/abs/2508.06585)
- HoloCount (juli 2026) testet over 20 MLLM-er. Selv de beste «degrade significantly» når oppgavene blir analytiske eller vanskelige. Et søkesnippet sier at mange modeller nærmet seg 0 % på tette scener med overlapp, og at «thinking mode» ga 10,6–15,4 prosentpoeng bedre resultat. Disse tallene sto **ikke** i abstractet jeg leste, så de er ikke verifisert. — [HoloCount, arXiv 2607.06420, 2026](https://arxiv.org/abs/2607.06420)
- VLMCountBench (2025, søkesnippet): Å dele bildet i to eller telle én type om gangen ga *lavere* treffsikkerhet enn enkle prompter, på syntetiske figurer. — [søkeresultat via themoonlight.io-oppsummering, 2025](https://www.themoonlight.io/review/your-vision-language-model-cant-even-count-to-20-exposing-the-failures-of-vlms-in-compositional-counting) (sekundærkilde)
- SAM 3-artikkelen (Meta, nov. 2025, v2 mars 2026) evaluerer telling på CountBench (487 bilder brukt) og PixMo-Count (529 bilder brukt), begge med 2–10 objekter per bilde. Spørsmålet gjøres om til en enkel substantivfrase, og funn med sikkerhet > 0,5 telles. Ifølge forfatterne oppnår SAM 3 «good object counting accuracy» sammenlignet med MLLM-er. — [SAM 3, arXiv 2511.16719, 2025/2026](https://arxiv.org/html/2511.16719v2)
- Sekundærkilder oppgir at SAM 3 får **93,8 %** riktig med MAE **0,12** på CountBench og 86,2 % med MAE 0,21 på PixMo-Count, og at den slår Gemini 2.5 Pro og Qwen2-VL. Jeg fikk ikke hentet tabellen direkte, så tallene må sjekkes mot artikkelen. — [Emergent Mind, 2025](https://www.emergentmind.com/papers/2511.16719); [Encord, 2025](https://encord.com/blog/segment-anything-model-3)
- SAM 3 sine begrensninger: Den «struggles to generalize to fine-grained out-of-domain concepts» zero-shot, men tilpasser seg raskt med litt finjustering. Med 10 bilder per klasse (10-shot) er den best i klassen på ODinW13 og RF100-VL. — [SAM 3, arXiv 2511.16719](https://arxiv.org/html/2511.16719v2)
- SAM 3 kan også ta **bilde-eksemplarer**, det vil si én boks rundt én instans, i stedet for eller i tillegg til tekst («T+I»-prompting). — [SAM 3, arXiv 2511.16719](https://arxiv.org/html/2511.16719v2)
- SKU-110K har 11 743 bilder og over 1,7 mill. bokser, altså omtrent 147 varer per bilde. Ultralytics gir ingen ferdigtrent SKU-110K-modell, bare treningskommandoen (`yolo26n.pt`, 100 epoker, imgsz 640). — [Ultralytics docs, 2026](https://docs.ultralytics.com/datasets/detect/sku-110k/)
- Den opprinnelige SKU-110K-metoden fikk AP 0,492 (IoU 0,5:0,95), mot 0,455 for RetinaNet. Senere metoder ligger rundt 55–59 AP (aggregatortall, ikke verifisert). — [Goldman et al., arXiv 1904.00853, 2019](https://arxiv.org/pdf/1904.00853); [hyper.ai leaderboard](https://hyper.ai/en/sota/tasks/dense-object-detection/benchmark/dense-object-detection-on-sku-110k)
- Et semi-supervisert oppsett med Faster R-CNN og YOLO fikk mAP 0,413 på SKU-110K. — [arXiv 2509.09750, 2025](https://arxiv.org/pdf/2509.09750)

### Inferences
- Hylla sine typiske scener (5–20 plagg i stabler, delvis skjult) ligger midt i området der VLM-er faller (CountQA, Roboflow). Claude alene bør derfor **ikke** være den eneste sannheten for å merke noe som «mulig svinn».
- SAM 3 er sterkest på det CountBench måler: 2–10 adskilte objekter med en enkel frase. Stabler av like, brettede plagg er nærmere det artikkelen kaller «fine-grained / out-of-domain». Jeg forventer at SAM 3 enten slår sammen lag i en stabel til én maske eller bare finner plagget øverst. Dette er ikke testet, så teamet bør prøve 5 egne bilder.
- YOLO uten egentrent modell gir ingen nytte før fristen. Et SKU-110K-trent «produkt»-objektmodell teller bokser, men skiller ikke SKU-er og er laget for emballasje sett forfra, ikke tekstiler.
- Den raskeste presisjonsgevinsten i koden er trolig å la Claude få **2 576 px** i stedet for 1 568 px. Modellstandarden er `claude-opus-5-5`, som er nyere enn 4.7. Det gir omtrent 2,7 ganger så mange visuelle tokens per bilde. Kostnad: ca. 0,5 t (endre `maks` i `src/lib/bilde.ts` og bredden i `mobil/src/lib/bilde.ts`).

### Gaps
- Jeg fant ingen offentlig benchmark for telling av **brettede klær i stabler** med VLM eller SAM 3.
- Jeg fikk ikke verifisert de eksakte SAM 3-tallene (93,8 % / 0,12) direkte i artikkeltabellen.
- Jeg fant ingen fagfellevurdert måling av Claude Opus 5.x på CountQA eller lignende.

---

## 2. Prompt- og ensemble-tiltak: hvilke hjelper, og hvor mye?

### Takeaway
Den best dokumenterte prompt-endringen er «pek først, tell så» (Point-then-Count): modellen lister én koordinat eller boks per gjenstand, og koden teller dem. Det gir både bedre telling og noe å vise brukeren. Selvkonsistens og ensemble med enighetssjekk er lite dokumentert for telling, men billig å bygge, og den største verdien er å **oppdage** usikkerhet, ikke å forbedre selve tallet. Å dele bildet opp (tiling) er ikke vist å hjelpe og kan gjøre det verre.

### Cited Findings
- «Getting to the Point» (mars 2026): Point-then-Count gir høyest treffsikkerhet av de testede metodene og bedre generalisering til ukjente data (OOD). Punktene er riktig plassert i bildet i over **94 %** av tilfellene (F1). Forbedringen kommer fra den romlige informasjonen i koordinatene. Begrensningen er at plasseringen varierer med hvor i bildet objektet står. — [arXiv 2603.21746, 2026](https://arxiv.org/abs/2603.21746)
- Hou et al. (des. 2025): de fleste VLM-er «can approximately enumerate», og treffsikkerheten «significantly improves» når modellen først skriver ned posisjon og etikett for hvert objekt. Likevel teller ingen modell pålitelig i komplekse scener. — [arXiv 2512.15254, 2025](https://arxiv.org/abs/2512.15254)
- Point-then-Count kommer fra Molmo/PixMo (Deitke et al., CVPR 2025). — [arXiv 2603.21746](https://arxiv.org/abs/2603.21746)
- Å dele bildet i to eller telle én type om gangen *reduserte* treffsikkerheten i VLMCountBench (syntetiske figurer). — [themoonlight-oppsummering, 2025](https://www.themoonlight.io/review/your-vision-language-model-cant-even-count-to-20-exposing-the-failures-of-vlms-in-compositional-counting) (sekundærkilde)
- Anthropics cookbook viser at klassisk prompt-teknikk (rolle, eksempler, steg-for-steg) motvirker hallusinasjon i en eksempeloppgave om å telle hunder. — [Claude Cookbook: Best practices for vision, 2026](https://platform.claude.com/cookbook/multimodal-best-practices-for-vision)
- Roboflow anbefaler å kombinere: en finjustert detektor teller, og VLM-en resonnerer om scenen. — [Roboflow, 2026](https://roboflow.com/blog/claude-fable-5-for-vision)
- HoloCount (søkesnippet, ikke verifisert): thinking mode ga +10,6 til +15,4 prosentpoeng på telling. — [arXiv 2607.06420, 2026](https://arxiv.org/abs/2607.06420)

### Inferences (tiltakskatalog. Timer = mitt estimat)
| # | Tiltak | Bygger på | Nytte (estimat) | Timer |
|---|---|---|---|---|
| A | **Point-then-Count i Claude-skjemaet**: legg til `punkter: [{x,y}]` per SKU i `SKJEMA`, og sett `antall = punkter.length` i koden i stedet for å stole på tallet modellen skriver | `teller.ts` SKJEMA og SYSTEM | Dokumentert bedre telling, og gir punkter til overlegget (tiltak 5) | 1,5–2 |
| B | **Høyere oppløsning** (2 576 px) | `bilde.ts` (web og mobil) | Flere detaljer for små eller tette plagg. Dokumentert grense, men gevinsten er ikke målt | 0,5 |
| C | **Effort høy for usikre hyller**: bytt `effort: "medium"` til `"high"` når første svar har sikkerhet < 0,8 | `teller.ts` | Thinking hjalp i HoloCount (ikke verifisert), mot høyere ventetid | 0,5 |
| D | **Tell to ganger og sammenlign** (to parallelle Claude-kall, eller ett uten og ett med punkter). Er de uenige, settes sikkerheten ned og `alternativ` = det andre tallet | `teller.ts` | Fanger ustabile tellinger. Gir ingen bedre middelverdi, men bedre kalibrert sikkerhet | 1–1,5 |
| E | **Ensemble Claude + SAM 3 med enighetssjekk**: kjør `claudeTeller` og `sam31Teller` i `Promise.all`. Enige (±0) gir sikkerhet ≥ 0,9. Uenige gir lav sikkerhet, og det høyeste tallet blir `alternativ`. Ingen ny tjeneste trengs, bare en ny `ensembleTeller` | `teller.ts`, begge tellerne finnes | Ofte uenige på stabler, og det er nettopp der svinn skal **ikke** merkes automatisk | 2–3 |
| F | **«Tell bare SKU X»**: ett kall per SKU, med beskjære-hint (`nivaa`) og referansebildet til akkurat den varen | `teller.ts` + `nivaa` | Mindre forveksling mellom varianter. Ikke dokumentert for VLM, og VLMCountBench tyder på at oppdeling kan skade. Test før det tas i bruk | 1–2 |
| G | **Ikke send «Forrige antall» i prompten** | `teller.ts` linje 98 | Fjerner ankerskjevhet. Prompten sier allerede «ikke juster», men tallet ligger der likevel | 0,25 |
| H | **SAM 3 med bilde-eksemplar**: send boksen fra ett referansebilde eller ett trykk fra arbeideren i tillegg til teksten | `sam3/app.py` | SAM 3 støtter T+I-prompting (dokumentert). Gevinsten på plagg er ukjent | 3–4 (risikabelt) |

- Tiltak G er en egen observasjon fra koden. Forrige antall står i varelisten Claude får, så modellen kan dras mot loggtallet. Da kan svinn bli skjult, og det er det motsatte av målet.
- Tiltak A og E gir størst gevinst i pålitelighet per time. A gir også punktene som overlegget i spørsmål 5 trenger.

### Gaps
- Jeg fant ingen kvantitativ studie av selvkonsistens eller majoritetsavstemning for VLM-telling.
- Jeg fant ingen data på hvor ofte Claude og SAM 3 er uenige på retail-bilder. Teamet bør måle det på 10–20 egne bilder.

---

## 3. Stabler av brettede plagg

### Takeaway
Det finnes ingen ferdig, dokumentert metode for å telle brettede plagg i stabler fra ett mobilfoto. Forskningen på stablede objekter bruker 3D/dybde (volum × pakningsgrad). Det praktiske for helgen er å be om et **sidebilde** av stabelen, telle synlige kanter eller lag, og la arbeideren bekrefte.

### Cited Findings
- «Counting Stacked Objects» (EPFL, ICCV 2025): teller identiske objekter i beholdere ved å estimere volumet stabelen tar og hvor stor del av volumet objektene fyller, og ganger de to. Metoden bruker 3D-rekonstruksjon fra flere bilder og dybdeestimat. — [arXiv 2411.19149, ICCV 2025](https://arxiv.org/abs/2411.19149v2)
- En utvidelse fra 2026 retter seg mot paller og kasser der de fleste gjenstandene er skjult. — [arXiv 2603.15470, 2026](https://arxiv.org/abs/2603.15470)
- Et USPTO-patent teller vertikale stabler ved å matche HOG-maler av stabler med kjent antall, og bruker dybde til å anslå høyden per gjenstand. Det forutsetter stive gjenstander. — [USPTO 10169677](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10169677)
- Robotikkforskning (UC3M) grupperer områder med lik høyde i dybdedata for å finne lag i et plagg. — [UC3M robotics](https://robots.uc3m.es/robot-household-companion-web/unfolding.html)

### Inferences
- **Sidebilde-modus** (estimat 1,5–2 t): når en SKU har `nivaa` lik «stabel», eller når sikkerheten er < 0,8, ber appen om bilde nummer to rett fra siden. Prompten sier da: «Tell de brettede kantene / lagene i stabelen fra bunnen og opp, og gi y-koordinat for hvert lag» (Point-then-Count per lag). Kantene på brettede plagg ses tydeligst fra siden. Det følger av geometrien, men er ikke målt.
- **Høydeestimat** (estimat 1–1,5 t): lagre `tykkelse_cm` per SKU, for eksempel en brettet t-skjorte på ca. 1,5–2 cm. Det er mitt anslag og må måles i butikken. Antall ≈ stabelhøyde / tykkelse, der høyden måles mot en kjent referanse i bildet (hyllehøyde eller hyllekant). Bruk dette **bare** som en ekstra kontroll i ensemblet, aldri alene. Usikkerheten er minst ±1 plagg per 10.
- Forslag til regel: hvis lagtellingen og høydeestimatet avviker med mer enn 1, settes `sikkerhet` lavt og arbeideren spørres (spørsmål 5).
- Dybde fra LiDAR-telefoner (iPhone Pro) er tilgjengelig uten ny maskinvare, men det er for mye å bygge før søndag.

### Gaps
- Jeg fant ingen studie av VLM- eller SAM 3-telling av brettede tekstiler, og ingen tall for tykkelse per plaggtype.

---

## 4. Varianter og størrelser (S/M/L, farger)

### Takeaway
Størrelse kan nesten aldri leses fra et hyllefoto av brettede plagg. Den sikreste og billigste løsningen er at **SKU-en settes med én strekkodeskanning** (Zebra eller telefonkamera) før bildet tas. Bildet teller da bare den ene SKU-en.

### Cited Findings
- Expo: den gamle `expo-barcode-scanner` er erstattet av `expo-camera`. I den gamle API-en støttet `scanFromURLAsync` bare QR på iOS. Android støtter blant annet EAN-13 og Code 128. — [Expo docs, BarCodeScanner v51](https://docs.expo.dev/versions/v51.0.0/sdk/bar-code-scanner); [expo GitHub-kilde](https://github.com/expo/expo/blob/master/packages/expo-barcode-scanner/src/BarCodeScanner.tsx)
- Ifølge en tredjeparts speiling av dokumentasjonen har `expo-camera` `scanFromURLAsync(url, barcodeTypes?)` med typer som `ean13` og `code128`, med standard `['qr']`. Bør sjekkes i den offisielle dokumentasjonen. — [Tessl registry, expo-camera 17](https://tessl.io/registry/tessl/npm-expo-camera/17.0.0/files/docs/barcode-scanning.md)
- Scandit ShelfView kombinerer strekkodeskanning, OCR og AR for hyllekanter, og oppgir 99,7 % «shelf insight accuracy». Tallet er leverandørens eget og ikke uavhengig verifisert. En tredjepartsprofil nevner at okklusjon, gjenskinn, fulle hyller og dårlig fototeknikk gir flere omtak. — [Scandit, 2024–2025](https://www.scandit.com/on-shelf-availability-with-shelfview/); [FitGap-profil](https://us.fitgap.com/products/053166/scandit-shelfview)
- Claude feiler oftere på små eller roterte bildeelementer, og etiketter på plagg er små. — [Anthropic Vision docs, 2026](https://docs.anthropic.com/en/docs/build-with-claude/vision)

### Inferences
- **Skann, så foto** (estimat 2–3 t): Zebra-skannere sender vanligvis koden som tastaturinput (keyboard wedge) inn i et tekstfelt. Det er standard DataWedge-oppførsel og står ikke i kildene over. Mobilappen får et felt som tar imot koden, slår opp SKU-en og sender `sku` med i `/api/tell`. Telleren teller da bare den SKU-en (tiltak F).
- **Les størrelse på hylleetiketten** (estimat 1 t): utvid Claude-skjemaet med `etikett_lest: string | null`, altså størrelse eller tekst på hyllekanten eller hengelappen hvis den er lesbar. Feltet brukes bare som kontroll mot SKU-en fra skanningen og varsler ved mismatch. Antall skal ikke avledes fra det.
- Strekkodeavlesning fra selve hyllefotoet anbefales ikke før fristen. iOS-støtten er usikker, og strekkoder på brettede plagg er sjelden synlige.

### Gaps
- Jeg fant ingen målinger av OCR-treff på størrelsesetiketter for klær fra mobilfoto.
- Hvordan Zebra-modellene i butikken er konfigurert (DataWedge-profil) er ukjent.

---

## 5. Menneske i loopen: overlegg med punkter, stemmebekreftelse, spør bare ved usikkerhet

### Takeaway
Punkter fra Point-then-Count eller SAM-bokser kan tegnes som nummererte prikker. Arbeideren trykker for å legge til eller fjerne en prikk, og antallet blir det som er bekreftet. Det gjør tellingen etterprøvbar. Å spørre bare når modellen er usikker eller tellerne er uenige, holder flyten rask.

### Cited Findings
- Punktene i Point-then-Count treffer i over 94 % av tilfellene (F1). Prikkene er altså stort sett riktige, men noen vil mangle eller være feil, og det er dem arbeideren retter. — [arXiv 2603.21746, 2026](https://arxiv.org/abs/2603.21746)
- Claudes koordinater gjelder det skalerte bildet og må skaleres tilbake til originalen. — [Anthropic Vision docs, 2026](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- SAM 3.1-svaret inneholder allerede `x1,y1,x2,y2` og `c` per boks. Koden henter i dag bare ut `c` (`parseBokser` i `teller.ts`). — egen kodelesing

### Inferences
- **Prikkoverlegg** (estimat 3–4 t): `TelleResultat.varer[i].punkter` (fra tiltak A, eller boksesentre fra SAM) vises som en `<Svg>` oppå bildet i `mobil/src/app/tell/[hylle].tsx`. Et trykk på en prikk fjerner den, og et trykk på tom flate legger til en. `antall = punkter.length` sendes til `/api/tell/lagre`. Bekreftelsen lagres med `teller: "claude+manuell"`, slik at revisjonsloggen viser at et menneske har bekreftet.
- **Stemmebekreftelse** (estimat 1–2 t, bygger på ElevenLabs-agenten): agenten sier «Jeg ser 11 svarte t-skjorter i M, loggen sier 13. Stemmer 11?» og venter på ja/nei/tall. Bruk den bare når forslaget ellers ville blitt `mulig_svinn` og sikkerheten er lav.
- **Spør bare ved usikkerhet**: regel i `lagForslag`: `trengerBekreftelse = sikkerhet < 0.8 || alternativ !== null || ensembleUenig`. Da merkes ingenting som `mulig_svinn` før det er bekreftet.

### Gaps
- Jeg fant ingen studie av hvor mye tid eller nøyaktighet prikkoverlegg gir i butikk. Effekten er en antagelse.

---

## 6. Flere bilder, video og bildekvalitet før telling

### Takeaway
En enkel uskarphetssjekk (varians av Laplace) og et nytt bilde fra en annen vinkel er billig og fjerner de verste inndataene. Video eller panorama er for mye å bygge før søndag.

### Cited Findings
- Variansen av Laplace (3×3) er en vanlig uskarphetsmåling. PyImageSearch brukte terskel 100 og skriver at den er «quite subjective» og avhenger av domenet. — [PyImageSearch, 2015](https://pyimagesearch.com/2015/09/07/blur-detection-with-opencv/)
- Verdien avhenger av optikk, lys og motiv, og av bildestørrelse, så terskelen må kalibreres på samme oppløsning som brukes i appen. — [OpenCV forum](https://forum.opencv.org/t/scoring-the-clarity-of-an-image/16268); [BlurDetection2](https://awesome.ecosyste.ms/projects/github.com%2FWillBrennan%2FBlurDetection2)
- Claude feiler oftere på bilder som er av lav kvalitet, roterte eller under 200 px. — [Anthropic Vision docs, 2026](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- Metoden i «Counting Stacked Objects» bruker flere synsvinkler eller 3D. — [arXiv 2411.19149](https://arxiv.org/abs/2411.19149v2)

### Inferences
- **Kvalitetsport** (estimat 1–1,5 t): Claude returnerer allerede `bildekvalitet` («god/ok/darlig»). Er den «darlig», bør `lagForslag` stoppe og be om nytt bilde i stedet for å lage forslag. Det er nesten gratis. En egen Laplace-sjekk i Python-tjenestene (`cv2.Laplacian(...).var()`) gir en raskere avvisning før Claude-kallet (+1 t).
- **To bilder, ta det høyeste rimelige** (estimat 2 t): front + side for stabler (spørsmål 3). Tell begge, og er de uenige, gå til bekreftelse.
- Video eller panorama: hopp over før fristen, siden det krever sammensying og sporing for å unngå dobbelttelling.

### Gaps
- Jeg har ingen kalibrert Laplace-terskel for mobilbilder av klær i 1 568–2 576 px. Teamet må måle på egne bilder.

---

## 7. Toleranse: når er ±1–2 avvik en feiltelling, og når er det svinn?

### Takeaway
Lagerregistre er ofte feil (over 65 % av postene i en stor amerikansk kjede), og telling fra bilde har sin egen feil. Et lite avvik med lav sikkerhet bør derfor gi **ny telling eller bekreftelse**, ikke «mulig svinn». Svinn bør kreve at avviket er større enn telleusikkerheten, eller at det bekreftes.

### Cited Findings
- DeHoratius & Raman (Management Science, 2008): over 65 % av omtrent 370 000 lagerposter hos en stor amerikansk detaljist stemte ikke med det fysiske lageret. Revisjonspraksis reduserte avvikene, mens et komplekst butikkmiljø økte dem. — [EconPapers / Management Science 54(4), 2008](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641)
- En oversikt oppgir feilrater på 20–67 % av SKU-ene i empiriske studier, og profittap på 3–10 %. — [Cardiff ORCA, oversiktsartikkel](https://orca.cardiff.ac.uk/120277/1/DS%20IRI_final.pdf)
- SAM 3 sin MAE på CountBench er oppgitt til ca. 0,12 (sekundærkilde). Det gjelder 2–10 adskilte objekter, ikke stabler. — [Emergent Mind, 2025](https://www.emergentmind.com/papers/2511.16719)
- Koden i dag: `mulig_svinn` utløses når uforklart nedgang ≥ `svinnTerskel`, **uavhengig av sikkerhet**. — `src/lib/lager.ts` linje 150–156

### Inferences
- Forslag til regel (estimat 1–1,5 t i `forklar`/`lagForslag`):
  1. Usikkerhet: `u = |alternativ − antall|` hvis `alternativ` finnes, ellers 0. Bruk også 1 hvis sikkerheten er < 0,8, og bruk spredningen hvis ensemblet er uenig.
  2. Hvis `|uforklart nedgang| ≤ u` eller sikkerheten er < 0,8, blir typen `"tell_igjen"`. Det er en ny type, alternativt `korrigering` med årsak «Usikker telling, bekreft». Svinn merkes ikke.
  3. Hvis nedgangen er ≥ `svinnTerskel` **og** større enn `u` **og** sikkerheten er ≥ 0,8, blir det `mulig_svinn`.
  4. Gjentatt nedgang på samme SKU over to tellinger på rad bør trekke mot svinn, siden et mønster sier mer enn ett enkelt avvik. Det kan bygges senere.
- Fast ±1 som toleranse for stabler med 10–20 plagg er et rimelig utgangspunkt, men det er mitt estimat og ikke en kildebasert norm.

### Gaps
- Jeg fant ingen bransjestandard for toleranse ved syklustelling av klær i norsk detaljhandel.
- Jeg har ikke målt den faktiske feilfordelingen for Hylla sine tellere. Den bør måles på 20 bilder med fasit før juryen ser demoen.

---

## 8. Butikkvennlig opptak: raskt bilde per SKU i stedet for hele hyllen

### Takeaway
Ett bilde per SKU (eller per stabel), tatt nært og etter en skanning, gir færre objekter per bilde, ingen forveksling mellom varianter og mer pikseldetalj. VLM-er teller best i akkurat det regimet, med få og adskilte objekter.

### Cited Findings
- VLM-telling holder når objektene er få og adskilte, og bryter sammen med rot og okklusjon. — [Roboflow, 2026](https://roboflow.com/blog/claude-fable-5-for-vision)
- Treffsikkerheten faller når antallet stiger (CountQA). — [arXiv 2508.06585, 2025](https://arxiv.org/abs/2508.06585)
- SAM 3 sine tellebenchmarks har 2–10 objekter per bilde. — [SAM 3, arXiv 2511.16719](https://arxiv.org/html/2511.16719v2)

### Inferences
- **Per-SKU-modus** (estimat 2–3 t, sammen med tiltak 4): skann, ta foto av stabelen (ev. også fra siden), få resultat med prikker, bekreft. `/api/tell` får en valgfri `sku`, og telleren filtrerer `hylle.innhold` til den ene varen. Hyllemodusen beholdes for oversikt og for å finne hyller med avvik, og per-SKU-modus brukes for å bekrefte et avvik.
- Dette passer utfordringsteksten («Finn hyllene med avvik, eller tell fra bilder»): hyllebilde for å oppdage avvik, per-SKU-bilde for å bekrefte det.

### Gaps
- Jeg fant ingen målinger av tidsbruk per SKU-foto i butikk. Scandit sitt «2,5 timer spart per dag» er en leverandørpåstand og ikke verifisert ([itsupplychain.com](https://itsupplychain.com/?p=35204)).

---

### Anbefalt rekkefølge før kl. 12 søndag (estimat, ca. 12–16 t totalt)
1. G: fjern forrige antall fra prompten (0,25 t)
2. B: 2 576 px (0,5 t)
3. Toleranseregel / «tell igjen» i `lager.ts` (1–1,5 t)
4. Kvalitetsport på `bildekvalitet` (0,5 t)
5. A: Point-then-Count i Claude-skjemaet (1,5–2 t)
6. E: ensemble Claude + SAM 3.1 med enighetssjekk (2–3 t)
7. Prikkoverlegg med trykk-korrigering (3–4 t)
8. Skann → per-SKU-foto (2–3 t)
9. Ved ledig tid: sidebilde for stabler (1,5–2 t), stemmebekreftelse (1–2 t)
