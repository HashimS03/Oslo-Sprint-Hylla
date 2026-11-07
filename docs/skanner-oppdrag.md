# Oppdrag fra dashboardet til skanneren

Driftslederen trykker **Send til skanner** på et åpent avvik i dashboardet. Da opprettes et *oppdrag*: «gå til lokasjon T1 og sjekk 1 stk Penn, svart». Skanner-appen henter oppdragene, viser dem til den ansatte og melder tilbake.

Inntil skanneren er koblet på, har avvikssiden en **plassholder** med knapper som gjør det skanneren skal gjøre, så flyten kan vises i demoen.

## Statuser

`sendt` → `mottatt` → `pagar` → `ferdig` (eller `avbrutt` hvis driftslederen trekker det tilbake).

Oppdraget blir `ferdig` av seg selv når avviket avklares, enten fra dashboardet eller fra skanneren.

## API for skanneren

### Hente oppdrag

```
GET /api/oppdrag                    aktive oppdrag (sendt, mottatt, pagar)
GET /api/oppdrag?skanner=Skanner%201  bare de til denne skanneren + de til alle
GET /api/oppdrag?status=alle
```

Svar:

```json
{ "oppdrag": [{
  "id": "o_…", "avvikId": "h_…", "hylle": "T1", "sku": "PENN-SVART",
  "navn": "Penn, svart", "plassering": "hele bordet", "swatch": "#1E1E20",
  "antall": 1, "melding": "Sjekk bak", "til": null,
  "status": "sendt", "statusTekst": "Sendt, venter på skanner",
  "sendt": "2026-11-07T20:09:46.611Z", "oppdatert": "…", "tattAv": null, "svar": null
}]}
```

Hent listen med jevne mellomrom (f.eks. hvert 5. sekund), eller lytt på endringer i `hylla_state` med Supabase Realtime og hent på nytt.

### Melde status

```
PATCH /api/oppdrag/{id}
{ "status": "mottatt", "tattAv": "Ali" }
{ "status": "pagar" }
{ "svar": "Fant 1 bak på hylla" }
```

### Avklare avviket fra skanneren

```
POST /api/avvik/{avvikId}
{ "handling": "funnet" | "salg" | "svinn" }
```

Oppdraget settes da til `ferdig` automatisk.

## Ikke endre

`src/lib/oppdrag.ts`, `src/app/api/oppdrag/**` og typen `Oppdrag` i `src/lib/types.ts` brukes av dashboardet. Trenger skanneren noe mer, si ifra så utvider vi API-et.
