# Hylla, mobilappen (Expo)

Appen dere demoer på telefonen. Den bruker Next.js-appen i rotmappa som backend, og ser ut som hyllelapp-skissene.

## Kjør den

1. Start backenden i rotmappa (en egen terminal):

   ```bash
   npm install
   npm run dev          # http://localhost:3000
   ```

2. Start appen:

   ```bash
   cd mobil
   npm install
   npx expo start
   ```

3. Skann QR-koden med **Expo Go** (iPhone: kameraappen, Android: Expo Go-appen). Telefonen og maskinen må være på samme Wi-Fi.

Appen finner backenden selv: den bruker samme IP-adresse som Expo-serveren, port 3000.
Er backenden et annet sted (f.eks. Vercel), lag `mobil/.env`:

```
EXPO_PUBLIC_API_URL=https://hylla-dere.vercel.app
```

**Ferdig app (release-bygg) krever https.** Bygger dere appen med EAS, må `EXPO_PUBLIC_API_URL` starte med `https://`.
Ellers viser appen en feilmelding i stedet for å sende data ukryptert. `http://` fungerer bare mens dere utvikler med `npx expo start`.

### Ingen PIN

Appen har ingen PIN-kode. Gruppen har bestemt at den ikke trengs, så ikke sett `HYLLA_PIN` på serveren.
Første gang appen åpnes, spør den om fornavnet til den ansatte. Navnet lagres på telefonen (`src/lib/navn.ts`) og vises for driftsleder.

Uten nøkler i backenden kjører alt i demomodus.

### QR-etiketter til demoen

Åpne `http://<server>:3000/api/etiketter` i en nettleser og skriv ut siden. Hver QR-kode inneholder `HYLLA:<SKU>`.

## Skjermene

Scannerappen har ingen faner. Startsiden har store knapper, og hver knapp åpner én skjerm.

| Fil | Skjerm |
|---|---|
| `src/app/index.tsx` | Startsiden (store knapper) og «Hvem er du?» |
| `src/app/scann.tsx` | Scann QR/strekkode → varekort |
| `src/app/vare/[sku].tsx` | Varekort: antall, hylle, oppgaver, «Meld avvik» |
| `src/app/meld-avvik.tsx` | Meld avvik (går bare til dashbordet) |
| `src/app/oppgaver.tsx`, `oppgave/[id].tsx` | Oppgaver fra driftsleder: ta og fullfør |
| `src/app/varer.tsx` | Søk i alle varer |
| `src/app/spor.tsx` | Spør Hylla (hold inne og snakk, eller skriv) |
| `src/app/innstillinger.tsx` | Navn, server og nullstill demo |
| `src/app/takkamera.tsx` | Takkamera: knapper til skjermene under |
| `src/app/skann.tsx`, `sone/[id].tsx`, `kameraer.tsx`, `kamera/[hylle].tsx`, `ny-hylle.tsx`, `ny-vare.tsx` | Takkamera-delen (Daniel) |

Felles: `src/components/ui.tsx` (knapper, kort, chips, skjermramme), `src/components/StorKnapp.tsx` (knappene på startsiden), `src/lib/tema.ts` (farger og skrift), `src/lib/api.ts` (kall til backenden).
Se også `docs/scanner-for-hashim.md` og `docs/scanner-for-daniel.md` i rota.

## Stemme

Når du holder inne mikrofonknappen tar appen opp lyd og sender den til `/api/stemme/sporsmal`. Serveren gjør tale til tekst og tekst til tale med ElevenLabs, og Claude svarer. Svaret spilles av på telefonen.
Uten `ELEVENLABS_API_KEY` på serveren kan dere skrive spørsmålet i stedet, og telefonen leser svaret høyt med sin egen stemme.

## Før dere committer

```bash
npx tsc --noEmit
npx expo lint
```
