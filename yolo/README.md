# YOLO-teller (valgfri)

Hylla teller med Claude som standard. Denne mappen er et ekstra spor hvis dere vil prøve YOLO fra Ultralytics.

YOLO kan ikke telle t-skjorter ut av boksen. Den må trenes på bilder av deres egne varer:

1. Ta 50–150 bilder av hyllene med varene på, fra litt ulike vinkler og lys.
2. Merk hvert plagg (hver brettet t-skjorte i stabelen) med en boks i for eksempel Roboflow eller CVAT. Klassenavnet skal være SKU-en, f.eks. `TS-BLK-M`.
3. Tren: `yolo detect train data=data.yaml model=yolo11n.pt epochs=60 imgsz=1024`
4. Kopier `runs/detect/train/weights/best.pt` hit som `hylla.pt`.
5. Start tjenesten: `pip install -r requirements.txt && uvicorn app:app --port 8000`
6. I appen: `YOLO_URL=http://localhost:8000` og `HYLLA_TELLER=yolo`.

Tjenesten svarer i samme format som Claude-telleren (`TelleResultat` i `src/lib/types.ts`), så resten av appen er lik.
