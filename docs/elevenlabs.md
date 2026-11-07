# Sett opp stemmen (ElevenLabs Agents)

Uten ElevenLabs bruker Spør Hylla nettleserens egen talegjenkjenning og opplesning, og Claude svarer via `/api/spor`. Med ElevenLabs får dere en ekte samtale med norsk stemme.

## 1. Lag agenten

I ElevenLabs: **Agents → New agent → Blank agent**.

- **Språk:** Norwegian. Velg en norsk stemme, og TTS-modellen Flash v2.5.
- **LLM:** Claude (velg den nyeste Opus eller Sonnet som tilbys).
- **First message:** «Hei, hva lurer du på?»
- **System prompt:** lim inn teksten i `SYSTEM_SPOR` fra `src/lib/spor.ts`.

## 2. Verktøy

Legg til disse som **Webhook tools** (POST, JSON-body). URL-en er appens adresse, for eksempel `https://hylla.vercel.app/api/verktoy/hent_beholdning`. Legg til headeren `x-hylla-secret` med samme verdi som `HYLLA_WEBHOOK_SECRET`.

| Navn | Parametre | Beskrivelse |
|---|---|---|
| `finn_vare` | `sok` (string, påkrevd) | Søk etter varer på navn, farge, størrelse eller SKU. Bruk først når brukeren nevner en vare med ord. |
| `hent_beholdning` | `sku` (string, påkrevd) | Hvor mange av en vare som er på lager, totalt og per hylle. |
| `hent_innkjop` | `sku`, `po` (string, valgfrie) | Innkjøpsordrer: bestilt, mottatt, plukket siden og igjen. |
| `hent_logg` | `sku`, `hylle`, `type` (string), `antall` (number), alle valgfrie | Siste hendelser i lagerloggen. |
| `hent_avvik` | ingen | Åpne avvik (mulig svinn). |

Legg til ett **Client tool**:

| Navn | Parametre | Beskrivelse |
|---|---|---|
| `vis_kort` | `type` («vare» eller «avvik»), `id` (SKU eller avvik-id) | Viser et kort på skjermen. Huk av «Wait for response». |

Beskrivelsene ligger også i `VERKTOY` i `src/lib/verktoy.ts`.

## 3. Koble til appen

Sett `ELEVENLABS_API_KEY` og `ELEVENLABS_AGENT_ID` i `.env.local` (og i Vercel). Appen henter et kortlivet token fra `/api/stemme/token`, så nøkkelen aldri når nettleseren.

Webhook-verktøyene må kunne nå appen fra internett. Lokalt kan dere bruke for eksempel `ngrok http 3000`.
