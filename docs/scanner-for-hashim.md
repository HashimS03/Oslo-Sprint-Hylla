# Scannerappen: dette må dashbordet vite

**Til:** Hashim (dashbordet). Gi gjerne denne fila til Claude Code eller en annen AI-assistent.
**Fra:** Mayo (scannerappen i `mobil/`). Grenen er `scanner-app` (laget fra main).

Scannerappen er Expo-appen i `mobil/`. Den bruker samme Next.js-API og samme lagring (`hylla_state`) som dashbordet. Det ansatte gjør i appen, havner altså rett i dataene dashbordet leser.

## Oppdrag og oppgaver
Dine oppdrag («Send til skanner») og oppgavene våre vises i **samme liste** i appen. Ingenting i `src/lib/oppdrag.ts`, `src/app/api/oppdrag/**` eller typen `Oppdrag` er endret.

- `GET /api/oppgaver` gir både oppgavene og oppdragene. Oppdragene har sin egen id (`o_…`), `type: "avvik"`, `avvikId` og `prioritet: "hoy"`. Tilbaketrukne oppdrag vises ikke, og ferdige vises i 12 timer.
- **Når den ansatte åpner oppdraget** i appen, blir det `mottatt` (gjennom `oppdaterOppdrag`).
- **«Jeg tar den»** gjør det til `pagar`, med `tattAv` = navnet til den ansatte.
- **«Ferdig → Funnet/Svinn»** kaller `lukkAvvik()`, som setter oppdraget til `ferdig` slik du har laget det.
- Bruk gjerne **oppdrag for avvik** (det har du allerede) og **`POST /api/oppgaver` for alt annet**, som påfyll og rydding. Oppgaver med `avvikId` virker fortsatt, men du trenger dem ikke.
- Scann finner nå varer også via `Vare.strekkode`, som Daniel kobler med `/api/skanner/koble`.

## Kort fortalt
1. **Avvik fra ansatte kommer automatisk inn på avvik-siden din.** De er vanlige `mulig_svinn`-hendelser med `avvik.status = "apen"`, og `apneAvvik()` finner dem allerede. Du trenger ikke endre noe for at de skal vises.
2. **Oppgaver er nytt.** Dashbordet bestemmer hvilke oppgaver de ansatte får, gjennom `POST /api/oppgaver`. Appen kan ikke lage oppgaver selv.
3. **PIN er fjernet.** Ikke sett `HYLLA_PIN`, verken lokalt eller på Vercel.

## Hva som ble endret i delt kode
Bare tillegg. Ingenting er fjernet eller har fått nytt navn.
- `src/lib/types.ts`:
  - `Hendelse` har fått de valgfrie feltene `meldtAv?: string` (navnet til den ansatte) og `notat?: string` (fritekst).
  - `State` har fått `oppgaver?: Oppgave[]`. Den er valgfri, så eldre lagrede tilstander fortsatt virker.
  - Nye typer: `Oppgave`, `OppgaveStatus` og `OppgaveType`.
- Ny fil `src/lib/oppgaver.ts` med all logikk for oppgaver og avviksmeldinger.
- Nye API-ruter: `src/app/api/oppgaver/`, `oppgaver/[id]/`, `meld-avvik/`, `skann/[kode]/` og `etiketter/`.
- **Ikke rørt:** sidene dine, `Nav.tsx`, `dash.tsx`, `ui.tsx`, `globals.css`, `lager.ts`, `store.ts`, `rapport.ts`, `format.ts`, `/api/avvik/[id]`, `/api/innstillinger`, `/api/demo/nullstill` og `/api/rapport`.

```ts
export type OppgaveStatus = "ny" | "pagar" | "ferdig";
export type OppgaveType = "pafyll" | "sjekk" | "avvik" | "annet";
export type Oppgave = {
  id: string;            // "opg_..."
  tittel: string;
  beskrivelse?: string;
  type: OppgaveType;
  hylle?: string;        // f.eks. "T1"
  sku?: string;
  avvikId?: string;      // id-en til en mulig_svinn-hendelse
  prioritet: "hoy" | "normal";
  status: OppgaveStatus; // ny -> pagar (en ansatt tok den) -> ferdig
  opprettet: string;     // ISO
  opprettetAv: "driftsleder" | "ansatt" | "takkamera";
  tattAv?: string;       // navnet til den ansatte
  ferdigTid?: string;
  utfall?: "funnet" | "svinn"; // bare for avvik-oppgaver
};
```

## Slik kommer et avvik fra appen inn
En ansatt scanner en vare, trykker «Meld avvik», velger en grunn og trykker «Send». Appen kaller `POST /api/meld-avvik`, og backenden legger til **én ny hendelse**. Den endrer aldri et antall direkte.

| Grunn i appen | `endring` | `aarsak` (eksempel) |
|---|---|---|
| `mangler` (ser 3, systemet sa 4) | `-1` | `Meldt fra scanner: ser 3, systemet sa 4` |
| `skadet` (2 skadet) | `-2` | `Meldt fra scanner: 2 skadet` |
| `feil_plass` | `0` | `Meldt fra scanner: står på feil plass` |
| `annet` (notat er påkrevd i appen) | `0` | `Meldt fra scanner: annet` |

Hendelsen har alltid `type: "mulig_svinn"`, `avvik: { status: "apen" }` og, hvis de er fylt ut, `meldtAv` og `notat`.

