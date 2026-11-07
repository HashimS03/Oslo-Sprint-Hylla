# Hylla

AI-lagerassistent for Oslo Sprint (Holio, utfordring #7 Varetelling og svinn).

- **Tell en hylle:** ta ett bilde av hylla med mobilen. Claude teller varene, koden sammenligner med lagerloggen og forklarer endringen som mottak, plukk eller mulig svinn.
- **Spør Hylla:** spør med stemmen og få svar høyt på norsk, med et varekort på skjermen (ElevenLabs, eller nettleserens egen tale som reserve).
- **Kameratelefon:** en telefon på stativ som følger med på en hylle og teller av seg selv når noen har vært der.

Det finnes to klienter: **mobilappen i `mobil/`** (Expo, den vi demoer, se [mobil/README.md](mobil/README.md)) og web-appen i `src/app/`. Begge bruker de samme API-ene i Next.js.

## Kom i gang

```bash
npm install
cp .env.example .env.local   # valgfritt, se under
npm run dev
```

Åpne http://localhost:3000 (best i mobilvisning i DevTools, eller på telefonen).

**Uten nøkler kjører alt i demomodus:** tellingen gir de faste tallene fra demomanuset (B3: 13 → 18 svarte, 16 → 14 hvite), Spør Hylla svarer med enkle regler, og data ligger i minnet. Demoen kan nullstilles under Innstillinger.

| Variabel | Hva den slår på |
|---|---|
| `ANTHROPIC_API_KEY` | Ekte telling av bilder og ekte svar i Spør Hylla (Claude Opus 5.5) |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | Stemmesamtale. Oppsett i [docs/elevenlabs.md](docs/elevenlabs.md) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Lagring som overlever omstart. Kjør [supabase/schema.sql](supabase/schema.sql) først |
| `YOLO_URL`, `HYLLA_TELLER=yolo` | Valgfri YOLO-teller, se [yolo/README.md](yolo/README.md) |

**Mobilappen:** start backenden med `npm run dev`, så `cd mobil && npm install && npx expo start` og skann QR-koden med Expo Go. Detaljer i [mobil/README.md](mobil/README.md).

Kamera på telefonen i web-appen krever HTTPS. Lokalt kan dere bruke `npx next dev --experimental-https` eller deploye til Vercel.

## Hvordan det henger sammen

```
src/
  lib/
    types.ts      Datamodellen (varer, hyller, hendelser, tellinger, innkjøp, ordrer)
    seed.ts       Testdata som passer med demomanuset
    store.ts      Lagring: minne, eller én JSON-rad i Supabase
    lager.ts      All lagerlogikk: beholdning, forslag etter telling, lagring, avvik
    teller.ts     Tellere: Claude (bilde → antall), YOLO og demo
    verktoy.ts    Verktøyene Spør Hylla bruker (felles for Claude og ElevenLabs)
    spor.ts       Tekstversjonen av Spør Hylla (Claude med verktøy)
    visning.ts    Ferdige visningsdata per skjerm (brukes av mobilappen)
    elevenlabs.ts Tale til tekst og tekst til tale for mobilappen
  app/
    page.tsx              Hjem
    tell/                 Velg hylle → kamera → analyse → resultat
    spor/                 Spør Hylla (ElevenLabs eller nettleserens tale)
    logg/, avvik/[id]/    Lagerlogg og avvik med før/etter-bilde
    varer/                Katalog, vare og nytt produkt
    innstillinger/, kameraer/, kamera/   Oppsett og kameratelefonen
    api/                  Route handlers (tell, lagre, spor, stemme, oversikt, hyller, logg, varer …)
mobil/                    Expo-appen (hyllelapp-designet)
```

Viktige prinsipper:

- **Lagerloggen er sannheten.** Beholdningen er alltid summen av hendelsene for en vare.
- **Claude teller bare.** Koden regner ut differansen og forklarer den: en økning dekkes av åpne innkjøp (restlevering), en nedgang av åpne plukkordrer, og resten blir mulig svinn.
- **Ingenting lagres før brukeren trykker Lagre.** Er telleren usikker, spør appen brukeren om det rette tallet.

## Branches

- `main`: den fungerende appen. Ikke push rett hit.
- `Hashim`, `Daniel`, `Mayo`: én branch per person. Hent nytt fra main med `git pull origin main`, og lag en pull request til `main` når noe er klart.
