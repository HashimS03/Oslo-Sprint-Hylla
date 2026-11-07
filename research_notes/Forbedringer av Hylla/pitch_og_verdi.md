# Pitch, demohistorie og forretningsramme for Hylla (Holio utfordring 7 + ElevenLabs-premien)

Merk: Tall og påstander med lenke er **fakta fra kilden**. Alt merket **«Vår vurdering»** eller **«Anslag»** er skjønn. Bakgrunnsrapporten `reports/Svinn uten kameratelling.md` er lest og gjentas ikke. Her brukes bare tallene derfra som pitchen trenger.

---

## 1. Hva sier prosjektplanen og README om jury, demo og roller, og hvilke linjer bør endres?

### Takeaway
Planen bygger hele pitchen på «ta ett bilde, og appen sier selv hva som skjedde» og avslutter med «Ingen skannet en eneste strekkode». Den linjen lover mer enn kameratellingen holder, og den utfordrer Holio-sjefen, som selger skanner-appen. Juryen er bred: Holio, AI-produkt, design, data, sikkerhet, jus og gründere. Pitchen må derfor ha én forretningslinje, én sikkerhetslinje og én personvernlinje, i tillegg til demoen.

### Cited Findings (fra prosjektplanen, `C:\Users\muhay\Downloads\hylla-prosjektplan.pdf`, versjon 1, fre 6. nov 2026)
- Undertittel: «En AI-lagerassistent som holder lageret oppdatert fra bilder og svarer med stemme.» Målene er Holio utfordring 7, ElevenLabs-premien og hovedpremien (s. 1).
- «Hvorfor dette kan vinne»: utfordringen er ekte, stemmen er kjernen (ElevenLabs), og demoen har et tydelig øyeblikk der man «legger varer på en hylle, tar ett bilde, og appen sier selv hva som skjedde» (s. 1).
- Ruten som ble valgt: «mobilkameraet er sensoren. Ingen RFID og ingen faste kameraer». Faste kameraer er nevnt som «neste steg» (s. 1).
- Tidsplan: M5 levert søn 14:00, minipitch fra 14:15. Finalen er 5–10 minutter: problem (1 min), live demo (3 min), arkitektur (1), trygghet (1), forretning (1) og spørsmål (s. 9, 12).
- Roller: A App og skjerm, B Stemme og KI, C Data og API, D Pitch, demo og design. D eier rekvisitter, manus, slides, video og kontakten med Holio og juryen. Ferdig når «Pitchen er øvd fem ganger og videoen er klar» (s. 10). *NB: rolleteksten i PDF-en er forskjøvet i layouten. Eierskapet over er tolket ut fra rekkefølgen.*
- Demomanuset (2 min, s. 11):
  - 0:00 problem: «skannes hver vare inn og ut. Likevel stemmer ikke tallene»
  - 0:20 +5 svarte (restlevering PO-2291)
  - 0:40 to hvite tas bort, og appen sier −2 «mulig svinn»
  - 0:55 stemmespørsmål: «Hvor mange av de svarte … har vi igjen?»
  - 1:25 Logg-fanen
  - 1:45 sluttlinjene: «**Ingen skannet en eneste strekkode.** Dette passer rett inn i Holio Ops …» og «I dag er mobilen sensoren. Neste steg er faste kameraer …»
- Juryen ifølge planen (s. 13). Planen kaller dette selv et «anslag ut fra rollene deres på kickoff-lysbildene, ikke noe de har sagt»:
  - Martin Schi Nordvold (Head of Holio)
  - Henrik Lexow og Chris Mansfeldt (AI-produkt og produktmarkedsføring, Opera)
  - Andrea Claussen og Mi Le Hagen (design og digital markedsføring)
  - Pål de Vibe (Principal Data Engineer, Knowit)
  - Daniel Christensen (etisk hacker, Telenor)
  - Nils Holger Koefoed (advokat, Ro Sommernes)
  - August Sandmo (gründer, Vaskeladden)
  - Einar Holt og Oscar Gangstad Westbye (Wybe Robotics)
