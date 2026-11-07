# Stemme i Hylla: hvordan gjøre den sterkere og mer sentral (ElevenLabs), før kodefrys søndag kl. 12:00

Undersøkt lørdag 7. nov. 2026. Kode lest på branch `Mayo`, ingen filer endret. Tall for byggetimer er **estimater** (merket «Estimat»). Alt annet har kilde.

---

## 1. Hva gjør stemmen i Hylla i dag? (lest fra koden)

### Takeaway
Stemmen er i dag en **spørre-assistent med bare leseverktøy**. Den svarer på «hvor mange / hvor ble det av», men den er ikke koblet til fototellingen og kan ikke endre noe. Webappen bruker en ekte ElevenLabs-agent (WebRTC, webhook-verktøy). Mobilappen tar opp ett lydklipp om gangen: Scribe gjør tale til tekst, Claude svarer, og Flash v2.5 leser opp. Den bruker ikke Agents-plattformen.

### Funn i koden (filstier i repoet)
- **Felles verktøy** (`src/lib/verktoy.ts`): `finn_vare`, `hent_beholdning`, `hent_innkjop`, `hent_logg`, `hent_avvik` og `vis_kort`. Alle er lesende. Den samme `kjorVerktoy()` brukes av Claude-chatten og av ElevenLabs-webhookene.
- **Webhook-rute** (`src/app/api/verktoy/[navn]/route.ts`): ElevenLabs-agenten kaller `POST /api/verktoy/<navn>`. Den er beskyttet med headeren `x-hylla-secret`, og bare når `HYLLA_WEBHOOK_SECRET` er satt.
- **Web-stemme** (`src/app/spor/ElevenLabsStemme.tsx`):
  - Bruker `@elevenlabs/react` ^1.21.1 med `useConversation` og `connectionType: "webrtc"`, og et kortlivet token fra `/api/stemme/token`.
  - Har ett client tool, `vis_kort`, som viser et vare- eller avvikskort på skjermen.
  - Tekst kan sendes inn i samtalen med `sendUserMessage`, så den er allerede delvis multimodal.
  - Bruker **ikke** `sendContextualUpdate`, `dynamicVariables` eller overrides.
- **Agentoppsett** (`docs/elevenlabs.md`): Settes opp manuelt i dashbordet. Språk norsk, TTS Flash v2.5, LLM Claude, systemprompten er `SYSTEM_SPOR`, førstemelding «Hei, hva lurer du på?».
- **Systemprompt** (`src/lib/spor.ts`, `SYSTEM_SPOR`): Har allerede «Ikke gjett på antall … bruk verktøyene» og «én til to setninger, med tallet først». Det er et godt grunnlag mot hallusinerte tall. Det finnes ingen regel om å lese tall tilbake eller bekrefte før noe skrives.
- **Mobil-stemme** (`mobil/src/app/(faner)/spor.tsx` og `src/app/api/stemme/sporsmal/route.ts`):
  - Brukeren trykker for å ta opp. `expo-audio` tar opp og sender en multipart-fil til serveren.
  - Serveren kjører Scribe (`scribe_v1`, `language_code: "nor"`), deretter `sporHylla()` (Claude med de samme verktøyene), deretter TTS (`eleven_flash_v2_5`, `language_code: "no"`, standardstemmen `21m00Tcm4TlvDq8ikWAM` hvis `ELEVENLABS_VOICE_ID` mangler).
  - Lyden kommer tilbake som en mp3 data-URL. Hvis noe feiler, leser `expo-speech` opp på nb-NO i stedet.
  - Kommentaren i `src/lib/elevenlabs.ts` sier at dette er valgt «så stemmen fungerer i Expo Go uten egne native moduler».
- **Fototelling** (`src/app/api/tell/route.ts`) gir et *forslag*. Ingenting lagres før `/api/tell/lagre` blir kalt.
- **Avvik kan lukkes** via `POST /api/avvik/[id]` med `handling: "funnet" | "svinn" | "salg"`. Dette er skriveendepunkter som **finnes allerede**, men stemmen kan ikke bruke dem.
- **Mobil-stack** (`mobil/package.json`): Expo ~58, React Native 0.88.1, expo-audio og expo-speech. `@elevenlabs/react-native` er **ikke** installert.

