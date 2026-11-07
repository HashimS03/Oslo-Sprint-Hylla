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
uvicorn app:app --host 0.0.0.0 --port 8001
```

Sjekk at den lever: `curl http://localhost:8001/helse`

Så i `.env.local` i rotmappa:

```
SAM3_URL=http://localhost:8001
```

Når `SAM3_URL` er satt, bruker Hylla SAM 3 til all telling (både mobilen og kameratelefonen).
`HYLLA_TELLER=claude` eller `demo` overstyrer.

Kjører backenden på Vercel, må tjenesten nås fra internett, for eksempel med `ngrok http 8001`.

## Justere

| Variabel | Standard | Hva |
|---|---|---|
| `SAM3_TERSKEL` | `0.5` | Funn med lavere score telles ikke som sikre |
| `SAM3_LAV_TERSKEL` | `0.3` | Funn mellom de to tersklene blir et «alternativ», og appen spør brukeren |
| `SAM3_PROMPTER` | – | Sti til en JSON-fil som overstyrer beskrivelsen per SKU |
| `SAM3_MODELL` | `facebook/sam3` | Modellen på Hugging Face |

Teller den feil på en vare, prøv en bedre beskrivelse i en egen fil:

```json
{ "TS-BLK-M": "black folded t-shirt in a stack", "LU-BLK": "black knitted beanie" }
```

## Test

```bash
python test_telling.py    # tester tellelogikken uten modellen
```
