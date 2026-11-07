# La loggen og stemmen jakte på svinnet

**Kort svar:** Bygg om Hylla til en «svinnjakt» i tre steg. **Loggen velger hva som skal telles.** Deretter **leder stemmen en blindtelling** med skanneren folk allerede har. **Til slutt sporer loggen tilbake** til tidspunktet og steget der tallet gikk galt. Grunnen er at svinn sjelden er ett problem. I amerikanske tall er **tyveri utenfra ca. 36 %, ansatte ca. 29 % og prosessfeil ca. 27 %** av svinnet ([Retail Dive / NRF 2023](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/)). I tillegg er **60–65 % av lagersaldoene feil** i store studier ([DeHoratius & Raman 2008](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641); [RGIS/ECR](https://rgis.co.uk/industry-perspective/ecr-inventory-accuracy-research-study)). Mye av dette skjer i et steg der det allerede finnes en registrering (mottak, plukk, retur), og der kan en logg forklare det. Et kamera kan ikke det. En skannet strekkode (EAN) sier nøyaktig hvilken størrelse og farge det er. Det løser problem 1. Loggen mellom to tellinger løser problem 2. Korte tellinger på 5–20 varer om dagen løser problem 3. Ingen småbedrift-verktøy vi fant forklarer *hvorfor* et avvik oppstod, og ingen lar lederen spørre om det med stemmen. Der har dere en åpning. Det meste kan bygges på motoren dere har (`lagForslag` → `forklar` → `lagreForslag`). Det største ekstra arbeidet er **nye testdata med en svinnhistorie (4–6 timer)**. Kameraet trenger dere ikke kaste. Det blir en valgfri hjelper.

> **Slik leser du rapporten:** Tall med lenke er **dokumentert** i en kilde. Alt merket **«Anslag»** eller **«Vår vurdering»** er vårt eget skjønn, ikke målt. Timeanslagene er persontimer for folk som kjenner koden. De kommer fra kodenotatet og er ikke målt på laget deres.

---

## 1. Over halvparten av svinnet skjer i et steg som allerede logges

### Hvor svinn oppstår

**Svinn har fire hovedkilder.** NRF (USA, tall for 2022) fant at tyveri utenfra var **36,15 %**, tyveri fra ansatte **28,85 %**, prosess- og kontrollfeil **27,29 %** og ukjent **5,88 %** av svinnet. Svinnet var **1,6 % av salget** ([CNBC](https://www.cnbc.com/2023/09/26/organized-retail-crime-and-theft-not-increasing-much-nrf-study-finds.html); [Retail Dive](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/)). En eldre norsk fordeling (fra 2003) var butikktyver **ca. 46 %**, ansatte **ca. 23 %**, administrative feil **16 %** og leverandører **ca. 6 %**. Svinnet var da 1,4 % av omsetningen ([SNL: butikktyveri](https://snl.no/butikktyveri)). Norge har hatt lavt svinn sammenlignet med andre land, **ca. 0,75–0,83 % av omsetningen** i Checkpoint-målingene. Tallene er hentet fra omtale i andre kilder, ikke fra selve rapporten ([Security Today](https://securitytoday.com/articles/2014/11/06/global-retail-theft-barometer-study-finds-shrink-cost-retailers.aspx)). Nyere norske totaltall fant vi ikke.

**Fordelingen er gjetning, og det er et poeng i seg selv.** Butikkene ser bare et avvik ved telling og må gjette årsaken. I Europa kunne butikkene **ikke forklare 51 % av tapet**. **Opptil en tredjedel** skjer før varene når butikken, altså i transport og på lager ([Loss Prevention Media / Beck](https://losspreventionmedia.com/the-european-road-map-managing-stock-loss-in-the-retail-sector/)). *Vår vurdering:* Tyveri blir trolig overvurdert, og registreringsfeil som ser ut som tyveri blir undervurdert.

**Saldoen er nesten alltid litt feil, og feilen går begge veier.** I en ECR-studie med sju europeiske kjeder (også mote) hadde ca. **60 % av varene feil saldo**. Gjennomsnittlig avvik var **+6,6 enheter** der systemet viste for mye og **−6,0** der det viste for lite. Når saldoen ble rettet, steg salget **4–8 %** ([RGIS/ECR](https://rgis.co.uk/industry-perspective/ecr-inventory-accuracy-research-study)). En nyere studie fant **11 % mer salg** etter en opprydding, mest for «spøkelsesvarer» som systemet trodde fantes ([Rekik m.fl., arXiv 2025](https://arxiv.org/abs/2506.05357)). *Vår vurdering:* Tyveri gir bare én type feil: systemet viser for mye. Når systemet viser for lite, er det nesten alltid en registreringsfeil, for eksempel feil antall ved mottak, feil størrelse ved salg eller en retur som ikke ble registrert.

**Varetypen betyr mer enn butikken.** I DeHoratius & Raman forklarte forskjeller mellom varekategorier **26,4 %** av variasjonen i feil, mens forskjeller mellom butikker forklarte bare **2,7 %**. Dette tallet kommer fra et sammendrag, ikke fra selve artikkelen ([SUFE-sammendrag](https://academicnewsletter.sufe.edu.cn/info/394446)). **Klær er verst:** uten RFID var lagernøyaktigheten i klesbutikker **63 %**, og **69 % av innkommende ordrer** fra merkevare til butikk hadde feil ([just-style / Auburn «Project Zipper»](https://www.just-style.com/news/rfid-can-help-brands-achieve-near-100-order-accuracy/)).

**På e-handelslager er plukk og mottak de svake stedene.** De beste lagrene har **≥99,7 % riktige plukk** ([Yale / WERC 2026](https://www.yale.com/4a4034/globalassets/coms/yale/north-america/documents/white-papers/yal-1558_werc2026updates_improvingdcmetricswhitepaper.pdf)). Lagre uten full strekkodebruk har ofte **1–3 % feil**. Det tallet kommer fra leverandører og er bare retningsgivende ([Multichannel Merchant](https://multichannelmerchant.com/?p=143035)). *Vår vurdering:* Ett feilplukk endrer to saldoer, én for lite og én for mye. På et lite lager kan plukkfeil og returer derfor lage flere saldofeil enn tyveri gjør.

### Hva dette betyr for valget av løsning

Vår vurdering ut fra tallene over:

**Problem 1 (presisjon):** Løses best med en skannet EAN pluss et talt antall. Strekkoden skiller størrelser og farger. Det klarer ikke et bilde. En målestokk for bildegjenkjenning på tette hyller (SKU-110K) kommer bare opp i **ca. 0,41 mAP** ([arXiv 2509.09750](https://arxiv.org/pdf/2509.09750); [CVPR 2019](https://openaccess.thecvf.com/content_CVPR_2019/papers/Goldman_Precise_Detection_in_Densely_Packed_Scenes_CVPR_2019_paper.pdf)). mAP er ikke det samme som feil i antall, men det bekrefter at tette hyller er vanskelige for kamera. Vi fant ingen studie som sammenligner skanning og kamera direkte.

**Problem 2 (hvor og når):** Løses ved å se på loggen *mellom to tellinger*. Hver registrering (mottak, plassering, plukk, retur) smalner inn hvor varen forsvant. Dette er en sammenstilling av vanlig praksis. Vi fant ingen studie som måler hvor godt det virker.

**Problem 3 (passer i butikk):** Løses ved å telle få varer, og bare der loggen peker. Hyppig, målrettet telling er det tiltaket som har best støtte i forskningen ([Internet Retailing / ECR 2019](https://internetretailing.net/?p=38723)).

**Tyveri utenfra** (ca. 36 %) kan ingen av disse metodene vise med sikkerhet. Det ender som «mulig svinn» når ingen registrering forklarer avviket. Det må dere si ærlig i pitchen.

---

## 2. Sju alternativer som ikke bygger på kameratelling

Alle alternativene trenger det samme **felles grunnlaget (anslag 5–8 t)**:

- et `ean`-felt på `Vare` og et oppslag fra EAN til vare (0,5 t)
- **nye testdata** med 6–10 hyller, 20–30 varer med størrelser, to ukers historikk og én tydelig svinnhistorie (4–6 t)
- en liten hjelper som gjør skannede eller sagte tall om til `TelleResultat` (0,5 t)

Dagens testdata har bare én hylle (T1), dagligvarer og bare `mottak`/`plukk`. Da blir lister og mønstre meningsløse (kodenotatet, `src/lib/seed.ts`).

Viktig for valget: **Holio OPS gjør plukk og mottak på Android-håndterminaler, men sidene nevner ikke varetelling eller stemme** ([holio.ai/software/wms](https://holio.ai/software/wms/)). Vanlige småbedrift-verktøy stopper ved «tell → se avvik → godkjenn justering». Hvordan man finner årsaken, er overlatt til brukeren ([Shopify Help](https://help.shopify.com//manual/products/inventory/inventory-counts); [HL POS](https://hlposteam.freshdesk.com/support/solutions/articles/51000492096-how-to-investigate-stocktake-variances)). Verktøy som finner rotårsaken finnes bare for store kjeder, og prisen får man bare på forespørsel ([Zebra ZPA](https://www.zebra.com/content/dam/archive_zebra_dam/en/brochure/portfolio/zpa-brochure-overview-en-us.pdf); [invent.ai](https://invent.ai/phantom-inventory)).

### Alternativ A: Blindtelling med skanner og stemme

**Brukerflyt.** Medarbeideren åpner «Tell» og får en hylle, for eksempel B3. Skjermen viser hylle og varenavn, **men aldri hvor mange som skal være der**. Hun skanner én enhet med Zebra-skanneren eller mobilkameraet for å si hvilken vare og størrelse det er, og sier antallet høyt («fire»). Systemet regner ut differansen mot loggen og viser resultatet (dagens `Resultat`-skjerm). Det lagrer først når hun trykker Lagre. Hvis tallet avviker med minst `svinnTerskel`, sier stemmen «Tell en gang til» før det lagres som mulig svinn (idé H, anslag 2–3 t).

**Hva stemmen gjør best.** Den lar hendene være frie mens hun bretter og løfter klær. Den sier fra om omtelling uten å røpe fasiten. Mønsteret (sted, kontrollsiffer, sagt antall, ny telling ved avvik) er velprøvd i lagerbransjen. Honeywell VoiceLink har en egen «count mismatch»-funksjon ([Honeywell VoiceLink 4.2.1](https://help.honeywellaidc.com/Content/VoiceLink%20Release%20Notes/Vocollect_VoiceLink_421_ReleaseNotes.pdf)). I et Vocollect-eksempel ble **90 % av syklustellingene gjort med stemme** ([MMH](https://www.mmh.com/article/vocollect_helps_users_expand_use_of_voice_beyond_picking)).

**Problem 1, 2 og 3.**
- (1) Høy presisjon. EAN skiller størrelser, og en blind telling hindrer at man bare skriver inn tallet systemet viser. Fagfolk sier at de som ser forventet antall har en tendens til å skrive det ([Uphance](https://uphance.com/blog/blind-inventory-counting/)), men vi fant ingen kontrollert studie.
- (2) Gir bare *når*, altså tiden siden forrige telling, og ikke steget.
- (3) God, fordi hver telling tar få minutter.

**Gjenbruk og nytt (anslag 10–14 t).**
- Gjenbruk: `lagForslag` (tåler allerede at bare én vare er talt), `forklar`, `lagreForslag` med `kilde: "manuell"` (finnes i typen), `oppsummerTelling`, tekst til tale, `/api/tell/lagre`, `Resultat`-skjermen, `finnVare` og `/api/stemme/sporsmal`.
- Nytt: `POST /api/tell/manuell` (1–2 t).
- Nytt: blindtellingsskjerm med et skjult tekstfelt som tar imot Zebra-skanneren som tastatur (DataWedge), med mobilkamera som reserve (4–6 t).
- Nytt: tolkning av norske tallord (2–3 t), eller agentverktøyene `neste_lokasjon` og `registrer_telling` med en egen blind-prompt (3–5 t).

**Sterkeste demoøyeblikk.** Skjermen viser ingen fasit. Hun sier «fire». Stemmen svarer: «Det stemmer ikke med loggen. Tell en gang til.» Hun finner én til bak en stabel, sier «fem», og avviket forsvinner. Ingen falsk alarm om svinn.

**Svakheter og risiko.**
- Norske tallord kan bli feil i tale til tekst.
- **Assistenten kan røpe fasiten.** `hent_beholdning`, `hent_logg` og `vis_kort(vare)` viser forventet antall, så blindmodus må ha en egen prompt og bare et begrenset sett verktøy.
- DataWedge på en lånt Zebra er ikke testet, og det er heller ikke sjekket om `expo-camera` kan lese strekkoder i Expo Go.
- Webhook-ruten kan i dag bare lese (`hentState`). Verktøy som skriver trenger `endreState`.

### Alternativ B: Telleliste ut fra risiko («Tell disse i dag»)

**Brukerflyt.** Lederen åpner appen om morgenen eller spør: «Hvor skal vi telle i dag?» Systemet poengsetter alle hyller og varer med faste regler og viser de 5–10 viktigste, hver med en grunn som er lett å lese. Reglene er:

- negativ saldo
- åpent avvik
- ikke talt på X dager
- mottak siste 48 timer, eller en innkjøpsordre som bare er delvis levert
- «spøkelsesvare»: saldo over null, men ingen plukk på N dager
- nylige korrigeringer

**Hva stemmen gjør best.** Den gir en prioritert liste med grunner, uten at noen må lese en tabell: «Tre hyller i dag. B3 først, fordi PO-3001 bare er delvis levert og det ikke er plukket på fem dager.» Lagerledere har lite tid. Rapporter med for mange varsler er et kjent problem i bransjen ([Envysion](https://envysion.com/?p=39862)). En kort, muntlig topp 3 er svaret på det.

**Problem 1, 2 og 3.**
- (1) Ingen presisjon i seg selv. Listen sier bare *hva* som skal telles.
- (2) Delvis. Grunnen («mottak i går») hinter om steget.
- (3) Svært god, fordi den sparer arbeid. Den svarer direkte på Holios «Finn hyllene med avvik». Forskning støtter dette: telling styrt av transaksjonsdata kostet lite i forhold til gevinsten i et felteksperiment ([Chuang, Oliva & Liu 2016](https://econpapers.repec.org/RePEc:bla:popmgt:v:25:y:2016:i:5:p:935-951)). En modell som bare brukte kassedata fant **ca. 63 % av tomme hyller med ca. 16 % falske varsler** ([Montoya & Gonzalez 2019](https://www.dii.uchile.cl/~rmontoya/papers/OOS_HMM_MontoyaGonzalezMSOM2019.pdf), tallene er fra et sammendrag).

**Gjenbruk og nytt (anslag 8–12 t).**
- Gjenbruk: `beholdning`, `beholdningPerHylle`, `apneAvvik`, `hylleStatus`, `sisteTelling`, `plukketSiden`, `Innkjop` (`mottatt < bestilt`) og fanen «Velg hylle».
- Nytt: `risikoListe()` (2–3 t).
- Nytt: `GET /api/telleliste`, verktøyet `hent_telleliste` og kortet «Tell disse i dag» (2–3 t).
- Nytt, valgfritt: retur og plukkmangel (+1–2 t).

**Sterkeste demoøyeblikk.** «Hylla, hvor skal vi telle i dag?» Stemmen svarer med tre hyller og én grunn for hver. Den første hylla på listen viser seg å ha avvik.

**Svakheter og risiko.**
- Listen er bare så god som testdataene.
- Varer som sjelden selges gir lange perioder uten salg helt tilfeldig, så regelen for spøkelsesvarer må ha en terskel som passer for hver vare. Dette står beskrevet i notatet om metoder.

### Alternativ C: Avviksdetektiven («Hvorfor mangler det?»)

**Brukerflyt.** Etter en telling med avvik spør lederen: «Hvorfor mangler det to svarte M på B3?» Koden, ikke språkmodellen, går gjennom alle hendelser mellom de to siste tellingene. Den regner ut forventet antall etter hvert steg og finner det første steget der tallene ikke henger sammen. Svaret vises som en tidslinje (kortet `logg` er deklarert, men vises ikke noe sted i dag).

**Hva stemmen gjør best.** Den forteller sporet som en kort historie med bevis og hvor sikker den er: «Avviket oppstod mellom telling tirsdag 08:00 og onsdag 08:00. I det vinduet kom en retur av svart M som aldri ble satt på hylla.» Samme prinsipp som i dag: «Claude teller bare. Koden regner ut differansen.» Her gjør koden sporingen, og Claude forteller. Vi fant **ingen småbedrift-verktøy** der lederen kan spørre «hvorfor mangler X?» med stemmen. Det nærmeste er AutoScheduler.AI, som fikk stemme og forklarbar KI i april 2026, men for planleggingsbeslutninger og ikke svinn ([briefglance / GlobeNewswire](https://briefglance.com/companies/autoscheduler-ai-inc/pulses/3058)).

**Problem 1, 2 og 3.**
- (1) Avhenger av tellingen (bruk A).
- (2) **Best av alle alternativene.** Den sier når, og med nye hendelsestyper også hvilket steg. Beck anbefaler å kartlegge prosessene og se på hvert sted der noe kan gå galt ([Loss Prevention Media](https://losspreventionmedia.com/beyond-shrinkage/)).
- (3) Krever ingenting i butikken, fordi alt skjer i loggen.

**Gjenbruk og nytt (anslag 10–16 t, «light»-versjon ca. 8 t).**
- Gjenbruk: `Hendelse.ref`, `tellingId`, tellehistorikk, `avvik.forrigeTellingId` (gir tidsvinduet), `hentInnkjop`, `plukketSiden` og `lukkAvvik`.
- Nytt: hendelsestypene `retur` og `flytting`, og gjerne `Innkjop.varslet` (antall på pakkseddelen).
- Nytt: `sporAvvik()`, verktøyet `spor_avvik` og et tidslinjekort (3–4 t).

**Sterkeste demoøyeblikk.** Lederen spør «hvorfor?», og en tidslinje bygger seg opp på skjermen mens stemmen peker på én konkret hendelse.

**Svakheter og risiko.**
- **Plukk regnes i dag ut ved telling**, ikke når det skjer (`lager.ts:144-149`). Uten nye hendelser kan C bare si *når*, ikke *i hvilket steg*.
- Et for «smart» svar kan bli feil foran juryen. Logikken må stemme nøyaktig med testdataene.

### Alternativ D: Skannekontroll ved mottak

**Brukerflyt.** Når en leveranse kommer, skanner medarbeideren varene uten å se hvor mange som er bestilt («blindt mottak»). Hun sier antallet per vare. Systemet sammenligner innkjøpsordren, pakkseddelen og det som faktisk er skannet. Avvik flagges før varene settes på hylla.

**Hva stemmen gjør best.** Den gir en rask bekreftelse uten skjerm mens hun står med esker: «Bestilt 10, du talte 8. Skal jeg merke leveransen som mangelfull fra leverandøren?» Bransjen anbefaler blindt mottak bare for leverandører og varer med høy risiko, fordi det tar tid ([Racklify](https://racklify.com/encyclopedia/blind-receiving-versus-standard-receiving-pros-cons-and-when-to-use-each/)).

**Problem 1, 2 og 3.**
- (1) Høy presisjon ved mottak.
- (2) Skiller tydelig «leverandøren sendte for lite» fra «det forsvant hos oss». Dette er viktig fordi **69 % av inngående ordrer** i Project Zipper hadde feil ([just-style](https://www.just-style.com/news/rfid-can-help-brands-achieve-near-100-order-accuracy/)).
- (3) Passer godt både på lager og i butikkens bakrom.

**Gjenbruk og nytt (anslag 4–6 t).** Gjenbruker `Innkjop`, `forklar` for mottak og logikken fra A for skanning og stemme. Overlapper Holio-utfordring 2 og planens F8. Gir C data om hvilket steg avviket oppstod i.

**Sterkeste demoøyeblikk.** En eske med 8 t-skjorter og en innkjøpsordre på 10. Stemmen sier fra med en gang, og senere kan detektiven (C) si «dette var leverandøren, ikke svinn».

**Svakheter og risiko.** Dette er en annen utfordring enn nummer 7, så den bør bare være et tillegg. Laget må også passe på at retting av +N uten innkjøpsordre blir «ukjent mottak, bekreft», slik planen sier, og ikke `korrigering`, slik koden gjør i dag (`lager.ts:142`, ca. 1 t).

### Alternativ E: Butikkmodus, rask sjekk av én vare

**Brukerflyt.** En kunde spør etter svart M, og systemet sier at det skal være 3 på lager. Medarbeideren skanner én enhet, teller blindt, lagrer og hører svaret. Valgfritt kan appen vise alle størrelsene i en matrise (S/M/L).

**Hva stemmen gjør best.** Den gir svar uten å lete i skjermer midt i butikken: «Hvor mange svarte M har vi?» Den kan også oppdage **byttefeil**. Når én størrelse har +1 og nabostørrelsen −1, sier stemmen «trolig solgt feil størrelse, ikke tyveri». *Dette er en hypotese fra notatene, ikke målt.*

**Problem 1, 2 og 3.**
- (1) Høy presisjon for én vare.
- (2) Svak, med unntak av byttefeil.
- (3) **Best i butikk**, fordi det bare tar sekunder.

**Gjenbruk og nytt (anslag 3–6 t oppå A).** `hent_beholdning` svarer allerede på «hvor mange svarte M på B3». Nytt er skjermen «Rask sjekk», og eventuelt `Vare.modell` for matrisen (+2 t).

**Sterkeste demoøyeblikk.** Stemmen sier «svart M −1 og svart L +1 på samme hylle: trolig byttefeil i kassa». Juryen ser at systemet skiller feil fra tyveri.

**Svakheter og risiko.** Liten verdi alene. Den er en butikkhistorie oppå A.

### Alternativ F: Mønstre per lokasjon, leverandør og skift

**Brukerflyt.** Lederen spør: «Hvor taper vi mest?» Systemet grupperer lukkede avvik per hylle, leverandør eller skift og sammenligner hver gruppe med snittet.

**Hva stemmen gjør best.** Den svarer med ett mønster: «Leverandør X: tre av fire mottak manglet varer.» Eller: «Hylle C1 ved utgangen står for 60 % av svinnet.»

**Problem 1, 2 og 3.**
- (1) Ingen presisjon.
- (2) Svarer på *hvor* og *hvem i kjeden*. Ansattetyveri er ca. 29 % av svinnet ([Retail Dive](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/)), og det er dette bransjen sporer med avviksrapporter på kassedata ([DTiQ](https://www.dtiq.com/resources/guide-to-exception-based-reporting)).
- (3) Krever ingenting i butikken.

**Gjenbruk og nytt (anslag 6–10 t).** Gjenbruker `Hendelse.hylle`, `tid` (skift kan avledes av klokkeslettet), `leverandor` og `apneAvvik`. Nytt er `hent_svinnmonster` og testdata med et tydelig mønster.

**Svakheter og risiko.**
- Med få testdata blir mønsteret konstruert.
- **Analyse per navngitt ansatt bør dere ikke vise.** Juryen har (ifølge planens eget anslag) en advokat og en etisk hacker, og arbeidsmiljøloven og GDPR begrenser overvåking av ansatte. Planens eget salgspoeng var at «kameraet peker på hyller og ikke på folk». Hold dere til lokasjon, leverandør og skift.

### Alternativ G: Plukk med stemme og kontrollsiffer

**Brukerflyt.** Stemmen sender plukkeren til en hylle. Plukkeren sier kontrollsifferet på hyllemerket, plukker, sier antallet og melder fra hvis det mangler varer. En mangel ved plukk utløser straks en telling av den hylla.

**Hva stemmen gjør best.** Dette er der stemmen er mest bevist. Leverandørcaser viser **25–93 % færre feil** ([MMH / Jordano's](https://www.mmh.com/article/voice_accuracy_reaches_99.995_following_voice_implementation); [Inbound Logistics / eBay Enterprise](https://www.inboundlogistics.com/articles/on-your-mark-headset-go/)). Én fagfellevurdert studie fant at plukk med stemme var bedre enn plukk med håndterminal ([de Vries m.fl. 2016](https://econpapers.repec.org/RePEc:taf:tprsxx:v:54:y:2016:i:8:p:2260-2274)).

**Problem 1, 2 og 3.**
- (1) Bedre presisjon ved plukk.
- (2) Logger plukket der det skjer, med tid og sted.
- (3) Passer på lager, men dårlig i butikk.

**Gjenbruk og nytt (anslag 16–24 t).** Krever plukklister, et kontrollsiffer per hylle, fire verktøy som skriver, og **en endring i kjernemodellen**, fordi `forklar`/`lagreForslag` i dag antar plukk ut fra åpne ordrer.

**Svakheter og risiko.** For stort til helgen. Kontrollsifre blir også lært utenat og må byttes ut med jevne mellomrom ([Vocollect-patent US 8,868,519](https://patents.justia.com/patent/8868519)). Nevn det som «neste steg» i pitchen.

### Kameraet som valgfri hjelper (kombinasjon, anslag 2–4 t)

Alt fra kameraløsningen kan gjenbrukes (`velgTeller`, `/api/tell`, kameraet, `Forslag` med `sikkerhet`). Den kan få to nye roller:

- en knapp «Foreslå tall med kamera» i blindtellingen
- «bekreft med bilde» når blindtellingen og loggen er uenige

Da blir kameraet et vitne og ikke selve telleren. Det passer med notatenes konklusjon om at bilder egner seg til å bekrefte et avvik på én hylle, men ikke som hovedmetode.

---

## 3. Poeng for hvert alternativ

Skala 1–5, der 5 er best. **Alle poengene er vår vurdering**, basert på notatene over og ikke målt.

| Alternativ | Presisjon | Forklarer hvor svinnet skjer | Passer i butikk | Passer på lager | Kan bygges innen søn 12 | Styrken til stemmen | Verdi for Holio | Wow for juryen | **Sum** |
|---|---|---|---|---|---|---|---|---|---|
| A Blindtelling, skanner + stemme | 5 | 2 | 4 | 5 | 4 | 5 | 4 | 4 | **33** |
| B Telleliste ut fra risiko | 2 | 3 | 5 | 5 | 5 | 4 | 5 | 3 | **32** |
| C Avviksdetektiv | 3 | 5 | 4 | 5 | 3 | 5 | 5 | 5 | **35** |
| D Skannekontroll ved mottak | 5 | 4 | 3 | 5 | 4 | 3 | 4 | 2 | **30** |
| E Butikkmodus, rask sjekk | 4 | 2 | 5 | 2 | 5 | 4 | 3 | 3 | **28** |
| F Mønstre (ikke per ansatt) | 1 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **28** |
| G Plukk med stemme | 4 | 3 | 1 | 5 | 1 | 5 | 4 | 4 | **27** |
| *Dagens kameratelling (til sammenligning)* | 2 | 1 | 2 | 3 | 5 (finnes) | 2 | 3 | 4 | *22* |

Vi fant ingen studie som måler alle tre problemene for én metode. Notatet om metoder konkluderer også med at **ingen enkelt metode klarer alle tre**. A gir presisjon, C gir forklaringen, og B sørger for at tiden i butikken går til de få varene som mest sannsynlig er feil. Derfor anbefaler vi en kombinasjon.

---

## 4. Anbefaling: «Svinnjakt» = B → A → C, med kamera som vitne

### Hovedidé

**Signalene bestemmer hva som telles → stemmen leder en blind skannetelling → et avvik gir omtelling og deretter et spor gjennom loggen.**

Det er tre grunner til denne kombinasjonen:

- Den svarer på alle tre problemene, og ordrett på utfordring 7: «Finn hyllene med avvik» (B), «tell» (A) og «hvorfor stemmer ikke tallene» (C).
- Stemmen har tre ekte jobber i stedet for å være pynt: den **prioriterer** (B), **leder og holder fasiten skjult** (A), og **forklarer** (C).
- Den treffer et tomrom i markedet. Småbedrift-verktøy stopper ved godkjenning av avviket. Verktøy som forklarer avvik er bare for store kjeder og prises på forespørsel. Holio WMS koster **fra 3 990 kr/mnd** og har OPS-appen på Android ([holio.ai](https://holio.ai/software/wms/)). Et tillegg i OPS bruker skannerne kundene allerede har, så det trengs **null ny maskinvare**.

**Valgfritt i samme flyt:** kamera som vitne (2–3 t), og skannekontroll ved mottak (D) hvis det blir tid. D gir detektiven bedre data om «hvilket steg».

### Viktige forbehold fra kodenotatet

1. **Mobilappen bruker ikke ElevenLabs Agents.** Den bruker ElevenLabs tale-til-tekst (Scribe) og tekst-til-tale rundt Claude med verktøy. Agenten (WebRTC) finnes bare i webappen. Sjekk reglene for ElevenLabs-premien i dag. Krever de Agents, bør spørsmål-og-svar-delen (B og C) demoes med agenten i webappen, og hvert nytt verktøy må legges inn for hånd i ElevenLabs-dashbordet.
2. **Blindtelling krever en egen agentmodus.** Den trenger en egen systemprompt og et begrenset sett verktøy (`neste_lokasjon`, `registrer_telling`). `hent_beholdning`, `hent_logg` og `vis_kort(vare)` røper forventet antall. Test dette: prøv å lure assistenten til å si fasiten.
3. **Verktøy som skriver er nytt.** Webhook-ruten kjører `hentState` og kan bare lese. `registrer_telling` må gå gjennom `endreState`, og prinsippet «ingenting lagres før brukeren trykker Lagre» bør beholdes. La stemmen *foreslå*, og la brukeren bekrefte.
4. **Testdataene må bygges på nytt med en svinnhistorie.** Det trengs flere hyller, t-skjorter i S/M/L, retur- og flyttehendelser, en innkjøpsordre som bare er delvis levert og ett tydelig spor. Planen og README beskriver fortsatt B3/PO-2291, mens koden har T1/PO-3001. Bestem én historie og regn den ut for hånd.
5. **Ingen analyse per ansatt.** Bruk skift, hylle og leverandør. Si det høyt i pitchen: «Vi peker på steg og hyller, ikke på folk.»
6. **Demomanuset må endres.** «Ingen skannet en eneste strekkode» snur nå budskapet. Forslag: *«Skanneren dere allerede har, pluss stemmen, finner hvor og når svinnet skjer. Det passer rett inn i Holio Ops.»*
7. **Ting som ikke er testet:** strekkodelesing i `expo-camera`/Expo Go, og Zebra DataWedge som tastatur mot et `TextInput`. Ha telefonens tastatur som reserve.

### Demo på 2 minutter (forslag)

**0:00** Lederen: «Hylla, hvor skal vi telle i dag?» Stemmen svarer med tre hyller og en grunn for hver. Kortet viser listen.

**0:25** Medarbeideren går til B3. Hun skanner hyllemerket og én svart M og sier «fire». Skjermen viser ingen fasit. Stemmen: «Det stemmer ikke. Tell en gang til.» Hun sier «fire» igjen, og avviket på −2 blir lagret som mulig svinn. Samtidig ser systemet at svart L har +1: «Én er trolig en byttefeil.»

**1:10** Lederen: «Hvorfor mangler det?» Tidslinjen bygger seg opp, og stemmen peker på én hendelse i vinduet mellom to tellinger, for eksempel en retur som aldri ble satt på plass.

**1:45** Avslutningslinjen (punkt 6 over) og «loggen er fasiten».

### Byggerekkefølge fra nå (lørdag kveld) til søndag 12:00

*Anslag:* Fra ca. 18:00 lørdag til 12:00 søndag, med søvn, har tre byggere ca. **25–30 persontimer**. Det dekker felles grunnlag (6) + B (10) + A (12) i kjernen. C må være light-versjonen, og kameraknappen tas bare hvis det blir tid. Den fulle kombinasjonen er anslått til ca. 39 timer, og det er for mye.

| Tid | A (app og skjerm) | B (stemme og KI) | C (data og API) | D (pitch og demo) |
|---|---|---|---|---|
| Lør 18–19 | Alle: bestem svinnhistorien og manuset. Frys historien på papir. | | | Skriv historien som en tabell over hendelser med riktige tall. |
| Lør 19–21:30 | Blindtellingsskjerm: skjult felt for skanneren, reserve med tastatur/kamera, ingen fasit | Blind-prompt og begrenset verktøysett. Tolke norske tallord | Nye testdata + `ean` + hendelsestypene `retur`/`flytting` + `POST /api/tell/manuell` | Ny pitch: problem → tall → flyt. Ny avslutningslinje |
| **Lør 21:00 status** | Felles test: skann → tall → `Resultat` | | | |
| Lør 21:30–23:30 | Koble til `Resultat` og lagring. Omtelling ved avvik (H) | `registrer_telling` via `endreState`, legges inn i dashbordet. Sjekk premiereglene for Agents | `risikoListe()` + `GET /api/telleliste` + `hent_telleliste` | Lysbilde om sikkerhet og personvern (steg og hyller, ikke folk) |
| **Lør 23:30 (M3)** | Ende til ende: liste → blindtelling → avvik lagret | | | Første prøve på demoen |
| Søn 08–10 | Kortet «Tell disse i dag» + tidslinjekort (`logg`) | Fortellerprompt for sporet. Test at fasiten ikke røpes | `sporAvvik()` light (bare tidsvinduet og hendelsene) + `spor_avvik` | Tidtaking av manuset, svar på juryspørsmål |
| Søn 10–11 | Hvis det blir tid: knappen «Foreslå tall med kamera» | Finpuss stemmen og reservesvar (`demoSvar`) | Sjekk testdataene mot manuset tall for tall | Ta opp en reservevideo av demoen |
| Søn 11–12 | Bare feilretting. **Kodefrys 12:00** | | | Full generalprøve |

**Rekkefølge for kutt hvis dere henger mer enn én time etter** (samme regel som i planen): først kameraknappen, så skannekontroll ved mottak (D), så agentverktøyene i A (bruk trykk-og-snakk), og til slutt C ned til bare «når». B og A er kjernen og kuttes ikke.

## Konklusjon

Det viktigste skiftet er ikke fra kamera til skanner. Det er **fra å telle hyller til å følge varer gjennom loggen**. Et avvik er bare et symptom. Verdien ligger i tidsvinduet og steget der det oppstod. Tallene peker samme vei: saldoene er feil for de fleste varene, feilene går begge veier, og varetypen betyr mer enn butikken. Altså er det prosessene som lekker, og ikke bare tyver som stjeler. Det betyr også at Hylla allerede har den viktigste delen, prinsippet om at «loggen er sannheten». Det som mangler er ikke bedre øyne, men flere registrerte steg og en stemme som kan forklare dem.

For Holio er dette en realistisk produktvei. OPS har plukk og mottak, men ingen dokumentert telling. Et tillegg som teller blindt med skanneren kundene har, og som svarer «hvorfor» på norsk, fyller et hull mellom billige telleapper og dyre verktøy for store kjeder. Den største usikkerheten er ikke teknikken, men om testdataene og sporingen stemmer helt foran juryen. Og om Holio faktisk har loggdata på hendelsesnivå (retur, plukkmangel, flytting). Det bør dere spørre Holio om allerede i kveld.