### Inferenser
- Det største gapet for prisen: stemmen ligger på en egen «Spør»-fane og er ikke en del av kjerneløpet (ta bilde → avvik → oppfølging). For å bli sentral må den inn i tellings- og avviksskjermene.
- Skriveendepunktene `/api/tell/lagre` og `/api/avvik/[id]` gjør det billig å lage skriveverktøy. Det trengs bare en tynn wrapper i `kjorVerktoy` pluss bekreftelse.
- Mobilen bruker ikke ElevenLabs Agents. En jury som ser etter «bruk av ElevenLabs» får derfor bare se agenten i webdemoen.

### Gaps
- `/api/tell/lagre` er ikke lest i detalj (payloadformat), og `lukkAvvik` er ikke verifisert utover rutesignaturen.

---

## 2. ElevenLabs Agents-plattformen 2025–2026: hva finnes, og hva er lett å legge til før søndag?

### Takeaway
De billigste og mest synlige gevinstene er innstillinger i dashbordet og små endringer i webkomponenten:
- Bytt TTS til **Eleven v4 Turbo** (ekspressiv, 90+ språk, ~100 ms).
- Legg inn **ASR-keywords** (SKU-er og hyllenavn).
- Legg inn **tool call sounds** og pre-tool speech.
- Send inn **dynamic variables** (antall åpne avvik, hylle) ved oppstart.
- Bruk `sendContextualUpdate` når en fototelling er ferdig.

React Native-SDK-en krever en development build (ikke Expo Go). Det er en reell risiko før kodefrys.

### Cited Findings

