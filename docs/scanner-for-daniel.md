# Scannerappen: dette må takkamera-delen vite

**Til:** Ho Daniel (takkameraet). Gi gjerne denne fila til Claude Code eller en annen AI-assistent.
**Fra:** Mayo (scannerappen). Grenen er `scanner-app` (laget fra main).

Vi bygger begge i Expo-appen i `mobil/` og merger delene etterpå. Her står det hvordan appen er satt opp nå, hvilke filer som er mine og hvilke som er dine, og hvordan du kobler takkameraet på.

## Dette er gjort med delen din
Grenen `scanner-app` er laget fra main (med skanner-fanen din). Dette er gjort med delen din:
- **Fanene er borte.** Skjermene dine ligger bak knappen **«Takkamera»** på startsiden, som åpner `src/app/takkamera.tsx`. Der finnes tre knapper:
  - «Plukk og plassering», som åpner skann-skjermen din `src/app/skann.tsx`
  - «Kamerasoner», som åpner `kameraer.tsx`
  - «Lag en hylle», som åpner `ny-hylle.tsx`
- **`skann.tsx` er nesten urørt.** Den har bare fått tittelen «Plukk og plassering» og en tilbakepil, siden det ikke finnes faner lenger. Logikken, varslene, `/api/skanner` og koblingen av ukjente koder er som før.
- **Min Scann (`scann.tsx`) er noe annet enn din `skann.tsx`.** Min slår bare opp en vare og åpner varekortet, og den sender **ingen** skanning til matcheren. Et vareoppslag er ikke et plukk, og det ville gitt falske avvik. Den finner varer via `HYLLA:SKU`, SKU eller `Vare.strekkode`.
- **Dette er slettet:**
  - `avvik/[id].tsx`: ansatte skal ikke se avvik, dashbordet håndterer dem.
  - `(faner)/` og `components/Faner.tsx`.
- **Lint klager på to av filene dine:** `sone/[id].tsx` (setState i useEffect, en feil) og `ny-hylle.tsx` (ubrukt `res`, en advarsel). Jeg har ikke rørt dem.

## Hvordan appen er bygd nå
- **Ingen faner lenger.** Appen bruker vanlig stack-navigasjon (`expo-router`). Startsiden har store knapper, og hver knapp åpner én skjerm.
- **Ingen PIN.** PIN-skjermen og PIN-koden er fjernet helt. `lib/api.ts` sender ingen `x-hylla-secret` lenger.
- **Navnet til den ansatte** spørres om første gang appen åpnes og lagres med `expo-secure-store` (`lib/navn.ts`).
- Backend er den samme Next.js-appen på port 3000 (eller `EXPO_PUBLIC_API_URL`).

```
mobil/src/app/
  _layout.tsx        DELT: Stack med alle skjermene (se under)
  index.tsx          Mayo: startsiden med store knapper + «Hvem er du?»
  scann.tsx          Mayo: QR/strekkode → varekort
  vare/[sku].tsx     Mayo: varekortet
  meld-avvik.tsx     Mayo: meld avvik (går til dashbordet)
  oppgaver.tsx       Mayo: oppgaveliste
  oppgave/[id].tsx   Mayo: én oppgave (ta/ferdig)
  varer.tsx          Mayo: søk i varer
  spor.tsx           Mayo: Spør Hylla
  innstillinger.tsx  Mayo: navn, server, nullstill demo
  takkamera.tsx      DELT: Takkamera-siden med knapper til skjermene dine
  skann.tsx          DANIEL: plukk og plassering mot takkameraet
  sone/[id].tsx      DANIEL
  kameraer.tsx       DANIEL: urørt
  kamera/[hylle].tsx DANIEL: urørt
  ny-hylle.tsx       urørt (kameraer.tsx lenker hit)
  ny-vare.tsx        urørt (kamera/[hylle].tsx lenker hit)
mobil/src/components/
  StorKnapp.tsx      Mayo: den store knappen på startsiden
  ui.tsx, Ikon.tsx, KortVisning.tsx   DELT
mobil/src/lib/
  api.ts             DELT: hent()/send()/sendSkjema(), nå uten PIN
  navn.ts            Mayo: navnet til den ansatte (useNavn, hentNavn)
  useHent.ts         DELT
  useOppdater.ts     Mayo: henter på nytt hvert 15. sekund mens skjermen er åpen
  tema.ts            DELT: lagt til fargene blalys og lillalys
  typer.ts           DELT: lagt til Oppgave, SkannVare og AvvikGrunn nederst
  bilde.ts, format.ts, opplesning.ts  DELT (bilde.ts brukes av kamera-skjermen din)
```

