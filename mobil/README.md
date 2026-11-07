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

Uten nøkler i backenden kjører alt i demomodus. På tellingskjermen finnes også «Bruk demotelling» hvis dere ikke har en hylle foran dere.

## Skjermene

| Fil | Skjerm |
|---|---|
| `src/app/(faner)/index.tsx` | Hjem |
| `src/app/(faner)/tell.tsx` | Velg hylle |
| `src/app/tell/[hylle].tsx` | Kamera → Analyserer → Resultat → Lagre |
| `src/app/(faner)/spor.tsx` | Spør Hylla (hold inne og snakk, eller skriv) |
| `src/app/(faner)/logg.tsx` | Logg |
| `src/app/(faner)/varer.tsx`, `vare/[sku].tsx`, `ny-vare.tsx` | Varer, vare og nytt produkt |
| `src/app/avvik/[id].tsx` | Avvik med før/etter |
| `src/app/innstillinger.tsx` | Innstillinger |
| `src/app/kameraer.tsx`, `kamera/[hylle].tsx` | Kameratelefoner og kameramodus |

Felles: `src/components/ui.tsx` (knapper, kort, chips, skjermramme), `src/components/Faner.tsx` (fanelinja), `src/lib/tema.ts` (farger og skrift), `src/lib/api.ts` (kall til backenden).

## Stemme

Når du holder inne mikrofonknappen tar appen opp lyd og sender den til `/api/stemme/sporsmal`. Serveren gjør tale til tekst og tekst til tale med ElevenLabs, og Claude svarer. Svaret spilles av på telefonen.
Uten `ELEVENLABS_API_KEY` på serveren kan dere skrive spørsmålet i stedet, og telefonen leser svaret høyt med sin egen stemme.

## Før dere committer

```bash
npx tsc --noEmit
npx expo lint
```