- Planens forslag til hvordan de treffer juryen: «Loggen er fasiten, og beholdningen er et view», «Nøkler på serveren, token til stemmen, hemmelig header på webhookene», «Kameraet peker på hyller, og bildene kan slettes etter analysen», «Hvem som betaler: tillegg i Holio Ops», og «faste kameraer, eller en robot som tar bildene» (s. 13).
- Åpent spørsmål i planen: «Hvordan bedømmes løsningene, og hvem bestemmer?» (s. 14). Juryens kriterier var altså ikke kjent da planen ble skrevet.
- README: «Claude teller bare. Koden regner ut differansen og forklarer den: en økning dekkes av åpne innkjøp (restlevering), en nedgang av åpne plukkordrer, og resten blir mulig svinn.» Demomodusen bruker B3: 13 → 18 svarte, 16 → 14 hvite (`README.md`, linje 21 og 75). Bakgrunnsrapporten fant at koden bruker T1/PO-3001, mens plan og README bruker B3/PO-2291.

### Inferences (Vår vurdering)
- **Linjer som bør endres:**
  1. «Ingen skannet en eneste strekkode» bør ut. Holio OPS selges på plukk og mottak med håndterminal ([holio.ai/software/wms](https://holio.ai/software/wms/)). Linjen sier indirekte at Holios kjerneflyt er unødvendig, og den inviterer presisjonsspørsmål. Forslag: *«Skanningen dere allerede gjør er loggen. Hylla leser loggen og sier hvilke hyller som bør sjekkes, og hvorfor.»*
  2. Undertittelen «holder lageret oppdatert fra bilder» bør bli *«finner hyllene der tallene ikke stemmer, og forklarer hvorfor, med stemmen»*. Det speiler utfordringsteksten «Finn hyllene med avvik».
  3. «Appen sier selv hva som skjedde» bør bli *«appen foreslår, du bekrefter»*. Det passer med prinsippet om at ingenting lagres før man trykker Lagre, og det tåler spørsmålet om hvor presist det er.
  4. «Neste steg er faste kameraer» bør bli *«neste steg: tellelister ut fra risiko i Holio OPS, og flere loggede steg (retur, flytting)»*. Faste kameraer gjør presisjonsproblemet større og vekker personvernspørsmål. Robot-linjen kan beholdes som en kort sidebemerkning til Wybe Robotics.
  5. «−2 hvite = mulig svinn» bør sies som *«mulig svinn: ingen plukkordre, ingen retur, ingen flytting forklarer det. Tell én gang til før vi sier tyveri.»* Det viser at systemet ikke beskylder noen.
- Demoen bruker t-skjorter, som er nettopp den varetypen teamet selv frykter (brettede varer og størrelser). Enten bør demoen holde seg til to tydelige farger i én størrelse, slik planen allerede gjør, eller så bør teamet si begrensningen høyt (se avsnitt 4).
- Avslutningen bør ha ett tall om penger (avsnitt 3), ikke bare teknologi.

### Gaps
- De faktiske vurderingskriteriene for Oslo Sprint og for Holio-premien er ikke kjent fra planen eller fra offentlige kilder (se avsnitt 2). Teamet bør spørre arrangørene direkte i dag.

---

## 2. Offentlig informasjon om Oslo Sprint / BI Startup Village 2026: kriterier, premier og format

### Takeaway
Jeg fant ingen offentlig side for «Oslo Sprint 2026» med kriterier eller premier. Det eneste som finnes er kickoff-materialet som planen viser til. Det finnes heller ingen offisiell ElevenLabs-rubrikk for dette arrangementet. Andre ElevenLabs-hackathons vurderer «fungerende prototype ende til ende», «teknisk dybde/integrasjon» og «stemme i en ekte arbeidsflyt».

### Cited Findings
- Et nettsøk på «Oslo Sprint 2026 hackathon BI Startup Village» ga ingen treff på arrangementet. Det nærmeste var et annet BI-arrangement, «Hackathon Weekend», med premie på 20 000 kr ([luma.com](https://luma.com/jeljwy0y); [NITO](https://www.nito.no/en/kursarkiv/2026/academic/Hackathon-Weekend-Oslo-Students/)). Det er trolig ikke samme arrangement.
- BI Startup Village er BIs gründermiljø på campus Oslo ([bi.no](https://www.bi.no/studere-ved-bi/bi-startup-village/)). DNB ble partner i september 2026 ([bi.no](https://www.bi.no/om-bi/nyheter/2026/09/dnb-blir-partner-i-bi-startup-village/)).
- I en ElevenLabs Worldwide Hackathon (Lisboa) gir juryen 1–5 poeng på fungerende prototype ende til ende, teknisk kompleksitet og integrasjon på tvers av modaliteter, og innovasjon. Bare én modalitet, for eksempel «bare stemme», gir middels poeng ([AI Tinkerers Lisbon](https://lisbon.aitinkerers.org/hackathons/h_vWDCYNJ82Jg/entries)).
- Et annet arrangement har prisen «Best Voice Agent», som går til den beste bruken av stemme i en ekte arbeidsflyt. Der teller riktige utfall 35 % ([luma.com London AI Hackathon](https://luma.com/ja5x0m76)).
- Et eldre ElevenLabs-arrangement hos lablab vurderte «Application of Technology», altså hvor godt modellene er integrert i løsningen ([lablab.ai](https://lablab.ai/ai-hackathons/elevenlabs-ai-audio-challenge)).
- Bakgrunnsrapporten: mobilappen bruker ElevenLabs Scribe (tale til tekst) og TTS (tekst til tale) rundt Claude, mens ElevenLabs Agents bare finnes i webappen (`reports/Svinn uten kameratelling.md`, forbehold 1).

### Inferences (Vår vurdering)
- For ElevenLabs-premien bør stemmen gjøre en **jobb i arbeidsflyten** som skjermen ikke gjør like bra. Den bør prioritere («Hvor skal vi telle i dag?»), lede med hendene fri («tell en gang til») og forklare («hvorfor mangler det?»). Ett spørsmål om hvor mange som er igjen er ikke nok.
- Stemmen bør også kombineres med bilde og data, fordi juryer gir høyere poeng for flere modaliteter. Hylla har dette allerede (bilde + logg + stemme + kort), og det bør sies høyt.
- Hvis premien forutsetter ElevenLabs **Agents**, bør stemmedelen demoes i webappen med agenten, eller så må teamet si tydelig hvilke ElevenLabs-produkter mobilappen bruker. Avklar dette med ElevenLabs-kontakten eller Discord i dag.

### Gaps
- Offisielle vurderingskriterier, premiebeløp og format (lengde på minipitch, live eller video) for Oslo Sprint finnes ikke offentlig. Sjekk kickoff-lysbildene og spør arrangørene.
- Reglene for ElevenLabs-premien ved Oslo Sprint er ikke funnet.

---

## 3. Business case: hva svinn koster en typisk norsk SMB, tidsbesparelse, ærlig ROI og pris som tillegg til Holio

### Takeaway
Et tall på én slide holder: med **0,75–1,4 % svinn** taper en nettbutikk med 20 MNOK i omsetning **150 000–280 000 kr i året** (*eget regnestykke*). Et tillegg til Holio til rundt 990 kr/mnd (*anslag*) må bare redusere svinnet med **4–8 %** for å lønne seg. ROI bør framstilles som «break-even ved få prosent forbedring», ikke som «vi fjerner svinn». Gevinsten er heller ikke bare tyveri. **Saldoer som er feil** (60–65 % av varene) koster oversalg og tapt salg.

### Cited Findings
- Norsk svinn har historisk ligget på **ca. 0,75–0,83 % av omsetningen** i Checkpoint-målinger, ifølge omtale ([Security Today](https://securitytoday.com/articles/2014/11/06/global-retail-theft-barometer-study-finds-shrink-cost-retailers.aspx), via bakgrunnsrapporten).
- Ifølge SNL var svinnet **1,4 % av omsetningen, ca. 4 mrd kr i året**, fordelt på butikktyver ca. 46 %, ansatte ca. 23 %, leverandører ca. 6 % og administrative feil 16 %. Tallene kommer fra European Retail Theft Barometer 2003 ([SNL: butikktyveri](https://snl.no/butikktyveri)). *Forbehold: prosentene summerer ikke til 100, og kronebeløpene stemmer ikke med prosentene. Tallene er gamle og bør brukes med forsiktighet.*
- Nyere norske totaltall fant jeg ikke. SSB registrerte **25 642 anmeldte butikktyverier i 2025** ([SSB](https://www.ssb.no/sosiale-forhold-og-kriminalitet/kriminalitet-og-rettsvesen/statistikk/anmeldte-lovbrudd-og-ofre/artikler/flere-anmeldelser-fra-foretak-i-2025)).
- NRF (USA, 2022): tyveri utenfra 36 %, ansatte 29 %, prosess- og kontrollfeil 27 %, ukjent ca. 6 %. Svinn var 1,6 % av salget ([Retail Dive](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/)).
- 60–65 % av varene har feil saldo ([DeHoratius & Raman 2008](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641); [RGIS/ECR](https://rgis.co.uk/industry-perspective/ecr-inventory-accuracy-research-study)). Hos ECR steg salget 4–8 % når saldoene ble rettet ([RGIS/ECR](https://rgis.co.uk/industry-perspective/ecr-inventory-accuracy-research-study)).
- Holio WMS koster **«fra 3 990 kr»** i måneden, og den endelige prisen avhenger av volum og antall lokasjoner. Prisen inkluderer seks moduler, Holio OPS-appen og ubegrenset antall lokasjoner. OPS er en Android-app for håndterminaler med plukk, varemottak, produktredigering og ordrehåndtering. Siden nevner **ikke** varetelling eller syklustelling. Holio har også tilleggsprodukter som Insights, Return Portal, Ordermatch og Purchase Assist ([holio.ai/software/wms](https://holio.ai/software/wms/)).
- Tid og kostnad for syklustelling sammenlignet med full telling: et konsulentselskap anslår 60–100 k USD i året for syklustelling og 120–200 k USD for full telling ved 50 000 SKU, i tillegg til 1–5 dager med stengt lager. Dette er leverandørens egne tall og ikke verifisert ([CPCON Group](https://cpcongroup.com/insights/article/cycle-count-inventory-guide/)). Kildene er enige om at full telling krever stans eller overtid, mens syklustelling ikke gjør det ([Racklify](https://racklify.com/encyclopedia/cycle-counting-vs-full-physical-inventory-which-is-right-for-your-warehouse/)).
- Telling styrt av transaksjonsdata kostet lite i forhold til gevinsten i et felteksperiment ([Chuang, Oliva & Liu 2016](https://econpapers.repec.org/RePEc:bla:popmgt:v:25:y:2016:i:5:p:935-951), via bakgrunnsrapporten).

### Inferences (eget regnestykke og vår vurdering, ikke målt)
- **Eksempelkunde (persona):** en norsk nettbutikk med eget lager og én butikk. Omsetning 20 MNOK, ca. 2 000 SKU, Holio WMS fra 3 990 kr/mnd (= 47 880 kr/år).
  - Svinn på 0,75 % gir **150 000 kr/år**. Svinn på 1,4 % gir **280 000 kr/år**.
  - Tillegget «Hylla for Holio OPS» koster 990 kr/mnd (= 11 880 kr/år, *prisen er vårt anslag*). Break-even krever at svinnet reduseres med **11 880 / 150 000 ≈ 8 %**, eller **≈ 4 %** ved 280 000 kr.
  - **Ærlig formulering i pitchen:** *«Hvis Hylla finner én av tolv tapte kroner, betaler den seg.»* Ikke si «kutter svinnet med X %». Det har vi ingen data for.
- **Tid:** Ikke lov et konkret antall timer spart, fordi vi ikke har norske tall for hvor lang tid en full telling tar. Si heller at det er *«5–10 hyller om dagen, der risikoen er høyest, i stedet for å stenge lageret for full telling»*. Støtten for dette er at målrettet telling har god evidens.
- **Den skjulte gevinsten:** For en nettbutikk koster en feil saldo ofte mer enn selve tyveriet. Oversalg gir kansellerte ordrer og dårlige anmeldelser, og «spøkelsesvarer» gir tapt salg. ECR-tallet på 4–8 % mer salg gjelder store kjeder og kan ikke overføres direkte. Det bør derfor nevnes som et kjent mønster, ikke som en lovnad.
- **Prismodell for Holio:** et tillegg per lokasjon, eller inkludert i en høyere WMS-pakke. Det kjører på håndterminalene og mobilene kunden allerede har (ingen ny maskinvare), og bruker Holios eksisterende logg over mottak og plukk. Det gjør Hylla til en mersalgsvei for Holio, ikke en konkurrent.
- Når de bruker svinnfordelingen, bør teamet si at **tyveri utenfra ikke kan forklares av en logg**. Hylla kan bare snevre det inn til «mulig svinn». Det er troverdig foran advokaten og dataingeniøren.

### Gaps
- Jeg fant ingen norske tall (Virke, NHO eller Handelens Sikkerhetsforum) for svinn som andel av omsetningen etter ca. 2014. Jeg fant heller ingen tall for hvor lang tid en årlig varetelling tar i en norsk SMB.
- Hvilke priser Holio har for tilleggsmoduler er ikke kjent. Spør Martin Schi Nordvold.
- Jeg fant ingen kilde på hvor mye svinn e-handelslagre har, som skiller seg fra fysisk butikk.

---

## 4. Posisjonering: «finner hyllene og forklarer hvorfor» i stedet for «teller fra bilder»

### Takeaway
Flytt verdien fra **øyet (kameraet)** til **hjernen (loggen + forklaringen)**. Hylla er «den som sier hvilke hyller som bør sjekkes i dag, og hvorfor tallet ikke stemmer». Bildetellingen er **en rask sjekk som et menneske bekrefter**. Den er ikke fasiten. Lageret kommer først, butikken etterpå.

### Cited Findings
- Utfordringsteksten fra Holio: «Tallene stemmer ikke. Finn hyllene med avvik, eller tell fra bilder.» (oppgitt av teamet og sitert i planen s. 1). «Finn hyllene» står først.
- Bildegjenkjenning på tette hyller er vanskelig. På SKU-110K-målestokken er resultatet ca. 0,41 mAP ([arXiv 2509.09750](https://arxiv.org/pdf/2509.09750), via bakgrunnsrapporten).
- Varetypen forklarer mer av variasjonen i saldofeil (26,4 %) enn butikken gjør (2,7 %) ([SUFE-sammendrag](https://academicnewsletter.sufe.edu.cn/info/394446)). Klær er verst: 63 % lagernøyaktighet uten RFID ([just-style](https://www.just-style.com/news/rfid-can-help-brands-achieve-near-100-order-accuracy/)).
- I Europa kunne butikkene ikke forklare 51 % av tapet ([Loss Prevention Media](https://losspreventionmedia.com/the-european-road-map-managing-stock-loss-in-the-retail-sector/)).
- Småbedrift-verktøy stopper ved «tell → se avvik → godkjenn». Hvordan man finner årsaken er overlatt til brukeren ([Shopify Help](https://help.shopify.com//manual/products/inventory/inventory-counts)).
- Holio OPS dekker plukk og varemottak, men ikke varetelling ([holio.ai](https://holio.ai/software/wms/)).

### Inferences (Vår vurdering)
- **Ny én-linjer:** *«Hylla sier hvilke hyller som lyver, og hvorfor. Med stemmen, på skannerne dere allerede har.»* Eller mer nøkternt: *«Hylla finner hyllene der tallene ikke stemmer, og forklarer avviket ut fra loggen.»*
- **Hvordan bildetellingen bør framstilles ærlig:** *«Kameraet gir et forslag på sekunder. Er det usikkert, eller stemmer det ikke med loggen, ber Hylla deg telle én gang til. Ingenting lagres før du trykker Lagre.»* Dette gjør svakheten om til et designvalg: menneske i loopen.
- **Si begrensningen selv før juryen gjør det:** *«Brettede klær i mange størrelser er vanskelig for alle kamera. Der skanner du én enhet for å si hvilken variant det er, og sier antallet.»* Det henger sammen med bakgrunnsrapporten (blindtelling, alternativ A).
- **Lager først:** Holio selger WMS til e-handelslagre. Det er der loggen (mottak/plukk) finnes og der OPS-terminalene er. Butikk kommer som trinn 2 med en «rask sjekk av én vare». Dette svarer på teamets bekymring om at løsningen passer dårlig i butikk.
- **«Hvor skjer svinnet?»:** Si at Hylla snevrer inn **når** (vinduet mellom to tellinger) og **hvilket steg** (mottak, plukk, retur), men ikke **hvem**. «Vi peker på steg og hyller, ikke på folk.»
- Navnet «Hylla» passer godt med «finn hyllene». Ikke bytt navn.

### Gaps
- Ingen målinger av Hyllas egen tellepresisjon på demorekvisittene er dokumentert i det jeg leste. Teamet bør måle for eksempel 10 bilder × riktig/feil i kveld og ha tallet klart som svar til juryen.

---

## 5. Vanskelige juryspørsmål og korte svar

### Takeaway
Hvert jurymedlem har sitt «favorittspørsmål». De sterkeste svarene gjør tre ting: de innrømmer begrensningen, viser sikkerhetsnettet (menneske bekrefter, loggen er fasiten) og peker på et tall eller en kilde.

### Cited Findings (grunnlag for svarene)
- Kontrolltiltak overfor ansatte krever saklig grunn og ingen uforholdsmessig belastning (arbeidsmiljøloven § 9-1). De skal drøftes med og informeres til de ansatte. Datatilsynet håndhever reglene om kameraovervåking ([Arbeidstilsynet, aml. kap. 9](https://prod.arbeidstilsynet.no/regelverk/lover/arbeidsmiljoloven/9); [Veileder om kontroll og overvåking i arbeidslivet](https://www.havtil.no/contentassets/7e03b969a3dc4eb687a9e8fa997fe48b/veileder-om-kontroll-og-overvaking-2019.pdf)).
- ElevenLabs post-call-webhooks autentiseres med HMAC-signatur i headeren `elevenlabs-signature`. ElevenLabs tilbyr EU-residency (api.eu.elevenlabs.io), og «zero retention mode» støttes ikke av alle integrasjoner ([ElevenLabs post-call webhooks](https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks.md); [ElevenLabs CLI](https://github.com/elevenlabs/cli); [Custom channel](https://elevenlabs.io/docs/eleven-agents/customization/integrations/custom_channel)).
- Ifølge planen og README: nøkler bare på serveren, token til stemmen, hemmelig header på webhook-verktøy (`HYLLA_WEBHOOK_SECRET`), PIN (`HYLLA_PIN`) og kallgrense per minutt (plan s. 13; `README.md` linje 35–37). Siste commits: «PIN-kode og HTTPS i release-bygg», «Sikre SAM 3- og YOLO-tjenestene» (git log).
- Stemme i lager er velprøvd. Leverandørcaser viser 25–93 % færre plukkfeil ([MMH](https://www.mmh.com/article/voice_accuracy_reaches_99.995_following_voice_implementation)), og en fagfellevurdert studie fant at plukk med stemme var bedre enn med håndterminal ([de Vries m.fl. 2016](https://econpapers.repec.org/RePEc:taf:tprsxx:v:54:y:2016:i:8:p:2260-2274)).
- Klær uten RFID har 63 % lagernøyaktighet. RFID krever merking av hver vare ([just-style](https://www.just-style.com/news/rfid-can-help-brands-achieve-near-100-order-accuracy/)).

### Svarene (Vår vurdering, formuleringer til øving)
| Spørsmål (sannsynlig spørrer) | Kort svar |
|---|---|
| **«Hvor presis er bildetellingen?»** (Knowit-data, Opera-AI) | «På rekvisittene våre traff den X av 10 bilder [mål i kveld]. Men kameraet er ikke fasiten. Det gir et forslag. Hvis det ikke stemmer med loggen, ber Hylla deg telle én gang til, og ingenting lagres før du bekrefter. Brettede varer i mange størrelser er vanskelig for alle kamera. Der skanner du én enhet for å si hvilken variant det er.» |
| **«Hvordan vet dere at det er svinn og ikke en feil?»** (Holio) | «Det vet vi ikke, og derfor sier vi *mulig* svinn. Koden sjekker først om åpne innkjøp eller plukkordrer forklarer avviket. Bare det som er uforklart blir flagget. Omtrent en fjerdedel av svinn er prosessfeil ifølge NRF, og der kan loggen peke på steget.» |
| **«Personvern og GDPR for bildene?»** (advokat) | «Kameraet peker på hyller, ikke på folk. Bildet sendes til analyse og trengs ikke etterpå. Det som lagres er tallet og hendelsen. Vi lager ingen analyse per ansatt. Hvis det skulle brukes til å kontrollere ansatte, er det et kontrolltiltak etter arbeidsmiljøloven kap. 9 som må drøftes med de ansatte. Derfor viser vi hyller, steg og skift, ikke personer.» *(Si bare «bildene slettes» hvis koden faktisk gjør det. Sjekk dette.)* |
| **«Er stemme og webhooks sikre?»** (etisk hacker) | «Alle nøkler ligger på serveren. Nettleseren får bare et kortlivet token. Webhook-verktøyene krever en hemmelig header, appen krever PIN, og produksjonsbygget bruker bare HTTPS. Verktøyene stemmen kan kalle er lesende. Alt som skriver må bekreftes av en bruker. Kallgrense og utgiftstak er satt.» *(Sjekk at alt dette faktisk stemmer i koden før pitchen.)* |
| **«Hvorfor stemme?»** (ElevenLabs, design) | «Hendene er opptatt med varer, og lederen har ikke tid til tabeller. Stemmen gjør tre jobber: den sier hvor vi skal telle i dag, den ber deg telle en gang til uten å røpe fasiten, og den forklarer hvorfor tallet ikke stemmer. Stemme i lagerarbeid er velprøvd: plukk med stemme gir færre feil i studier.» |
| **«Hvorfor ikke bare strekkode eller RFID?»** (Holio, Wybe) | «Strekkoden er loggen, og den bruker vi! Hylla bygger på skanningen i Holio OPS. RFID gir svært høy presisjon, men krever at hver vare merkes og kostnad per brikke. Det er ofte for mye for en SMB. Hylla bruker det kunden har.» |
| **«Skalerer det?»** (Knowit, gründer) | «Beholdningen er et view over loggen, så den regnes ut og lagres ikke dobbelt. Tellelisten bruker faste regler i koden, ikke en språkmodell per vare. KI brukes bare til bilde og samtale, til rundt 0,5–1 kr per bildeanalyse [planens anslag]. Med 10 tellinger om dagen per lager blir det småpenger.» |
| **«Hvordan kobles det til Holio?»** (Holio) | «Hylla trenger tre ting fra Holio: varer og lokasjoner, innkjøpsordre og mottak, og plukk. Alt dette finnes i WMS-modulene deres. Det blir et tillegg i OPS-appen på de samme terminalene. Spørsmål tilbake: har dere hendelseslogg for retur og flytting?» |
| **«Hvem betaler, og hva koster det?»** (gründer) | «Holio-kunden, som et tillegg. En nettbutikk på 20 MNOK taper 150–280 k i året på svinn. Hylla betaler seg om den finner én av tolv tapte kroner.» |
| **«Hva er ekte og hva er mocket?»** (alle) | «Bildetelling og stemme går live. Lagerdataene er testdata som speiler Holios modell. Vi har ingen ekte kundedata.» Si det rett ut. AngelHack anbefaler å forberede nettopp spørsmålet om hva som er ekte og hva som er mocket ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/)). |

### Gaps
- Jeg har ikke verifisert i koden at bildene faktisk slettes, at webhook-secret håndheves på alle verktøy, eller at token-ruten er kortlivet. Teamet må sjekke dette før de sier det.
- Jeg fant ikke ElevenLabs' dokumentasjon om autentisering av webhook-*verktøy* (server tools) i dette søket. Påstanden om hemmelig header kommer fra planen.

---

## 6. Hva vinner hackathon-pitcher? Live demo, «wow», persona og tall

### Takeaway
Rådene peker samme vei. Bruk **ett problem på én linje** de første 30 sekundene, og gi en **live demo** omtrent halve tiden med ferdig seedede data. Ha **ett minneverdig øyeblikk**, ikke alle funksjonene. Ha en **reservevideo** og øv høyt med tidtaking. Forbered svar på «hvem betaler» og «hva er ekte».

### Cited Findings
- I en 3-minutters slot: ca. 30 sek på problem og løsning, 90 sek på live demo, 30 sek på teknologi og 30 sek på neste steg. Demoen bør være omtrent halve tiden. Bruk seedede data, ikke en tom app. Ta opp en ren kjøring kvelden før. Ha **ett minneverdig øyeblikk** som viser at produktet virker. Åpne med en frustrasjon publikum kjenner igjen. Bruk ordene på det juryen ikke ser (det skjulte tekniske arbeidet). Navngi KI-modellen og hvordan kvaliteten ble sjekket. Forbered svar på hvem brukeren er, hvem som betaler, hva som er ekte og hva som er mocket ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/)).
- Juryer vil se prototypen kjøre, forstå hvor det tunge tekniske arbeidet ligger og høre en troverdig vei til en pilot. En hackathon belønner den fungerende demoen, ikke den rene arkitekturen ingen ser (JetBrains 2026, gjengitt i søkesammendrag; selve siden svarte 403, så den er ikke verifisert direkte: [JetBrains AI blog](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)).
- Lag som prøver å vise alle funksjonene gjør det vanskeligere for juryen å danne et samlet inntrykk. Øv høyt, fordi tiden går fortere enn man tror ([Hack Upstate, Medium](https://medium.com/@hackupstate/8-tips-to-a-successful-hackathon-demo-and-presentation-4d1ae83415ad); [shkspr.mobi](https://shkspr.mobi/blog/2019/11/how-to-present-at-a-hack-day/)).
- Les vurderingskriteriene, og koble hver del av demoen til et kriterium ([Devpost-råd via søkesammendrag](https://medium.com/developer-circles-lusaka/tips-on-how-to-win-an-online-hackathon-on-devpost-c548027e0eae); [HackHCC judging guide](https://hackhcc.gitbook.io/hackhcc-docs/other-resources/submission-and-judging-guide)).
- MLH har en egen mal for juryplan ([MLH guide](https://guide.mlh.com/general-information/judging-and-submissions)), men kriteriene ble ikke hentet.

### Inferences (Vår vurdering: forslag til nytt demomanus, 2 min)
**Persona:** «Kari, lagerleder i en nettbutikk med klær, 2 000 varer, bruker Holio.» Si navnet én gang i starten og én gang på slutten.

| Tid | Si | Gjør / skjerm |
|---|---|---|
| 0:00–0:20 | «Kari skanner hver vare inn og ut i Holio. Likevel stemmer ikke tallene, og hun får vite det først når en kunde har kjøpt noe som ikke finnes. Full telling betyr å stenge lageret.» | Tittel + ett tall: «150–280 k kr/år i svinn for en nettbutikk på 20 MNOK» |
| 0:20–0:45 | Kari spør: «Hylla, hvor skal vi telle i dag?» | Stemmen svarer: «B3 først: restlevering i går og ingen plukk siden.» Kortet viser 3 hyller med grunner. *(Hvis tellelisten ikke er bygget: hopp rett til hylla.)* |
| 0:45–1:15 | «Restleveringen kom. Og noe mangler.» | Ett bilde av B3. Appen sier: «+5 svarte, dekket av restlevering. −2 hvite, ingen plukk forklarer det. Tell én gang til?» Hun bekrefter, og raden blir «mulig svinn». **← wow-øyeblikket: systemet skiller restlevering fra svinn uten at noen skrev noe** |
| 1:15–1:40 | «Hvorfor mangler det?» | Stemmen: «Mellom telling tirsdag og nå: ingen plukk, ingen retur. Det skjedde etter mottak.» Loggen eller tidslinjen vises |
| 1:40–2:00 | «Hylla sier hvilke hyller som lyver, og hvorfor. På skannerne Holio-kundene allerede har. Betaler seg om den finner én av tolv tapte kroner.» | Slide: «Tillegg i Holio OPS» |

- **Ett wow-øyeblikk:** samme bilde gir to ulike svar (restlevering og mulig svinn). Det viser at «koden regner, Claude teller», og at KI-en gjør ekte arbeid. Det andre, valgfrie øyeblikket er «tell en gang til». Ikke ha flere.
- **Live, med reservevideo:** planen har allerede dette (s. 12). Ta opp en ny video med det nye manuset søndag morgen.
- **Ett tall på én slide:** 150–280 k kr/år og «én av tolv kroner». Resten av tallene (60–65 % feil saldo, NRF-fordelingen) bør ligge i Q&A-svarene, ikke på slides.
- **Koble til juryen:** Holio får «tillegg i OPS», AI-produkt får «menneske i loopen», jus får «hyller, ikke folk», sikkerhet får nøkler og webhook-secret, gründer får «én av tolv», og Wybe Robotics får «robot som tar bildet» som neste steg i én setning.

### Gaps
- JetBrains-artikkelen kunne ikke hentes direkte (403). Rådene herfra er gjengitt fra et søkesammendrag.
- Jeg fant ingen empiriske studier (bare praktikerråd) av hva som faktisk avgjør hackathon-juryer, for eksempel live mot video.