- **Den ansatte ser ikke avviket igjen i appen.** Dashbordet håndterer det, med de vanlige knappene dine (funnet, salg eller svinn via `/api/avvik/[id]`).
- **Forslag:** vis `meldtAv` og `notat` på avvik-siden og avvik-detaljen, for eksempel «Meldt av Mayo: "Boksene var bulkete"».
- Hjelpefunksjonen `avvikFraScanner(state)` i `src/lib/oppgaver.ts` gir alle åpne avvik som er meldt fra scanneren.

## API for oppgaver
Alle rutene svarer med JSON. Ved feil får du `400` og `{ "feil": "melding på norsk" }`.

### `GET /api/oppgaver`
Gir alle oppgavene, sortert. Ikke-ferdige kommer først, med høy prioritet øverst og deretter eldst først. Ferdige kommer til slutt, nyeste først.
```json
{ "oppgaver": [ { "id": "opg_…", "tittel": "Fyll på kaffekopper", "type": "pafyll", "status": "ny",
    "prioritet": "hoy", "hylle": "T1", "sku": "KAFFE-KOPP", "opprettet": "…", "opprettetAv": "driftsleder",
    "vareNavn": "Kaffekopp", "swatch": "#8A5A3B", "hylleNavn": "Bord 1" } ],
  "nye": 3 }
```
- Første gang lista leses (når `state.oppgaver` mangler), legges det inn tre demo-oppgaver. Etter «Nullstill demo» skjer det på nytt.
- `vareNavn`, `swatch` og `hylleNavn` er fylt ut for visning.

### `POST /api/oppgaver`: lag en oppgave (dette er ruten dashbordet skal bruke)
```json
{ "tittel": "Fyll på hylle T1", "beskrivelse": "Hent 10 kopper fra lageret",
  "type": "pafyll", "sku": "KAFFE-KOPP", "hylle": "T1", "prioritet": "hoy" }
```
- Bare `tittel` er påkrevd.
- `type` er en av `pafyll`, `sjekk`, `avvik` og `annet`. Standard er `annet`, eller `avvik` når `avvikId` er satt.
- `prioritet` er `hoy` eller `normal`. Standard er `normal`.
- `sku` og `hylle` må finnes. Hvis du bare gir `sku`, finner backenden hylla selv.
- **Oppgave fra et avvik:** send `"avvikId": "<id til mulig_svinn-hendelsen>"`. Da fylles `sku`, `hylle` og `type: "avvik"` ut automatisk. Avviket må være åpent.
- Svaret er `201` med `{ "oppgave": { … } }`.

### `GET /api/oppgaver/[id]`
Gir én oppgave: `{ "oppgave": { … } }`, eller `404`.

### `POST /api/oppgaver/[id]`: brukes av appen
- `{ "handling": "ta", "navn": "Mayo" }` setter `status` til `"pagar"` og `tattAv` til navnet.
- `{ "handling": "ferdig", "navn": "Mayo" }` setter `status` til `"ferdig"` og fyller ut `ferdigTid`.
- **For avvik-oppgaver** må appen også sende `"utfall": "funnet" | "svinn"`. Backenden kaller da den vanlige `lukkAvvik()` fra `lager.ts`, akkurat som dashbordet gjør. Avviket lukkes, og ved «funnet» legges det inn en motpost, så beholdningen går tilbake.

### Synkronisering mellom dashbord og app
- **Lukker du et avvik i dashbordet, blir den tilhørende oppgaven automatisk ferdig.** `oppgaveListe()` regner en avvik-oppgave som ferdig når avviket ikke lenger er `apen`. Du trenger ikke gjøre noe ekstra.
- Appen henter oppgavene på nytt hvert 15. sekund. Dashbordet ditt henter allerede hvert 10. sekund.

## Andre nye ruter (til informasjon)
- **`GET /api/skann/[kode]`:** slår opp en scannet kode, enten `HYLLA:<SKU>` eller bare SKU-en. Svaret har navn, antall, hylle og åpne oppgaver for varen, men bevisst **ikke** avvik eller historikk. Ukjent kode gir `404`.
- **`GET /api/etiketter`:** en HTML-side med én QR-kode per vare, klar til utskrift. Den kan godt lenkes fra dashbordet, for eksempel en knapp «Skriv ut QR-etiketter» på varesiden.

## Forslag til det du kan bygge i dashbordet
1. **En oppgaveside, for eksempel `/oppgaver`, i menyen:**
   - Lista fra `GET /api/oppgaver`, gruppert som Ny, Pågår (med `tattAv`) og Ferdig (med `ferdigTid` og `utfall`).
   - Skjemaet «Ny oppgave» med tittel, beskrivelse, type, vare (nedtrekk), hylle (nedtrekk) og prioritet, som sender `POST /api/oppgaver`.
2. **Knappen «Lag oppgave til ansatt» på avvik-detaljen**, som sender `POST /api/oppgaver` med `{ tittel: "Sjekk <varenavn> på <hylle>", avvikId }`.
3. **`meldtAv` og `notat`** vist på avvik-lista og avvik-detaljen.
4. **Et tall på oversikten:** for eksempel «Oppgaver i dag: 3 nye · 1 pågår».

## Test
```bash
curl -X POST http://localhost:3000/api/oppgaver -H "content-type: application/json" -d '{"tittel":"Fyll på brus","sku":"BRUS-RED","prioritet":"hoy"}'
curl http://localhost:3000/api/oppgaver
```
- Etter `POST /api/oppgaver` skal oppgaven dukke opp i appen innen 15 sekunder.
- Alle rutene er testet mot minnelagring (22 sjekker): meld avvik, lag oppgave fra avvik, ta, ferdig med «funnet» (beholdningen går tilbake), lukking fra dashbordet (oppgaven blir ferdig) og nullstilling.