**Slettet fra den gamle appen:**
- `(faner)/`, `tell/`, `avvik/[id].tsx` og `tilgang.tsx`
- `lib/pin.ts`, `lib/tilgang.ts` og `lib/tilgangStatus.ts`
- `components/Faner.tsx`, `HylleTegning.tsx` og `LoggRad.tsx`

**Endret i delt kode, så det du har fortsatt virker:**
- `Skjerm` i `ui.tsx` tar fortsatt imot `fane="..."`, men ignorerer den nå. Fanelinja finnes ikke lenger. `kameraer.tsx` bruker `fane="index"`, og det er greit.
- Avvik-kort i Spør Hylla (`KortVisning.tsx`) lenker nå til varekortet i stedet for `/avvik/[id]`, som er borte.

## Slik legger du til flere takkamera-skjermer
0. **Takkamera-knappen finnes allerede.** Nye skjermer legger du som knapper i `src/app/takkamera.tsx`. Punktene under gjelder bare hvis du vil ha en egen knapp på startsiden.
1. **En knapp på startsiden.** I `mobil/src/app/index.tsx`, inne i `<View style={st.rutenett}>`, legger du til én linje:
   ```tsx
   <StorKnapp tekst="Takkamera" ikon="kamera" farge={F.gullys} onPress={() => router.push("/kameraer")} />
   ```
   - Knappene er halv bredde, eller full bredde med `bred`.
   - I dag er Scann og Spør Hylla brede, mens Oppgaver og Varer deler en rad. En femte halv knapp havner alene på en rad. Gjør den `bred`, eller gjør Spør Hylla halv, så Takkamera og Spør Hylla deler raden.
2. **Registrer nye skjermer** i `mobil/src/app/_layout.tsx` under kommentaren `{/* Takkamera (Daniel) */}`. Der ligger `kameraer`, `kamera/[hylle]`, `ny-hylle` og `ny-vare` allerede.
3. **Typede ruter:** `typedRoutes` er på. Etter at du har lagt til eller slettet en skjerm, starter du `npx expo start` én gang, så lages `.expo/types/router.d.ts` på nytt. Ellers klager `tsc` på `router.push("/ny-sti")`.

## Slik kan takkameraet snakke med resten
Alt går gjennom samme API. Se `docs/scanner-for-hashim.md` for detaljer.
- **Lage en oppgave til de ansatte**, for eksempel når kameraet ser en tom hylle:
  ```ts
  await send("/api/oppgaver", { tittel: "Hylle T1 ser tom ut", type: "sjekk", hylle: "T1", prioritet: "hoy", opprettetAv: "takkamera" });
  ```
  Oppgaven vises da i appen under «Oppgaver» (innen 15 sekunder) og i dashbordet.
- **Et avvik fra en telling** lager du som før gjennom `/api/kamera/ramme` og `lagreForslag`. Det blir en `mulig_svinn` som dashbordet viser. Vil du at en ansatt skal sjekke det, lager du en oppgave med `avvikId`:
  ```ts
  await send("/api/oppgaver", { tittel: "Sjekk BRUS-RED på T1", avvikId: hendelse.id, opprettetAv: "takkamera" });
  ```
  Når den ansatte trykker «Ferdig → Funnet/Svinn», lukkes avviket i dashbordet automatisk.
- **Regelen:** beholdningen er alltid summen av hendelsene. Kameraet skal bare legge til hendelser og aldri endre et antall direkte.

## Når vi merger
- **Bare to filer kan gi konflikter:** `mobil/src/app/_layout.tsx` og `mobil/src/app/index.tsx`. Behold begge sidene: alle `Stack.Screen`-linjene, og knappene dine i rutenettet.
- `lib/api.ts` har ikke PIN lenger. Hvis du har kode som bruker `lesPin`, `sjekkTilgang` eller `useTilgang`, kan du bare ta den bort. Serveren krever ikke PIN.
- **Etter merge:**
  1. I `mobil/`: `npx expo start` (for å lage typene på nytt), så `npx tsc --noEmit` og `npx expo lint`.
  2. Test på telefonen: startsiden, Scann, Oppgaver og Takkamera-knappen.
