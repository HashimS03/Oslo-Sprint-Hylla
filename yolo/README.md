# YOLO-teller (valgfri)

Hylla teller med Claude som standard. Denne mappen er et ekstra spor hvis dere vil prøve YOLO fra Ultralytics.

YOLO kan ikke telle t-skjorter ut av boksen. Den må trenes på bilder av deres egne varer:

1. Ta 50–150 bilder av hyllene med varene på, fra litt ulike vinkler og lys.
2. Merk hvert plagg (hver brettet t-skjorte i stabelen) med en boks i for eksempel Roboflow eller CVAT. Klassenavnet skal være SKU-en, f.eks. `TS-BLK-M`.
3. Tren: `yolo detect train data=data.yaml model=yolo11n.pt epochs=60 imgsz=1024`
4. Kopier `runs/detect/train/weights/best.pt` hit som `hylla.pt`.
5. Start tjenesten: `pip install -r requirements.txt && YOLO_TOKEN=<lang hemmelig streng> uvicorn app:app --port 8000`
6. I appen: `YOLO_URL=http://localhost:8000`, `YOLO_TOKEN=<samme streng>` og `HYLLA_TELLER=yolo`.

Lag en token med `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
Sjekk at tjenesten lever: `curl http://localhost:8000/helse`

Tjenesten svarer i samme format som Claude-telleren (`TelleResultat` i `src/lib/types.ts`), så resten av appen er lik.

## Sikkerhet

- **Bare egne vekter:** `.pt`-filer er «pickle»-filer. Å laste en kan kjøre vilkårlig kode på maskinen.
  Last bare vekter dere har trent selv (`YOLO_MODELL`), aldri en fil lastet ned fra fremmede.
- **Token:** Når `YOLO_TOKEN` er satt, krever `POST /tell` headeren `Authorization: Bearer <token>`,
  ellers svarer tjenesten 401. Uten token er den åpen (greit lokalt, og den skriver en advarsel ved oppstart).
  `GET /helse` er alltid åpen.
- **Bilder:** Bare `data:image/jpeg|png|webp;base64,…`, maks ca. 8 MB og 40 millioner piksler, maks 50 varer.
  Ugyldig bilde gir 400 med `{"feil": "..."}`. Modellen teller ett bilde om gangen.
- **ngrok:** Må tjenesten nås fra internett (`ngrok http 8000`), sett alltid `YOLO_TOKEN`, og beskytt gjerne
  ngrok-adressen i tillegg med en «traffic policy». Legg den aldri ut åpen.

## Avhengigheter

`requirements.txt` har faste versjoner (Ultralytics hadde en ondsinnet utgave på PyPI i desember 2024).
Vil dere låse alt med hasher:

```bash
pip install pip-tools
pip-compile --generate-hashes -o requirements.lock requirements.txt
pip install --require-hashes -r requirements.lock
```
