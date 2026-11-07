"""
Valgfri YOLO-teller for Hylla (Ultralytics).

Start:  pip install -r requirements.txt && YOLO_TOKEN=<lang hemmelig streng> uvicorn app:app --port 8000
Appen:  YOLO_URL=http://localhost:8000, YOLO_TOKEN=<samme streng> og HYLLA_TELLER=yolo

Modellen må trenes på deres egne varer først. Hver klasse i modellen må hete det samme
som SKU-en i Hylla (f.eks. TS-BLK-M). Se README.md.

NB: .pt-filer er «pickle» og kan kjøre vilkårlig kode når de lastes. Last bare vekter dere har trent selv.
"""
import io
import logging
import os
import threading
from collections import Counter

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from ultralytics import YOLO

from sikkerhet import MAKS_BASE64, MAKS_PIKSLER, MAKS_VARER, UgyldigBilde, les_data_url, token_ok

MODELL = os.environ.get("YOLO_MODELL", "hylla.pt")
TERSKEL = float(os.environ.get("YOLO_TERSKEL", "0.35"))
TOKEN = os.environ.get("YOLO_TOKEN") or None

Image.MAX_IMAGE_PIXELS = MAKS_PIKSLER  # stopper «dekompresjonsbomber» (liten fil, enormt bilde)
logg = logging.getLogger("uvicorn.error")
if not TOKEN:
    logg.warning("YOLO_TOKEN er ikke satt: alle som når tjenesten kan bruke den. Greit lokalt, aldri på nett.")

app = FastAPI()
modell = YOLO(MODELL)
modell_laas = threading.Lock()  # bare én telling om gangen på modellen


@app.middleware("http")
async def for_stor(request: Request, call_next):
    """Avviser åpenbart for store forespørsler før hele kroppen leses inn."""
    try:
        lengde = int(request.headers.get("content-length") or 0)
    except ValueError:
        lengde = 0
    if lengde > MAKS_BASE64 + 1_000_000:
        return JSONResponse({"feil": "Forespørselen er for stor"}, status_code=413)
    return await call_next(request)


def krev_token(authorization: str | None = Header(default=None)):
    if not token_ok(authorization, TOKEN):
        raise HTTPException(401, "Mangler eller feil token", headers={"WWW-Authenticate": "Bearer"})


class Plass(BaseModel):
    sku: str = Field(max_length=100)
    nivaa: str = Field(default="", max_length=100)


class Foresporsel(BaseModel):
    hylle: str = Field(max_length=100)
    bilde: str = Field(max_length=MAKS_BASE64)  # data-URL
    varer: list[Plass] = Field(max_length=MAKS_VARER)


@app.get("/helse")
def helse():
    return {"ok": True, "modell": os.path.basename(MODELL)}


def les_bilde(data_url: str) -> Image.Image:
    """Data-URL → RGB-bilde, eller UgyldigBilde med en melding til brukeren."""
    data = les_data_url(data_url)
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Image.DecompressionBombError:
        raise UgyldigBilde("Bildet har for mange piksler") from None
    except (UnidentifiedImageError, OSError):
        raise UgyldigBilde("Klarte ikke å lese bildet") from None


@app.post("/tell", dependencies=[Depends(krev_token)])
def tell(f: Foresporsel):  # vanlig def: FastAPI kjører den i en egen tråd, derfor låsen
    try:
        bilde = les_bilde(f.bilde)
    except UgyldigBilde as e:
        return JSONResponse({"feil": str(e)}, status_code=400)
    with modell_laas:
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