**React Native / Expo**
- `@elevenlabs/react-native` installeres sammen med `@livekit/react-native`, `@livekit/react-native-webrtc` og `livekit-client`. Pakken er laget for Expo, men «requires development builds and cannot be used with Expo Go». Den krever RN 0.79+ (eller at Metro er konfigurert for `exports`). — [ElevenLabs React Native SDK](https://elevenlabs.io/docs/agents-platform/libraries/react-native)
- Alle hooks fra React-SDK-en finnes også i RN: `useConversation`, `useConversationControls`, `useConversationClientTool` og flere. — [React Native SDK](https://elevenlabs.io/docs/agents-platform/libraries/react-native)
- Expo-guiden bruker config-pluginene `@livekit/react-native-expo-plugin` og `@config-plugins/react-native-webrtc`. Den sier at native avhengigheter «aren't supported in Expo Go», så man må kjøre `npx expo prebuild --clean` og `npx expo run:ios --device`. Guiden sender også inn plattformen som en dynamic variable. — [Expo React Native guide](https://elevenlabs.io/docs/eleven-agents/guides/integrations/expo-react-native.md)

**Client tools og webhook tools**
- Client tools kjører i klienten. Med «Wait for response» blir returverdien lagt inn i samtalekonteksten, og verdier kan også tilordnes dynamic variables. — [Client tools](https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools)
- `useConversationClientTool` registrerer client tools dynamisk fra en React-komponent, med tilgang til komponentens state. Verktøyet avregistreres når komponenten unmountes. — [React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react)
- Webhook tools kan ha `response_timeout_secs` (standard 20 s).
- `pre_tool_speech` (auto/…) styrer om agenten sier noe før et verktøykall.
- `tool_call_sound` og `tool_call_sound_behavior` spiller ambient lyd mens verktøyet kjører.
- `interruption_mode` erstatter den utgåtte `disable_interruptions`.
- — Kilde for de fire punktene over: [Agents API create](https://elevenlabs.io/docs/api-reference/agents/create.md); [Tool Call Sounds](https://elevenlabs.io/docs/eleven-agents/customization/tools/tool-configuration/tool-call-sounds.md)

**Styre samtalen fra klienten**
- `useConversationControls` gir blant annet `sendUserMessage`, `sendContextualUpdate`, `sendUserActivity` og `sendMCPToolApprovalResult`. — [React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react)
- Dynamic variables: systemvariabler som `system__time` (i konfigurert tidssone, oppdateres hver tur) og `system__conversation_id`. Verktøyrespons kan oppdatere variabler via dot-notation. — [Dynamic variables](https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables)

**Multimodal**
- Agenten kan få filvedlegg (bilder og PDF) i chat, «when the selected model supports image and/or document input». Det slås på under *Multimodal input → Allow file attachments*. — [Multimodal input](https://elevenlabs.io/docs/eleven-agents/customization/multimodal-input.md)

**Workflows**
- Workflows er en visuell graf av noder (for eksempel `override_agent`, altså subagent) og edges med `forward_condition` i naturlig språk («The support request has been resolved.»). Det kan bygges i dashbordet eller via CLI/API. Det finnes også en «Dispatch tool node». — [Workflows](https://elevenlabs.io/docs/eleven-agents/customization/agent-workflows.md)

**Knowledge base**
- Dokumenter som gir agenten domenekunnskap, med egne størrelsesgrenser og RAG. — [Knowledge base](https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base.md)

**Turn-taking og støy**
- `turn_eagerness` (low/normal/…) styrer hvor raskt agenten svarer.
- `soft_timeout_config` gir en fyllfrase etter X sekunder stillhet.
- Det finnes en konfigurerbar melding for støyende miljø (standard «… picking up some noise in the background. Could you move somewhere quieter?»).
- — Kilder: [Conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow.md); [Agents API create](https://elevenlabs.io/docs/api-reference/agents/create.md)
- ASR-`keywords` («Keywords to boost prediction probability for») finnes i agentkonfigurasjonen. — [Agents API create](https://elevenlabs.io/docs/api-reference/agents/create.md)

**TTS-modeller og norsk**
- Flash v2.5: ~100 ms median, 32 språk (la til blant annet norsk). Tekstnormalisering er **av** som standard for v2.5, så tall og datoer kan bli lest rart. ElevenLabs anbefaler at LLM-en normaliserer, eller å bruke `apply_text_normalization` (bare Enterprise for v2.5). — [Models](https://elevenlabs.io/docs/overview/models)
- Eleven v4 Turbo: «most emotive, real-time», ~100 ms, 90+ språk, audio tags. Eleven v3 Conversational: ~165 ms, 70+ språk, audio tags. Norsk («Norwegian (no)») står i språklistene for v4- og v3-familien. — [Models](https://elevenlabs.io/docs/overview/models)
- Expressive mode slås på automatisk når agentens TTS settes til `eleven_v4_turbo`. LLM-en kan da sende tagger som `[laughs]`, `[whispers]` og `[sighs]`. Turn eagerness kan justeres i tillegg. — [Expressive mode](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode.md)
- Agentens normalisering: `text_normalisation_type` er enten `system_prompt` (standard: LLM-en skriver tall som ord) eller `elevenlabs` (ElevenLabs-normalisering etter LLM-en). `elevenlabs` er «more reliable» og beholder tall i transkriptet. — [Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide.md)

**Realtime-modeller**
- «Eleven Realtime» (v1 Mini og v1 Max) er speech-to-speech-modeller der ASR, VAD/turn-taking, LLM og TTS er valgt som én enhet, med verktøykall og 90+ språk. Max «reasons before it responds, for complex instructions and multi-step tool use». — [Models](https://elevenlabs.io/docs/overview/models); [Realtime models](https://elevenlabs.io/docs/eleven-agents/customization/realtime-models.md)
- Begrensninger: workflow-noder kan ikke overstyre managed settings, Max krever en token-grense på minst 1024, og transfer går bare mellom Realtime-agenter. — [Realtime models](https://elevenlabs.io/docs/eleven-agents/customization/realtime-models.md)

**Scribe (tale til tekst)**
- Scribe v2: 90+ språk, keyterm prompting (opptil 1000 termer), entity detection og smart språkdeteksjon. Scribe v2 Realtime: ~150 ms. — [Models](https://elevenlabs.io/docs/overview/models)
- Norsk (nor) ligger i Scribe-kategorien «Excellent (≤ 5% WER)». — [Models (STT-seksjonen)](https://elevenlabs.io/docs/overview/models.md)
- Keyterm prompting finnes for Scribe v2, v2 Medical (batch) og v2 Realtime, og koster ekstra. Grensene er 1000 termer à 50 tegn (batch) og 50 termer à 20 tegn (realtime). — [Keyterm prompting](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/keyterm-prompting.md)

**Guardrails**
- Plattformen har innebygde guardrails: system prompt hardening, manipulation guardrails, content- og custom guardrails, execution mode og exit strategies. — [Guardrails](https://elevenlabs.io/docs/eleven-agents/best-practices/guardrails.md)

### Inferenser: «lett før søndag», rangert (byggetimer er estimater for én utvikler)

| # | Tiltak | Hva | Estimat |
|---|---|---|---|
| A | TTS → **Eleven v4 Turbo**, og norsk stemme fra Voice Library eller Voice Design | Bare dashbord. Gir ekspressiv norsk stemme og demo-«wow». Test uttale av tall først. | 0,5 t |
| B | `text_normalisation_type: elevenlabs` og systemprompt-regel «si tall som ord, les tilbake» | Bare dashbord/prompt. Reduserer feil uttale av tall. | 0,25 t |
| C | ASR-`keywords` med SKU-er, varenavn og hyllenavn («B3», «mottak», «svinn») | Bare dashbord. Mobil: bytt `scribe_v1` → `scribe_v2` og send `keyterms` i `taleTilTekst`. | 0,5 t (web) + 0,5 t (mobil) |
| D | Tool call sound og `pre_tool_speech` på webhook-verktøyene | Bare dashbord. Fjerner stillhet mens verktøyene jobber. | 0,25 t |
| E | `dynamicVariables` ved `startSession` (antall åpne avvik, navn på verste hylle, lager) og en førstemelding som bruker dem | Liten kodeendring i `ElevenLabsStemme.tsx` og `/api/stemme/token` (eller en ny `/api/oversikt`-henting). | 1 t |
| F | `sendContextualUpdate` når fototellingen er ferdig («B3 talt: 11 svarte T-skjorter M, logg sier 14 …») og agenten starter samtalen | Krever at stemmen kan startes fra tellingsskjermen på web. | 2–3 t |
| G | Skriveverktøy (`registrer_aarsak`, `lukk_avvik`, `lagre_telling`) med bekreftelse | Ny case i `kjorVerktoy`, som kaller eksisterende `lukkAvvik` og lagre-logikk. I tillegg webhook-oppsett i dashbordet. | 2–3 t |
| H | RN-SDK i mobilappen (ekte agent på telefonen) | Dev build, LiveKit-plugins og prebuild. Høy risiko med Expo 58 / RN 0.88 og ingen dev build i dag. | 4–8 t, usikkert |
| I | Workflow med subagenter («telle-modus» / «avviks-modus») | Nyttig, men lite synlig i en demo på 3 minutter. | 2–4 t |

### Gaps
- Fant ingen offisiell bekreftelse på at `@elevenlabs/react-native` er testet med Expo SDK 58 / RN 0.88.
- Fant ingen offentlig vurdering av kvaliteten på norsk uttale i v4 Turbo kontra Flash v2.5. Teamet må lytte selv.
- Siden for agentens speech-recognition-innstillinger ga HTTP 403. `keywords` er dokumentert bare i API-referansen.
- Fant ingen ventetall for webhook-runden (ElevenLabs → Vercel → svar) utover standard timeout på 20 s.

---

## 3. Bruksområder for stemme som passer fotoflyten

### Takeaway
Det sterkeste for demoen er en lukket sløyfe: **ta bilde → Hylla sier avviket høyt med en mulig årsak → brukeren sier årsaken («det var en retur») → Hylla leser tilbake og registrerer**. Da blir stemmen kjerneløpet, ikke et tillegg.

### Cited Findings (byggesteinene)
- `sendContextualUpdate` kan gi agenten ny informasjon (for eksempel et telleresultat) uten at brukeren sier noe. — [React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react)
- Client tools kan ta i bruk state fra skjermen, for eksempel det gjeldende tellingsforslaget, via `useConversationClientTool`. — [React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react)
- Dynamic variables og `system__time` gjør det enkelt å lage en morgenbrief i førstemeldingen. — [Dynamic variables](https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables)
- Fil- og bildeinput i agentchat finnes, men bare i chat og bare når LLM-en støtter bilder. — [Multimodal input](https://elevenlabs.io/docs/eleven-agents/customization/multimodal-input.md)

### Inferenser: brukstilfeller (rangert etter effekt på demo og pris; estimatene inkluderer tiltakene i tabellen over)
1. **Stemmeoppfølging etter fototelling** (F + G). Hylla sier for eksempel: «B3: Jeg teller 11 svarte T-skjorter M, loggen sier 14. Tre mangler uten plukkordre. Skal jeg registrere det som mulig svinn, eller var det en retur?» Brukeren svarer, Hylla leser tilbake, og brukeren sier «ja». **4–5 t.**
2. **Morgenbrief** (E). Førstemelding som «God morgen. Tre hyller har avvik i dag, verst er B3 med tre svarte T-skjorter.» Tallene kommer fra dynamic variables, altså ikke fra LLM-en. **1 t.**
3. **Forklare et avvik med årsaker**. Bruk de eksisterende `hent_logg` og `hent_innkjop` og legg til en promptregel: «forklar med de tre siste hendelsene og PO-status». Bare prompt, **0,5 t**.
4. **Bekrefte usikre tellinger med stemmen**. Hvis telleren rapporterer lav konfidens, spør Hylla: «Jeg er usikker på hylle 2, ser du 4 eller 5?» Krever at forslaget har et konfidensfelt. Sjekk dette i `lagForslag`. **1–2 t.**
5. **Håndfri bruk** med mobilen eller skanneren i hånden. Krever en ekte duplex-agent (H) eller push-to-talk, som finnes i dag. Uten RN-SDK: la mobilen bruke dagens push-to-talk, og vis den håndfrie flyten i webdemoen på nettbrett eller laptop. **0 t for demo.**
6. **Skrivehandlinger** (registrer ny telling, lukk avvik som funnet/svinn/salg). Endepunktene finnes allerede. Inngår i G.
7. **Morsomt, men lavere prioritet**: v4 Turbo-tagger (`[sighs]` ved svinn, `[laughs]` når alt stemmer) for personlighet. **0,25 t i prompten.**

### Gaps
- Det er ikke verifisert om tellingsforslaget har et konfidensfelt per vare.

---

## 4. Hva belønner juryer i ElevenLabs-hackathons?

### Takeaway
Kriteriene som går igjen er **impact, teknisk gjennomføring, kreativitet/originalitet og pitch/presentasjon**, pluss «hvor godt ElevenLabs-teknologien er integrert». Det er sannsynlig at det å bruke Agents-plattformen (ikke bare TTS) i kjerneløpet teller under «application of technology». Ingen kilde sier eksplisitt at Agents er et krav.

### Cited Findings
- ElevenLabs x a16z Worldwide Hackathon (Devpost, 2025) har fire kriterier: **Impact** («long-term potential for success, growth and impact»), **Technical implementation**, **Creativity** («innovative and unique») og **Pitches**. Mati Staniszewski (CEO i ElevenLabs) var global dommer. — [Devpost: ElevenLabs Worldwide Hackathon](https://elevenlabs-worldwide-hackathon.devpost.com/)
- ElevenLabs AI Audio Challenge (lablab.ai) har kriteriene **Application of Technology** (hvor godt modellene er integrert), **Presentation** («clarity and effectiveness of the project presentation»), **Business Value** og **Originality**. — [lablab.ai ElevenLabs AI Audio Challenge](https://lablab.ai/ai-hackathons/elevenlabs-ai-audio-challenge)
- ElevenHacks (ukentlige): ifølge søkesnippet fra de offisielle reglene vekter creativity/originality 40 %. Selve siden ga HTTP 429 og ble ikke lest i sin helhet. — [hacks.elevenlabs.io/terms](https://hacks.elevenlabs.io/terms) (bare snippet, ikke verifisert)
- ElevenLabs gir credits og premier til community-hackathons. Siden viser blant annet «AI Voice Agent Hackathon» og «The Agent hackathon», men publiserer ingen felles kriterier. — [ElevenLabs Hackathon](https://elevenlabs.io/hackathon)

### Inferenser
- For Oslo Sprint er de eksakte ElevenLabs-kriteriene ukjente. Optimaliser for det som går igjen: (1) stemmen må gjøre noe nyttig og ikke-trivielt, (2) den må virke live uten å gå i stå, og (3) det må være tydelig i pitchen hvilke ElevenLabs-funksjoner som brukes: Agents, v4 Turbo, Scribe, client tools og contextual updates.
- Én tydelig «stemmeøyeblikk»-scene i demoen (punkt 3.1) gir mer enn mange skjulte funksjoner.

### Gaps
- Fant ingen offentlige kriterier for ElevenLabs-prisen ved Oslo Sprint / BI Startup Village 2026. Spør arrangøren eller ElevenLabs-representanten på stedet.

---

## 5. Fallgruver og mottiltak

### Takeaway
Hovedrisikoene er **tall** (feil uttale, feil gjenkjenning, hallusinasjon), **stillhet mens verktøy kjører** og **støy**. Mottiltak: tall kommer bare fra verktøy, ElevenLabs-normalisering, keywords/keyterms, tilbakelesing før skriving, tool call sounds og lavere turn eagerness.

### Cited Findings
- Flash v2.5 normaliserer ikke tall som standard. Telefonnumre, datoer og valuta kan bli lest feil. — [Models](https://elevenlabs.io/docs/overview/models)
- `text_normalisation_type: elevenlabs` er «more reliable than LLM-based normalization». Med `system_prompt`-normalisering kan LLM-en sende tall skrevet som ord inn i verktøyparametre. Derfor bør forventet format, med eksempel, stå i parameterbeskrivelsen. — [Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide.md)
- Modellene følger spesielt godt med på overskriften `# Guardrails` i systemprompten. — [Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide.md)
- Webhook-timeout er 20 s som standard (`response_timeout_secs`). Tool call sounds fyller stillhet mens verktøyet kjører. — [Agents API create](https://elevenlabs.io/docs/api-reference/agents/create.md); [Tool Call Sounds](https://elevenlabs.io/docs/eleven-agents/customization/tools/tool-configuration/tool-call-sounds.md)
- `turn_eagerness` (low = venter lenger), soft timeout med fyllfrase og en egen melding for støyende miljø finnes. — [Conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow.md); [Agents API create](https://elevenlabs.io/docs/api-reference/agents/create.md)
- Keyterms gjør transkriberingen mer treffsikker på sjeldne ord (for eksempel produktnavn). — [Keyterm prompting](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/keyterm-prompting.md)
- Norsk STT har ≤ 5 % WER i Scribe v2. — [Models](https://elevenlabs.io/docs/overview/models.md)

### Inferenser (mottiltak, med estimater)
- **Tall bare fra verktøy**: finnes delvis i `SYSTEM_SPOR`. Legg til under `# Guardrails`: «Si aldri et antall som ikke kom fra et verktøysvar i denne samtalen.» **0,1 t.**
- **Tilbakelesing før skriving**: «Før du kaller et skriveverktøy, les tilbake hylle, vare og antall, og vent på ja.» Valider også i serverkoden at `bekreftet: true` er satt. **0,5 t.**
- **Hyllenavn og SKU-er**: ASR-keywords (web) og Scribe v2-keyterms (mobil). La `finn_vare` tåle ord som «bé tre» / «B 3» ved å normalisere hylle-ID-en i verktøyet. **0,5–1 t.**
- **Norske tallord** («fjorten» kontra «førti», «tolv» kontra «to»): les tallet tilbake og vis det på et kort (`vis_kort`), så brukeren både ser og hører det. Er dette multimodalt allerede? Ja, delvis.
- **Ventetid**: webhooken går ElevenLabs → Vercel. Hold verktøyene raske (de er det: lesing i minnet). Slå på tool call sound og pre-tool speech. Prøv demoen mot den deployede URL-en, ikke ngrok.
- **Støy i demolokalet**: sett `turn_eagerness` til lav, bruk headset eller rettet mikrofon, og ha tekstinput i reserve (`sendUserMessage` finnes allerede).
- **Fallback**: mobilen faller allerede tilbake til `expo-speech`, og webben har tekstchat. Behold dette.

### Gaps
- Ingen målt norsk WER for korte tallsvar i støy. Teamet bør teste 10 typiske ytringer på stedet.

---

## Samlet anbefaling (rangert etter effekt per time, alt er estimater)

| Rang | Tiltak | Effekt på demo/pris | Timer |
|---|---|---|---|
| 1 | v4 Turbo og norsk stemme, ElevenLabs-normalisering, keywords, tool call sounds, Guardrails-seksjon i prompten (A+B+C+D) | Høy (stemmen låter bedre og feiler sjeldnere) | ~1,5 |
| 2 | Morgenbrief med dynamic variables (E) | Høy (gir et sterkt åpningsøyeblikk i pitchen) | ~1 |
| 3 | Fototelling → `sendContextualUpdate` → stemmen forklarer avviket (F) | Svært høy (stemmen blir en del av kjerneløpet) | 2–3 |
| 4 | Skriveverktøy med tilbakelesing: registrer årsak, lukk avvik (G) | Svært høy (fra «spør» til «gjør») | 2–3 |
| 5 | Mobil: Scribe v2 og keyterms | Middels | 0,5 |
| 6 | RN-SDK eller workflows (H/I) | Middels, høy risiko | 4–8 |

Til sammen gir 1–5 omtrent 7–9 timer for én person, eller omtrent 4 timer fordelt på to. Det er realistisk før søndag kl. 12. RN-SDK-en (6) bør vente til etter kodefrys.
