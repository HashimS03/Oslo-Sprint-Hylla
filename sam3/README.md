# SAM 3-teller

Teller varene på et hyllebilde med Metas [SAM 3](https://github.com/facebookresearch/sam3) (Segment Anything 3).
Hylla sender bildet og listen over varer på hylla. Tjenesten lager en engelsk beskrivelse per vare
(«black folded t-shirt»), lar SAM 3 finne alle forekomster, og teller bare funnene i varens del av bildet
(øverst, nederst, venstre, høyre).

Spør Hylla bruker fortsatt en språkmodell (Claude) eller demosvarene. SAM 3 teller bare.

## Kjør

Trenger Python 3.12 eller nyere. Går raskest med et NVIDIA-skjermkort, fungerer på Mac (Apple Silicon), og er tregt på vanlig CPU.

```bash
cd sam3
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
hf auth login                      # først: be om tilgang på https://huggingface.co/facebook/sam3
export SAM3_TOKEN=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
uvicorn app:app --host 0.0.0.0 --port 8001
```

Sjekk at den lever: `curl http://localhost:8001/helse`

Så i `.env.local` i rotmappa (samme token som over):

```
SAM3_URL=http://localhost:8001
SAM3_TOKEN=<samme lange streng>
```

Når `SAM3_URL` er satt, bruker Hylla SAM 3 til all telling (både mobilen og kameratelefonen).
`HYLLA_TELLER=claude` eller `demo` overstyrer.

## Sikkerhet

- **Token:** Når `SAM3_TOKEN` er satt, krever `POST /tell` headeren `Authorization: Bearer <token>`,
  ellers svarer tjenesten 401. Uten token er tjenesten åpen (greit lokalt, og den skriver en advarsel ved oppstart).
  `GET /helse` er alltid åpen.
- **Bilder:** Bare `data:image/jpeg|png|webp;base64,…`, maks ca. 8 MB og 40 millioner piksler, maks 50 varer.
  Ugyldig bilde gir 400 med `{"feil": "..."}`.
- **Én om gangen:** Modellen teller ett bilde om gangen. Andre forespørsler venter.
- **ngrok:** Kjører backenden på Vercel, må tjenesten nås fra internett, for eksempel med `ngrok http 8001`.
  Sett alltid `SAM3_TOKEN` da, og beskytt gjerne ngrok-adressen i tillegg (en «traffic policy» i ngrok,
  f.eks. som krever headeren eller begrenser IP-er). Legg den aldri ut åpen.

## Avhengigheter

`requirements.txt` har faste versjoner. Vil dere låse alt (også underavhengigheter) med hasher:

```bash
pip install pip-tools
pip-compile --generate-hashes -o requirements.lock requirements.txt
pip install --require-hashes -r requirements.lock
```

Modellen hentes fra Hugging Face. Sett `SAM3_REVISION` til en commit-hash fra
[modellsiden](https://huggingface.co/facebook/sam3/commits/main) for å låse den til akkurat den versjonen.

## Justere

| Variabel | Standard | Hva |
|---|---|---|
| `SAM3_TERSKEL` | `0.5` | Funn med lavere score telles ikke som sikre |
| `SAM3_LAV_TERSKEL` | `0.3` | Funn mellom de to tersklene blir et «alternativ», og appen spør brukeren |
| `SAM3_PROMPTER` | – | Sti til en JSON-fil som overstyrer beskrivelsen per SKU |
| `SAM3_MODELL` | `facebook/sam3` | Modellen på Hugging Face |
| `SAM3_REVISION` | – (siste) | Fast commit-hash for modellen på Hugging Face |
| `SAM3_TOKEN` | – (åpen) | Hemmelig token som Hylla må sende. Sett alltid når tjenesten er på nett |

Teller den feil på en vare, prøv en bedre beskrivelse i en egen fil:

```json
{ "TS-BLK-M": "black folded t-shirt in a stack", "LU-BLK": "black knitted beanie" }
```

## Test

```bash
python test_telling.py    # tester tellelogikken og sikkerhetssjekkene uten modellen
```
