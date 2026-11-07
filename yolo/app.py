"""
Valgfri YOLO-teller for Hylla (Ultralytics).

Start:  pip install -r requirements.txt && uvicorn app:app --port 8000
Appen:  YOLO_URL=http://localhost:8000 og HYLLA_TELLER=yolo

Modellen må trenes på deres egne varer først. Hver klasse i modellen må hete det samme
som SKU-en i Hylla (f.eks. TS-BLK-M). Se README.md.
"""
import base64
import io
import os
from collections import Counter

from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel
from ultralytics import YOLO

MODELL = os.environ.get("YOLO_MODELL", "hylla.pt")
TERSKEL = float(os.environ.get("YOLO_TERSKEL", "0.35"))

app = FastAPI()
modell = YOLO(MODELL)


class Plass(BaseModel):
    sku: str
    nivaa: str


class Foresporsel(BaseModel):
    hylle: str
    bilde: str  # data-URL
    varer: list[Plass]


@app.post("/tell")
def tell(f: Foresporsel):
    data = base64.b64decode(f.bilde.split(",", 1)[1])
    bilde = Image.open(io.BytesIO(data)).convert("RGB")
    res = modell.predict(bilde, conf=TERSKEL, verbose=False)[0]

    antall: Counter[str] = Counter()
    sikkerheter: dict[str, list[float]] = {}
    for boks in res.boxes:
        navn = res.names[int(boks.cls)]
        antall[navn] += 1
        sikkerheter.setdefault(navn, []).append(float(boks.conf))

    skuer = {v.sku for v in f.varer}
    return {
        "varer": [
            {
                "sku": v.sku,
                "antall": antall.get(v.sku, 0),
                "sikkerhet": round(sum(sikkerheter.get(v.sku, [1.0])) / max(1, len(sikkerheter.get(v.sku, [1.0]))), 2),
                "alternativ": None,
                "merknad": "",
            }
            for v in f.varer
        ],
        "ukjente": [n for n in antall if n not in skuer],
        "bildekvalitet": "ok",
        "kommentar": f"YOLO fant {sum(antall.values())} objekter",
    }
