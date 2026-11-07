"""
SAM 3-teller for Hylla (Meta Segment Anything 3, via Hugging Face transformers).

Start:  pip install -r requirements.txt
        hf auth login            # kontoen må ha fått tilgang til facebook/sam3
        SAM3_TOKEN=<lang hemmelig streng> uvicorn app:app --host 0.0.0.0 --port 8001
Appen:  SAM3_URL=http://<maskinen>:8001 og SAM3_TOKEN=<samme streng>   (HYLLA_TELLER=sam3 er valgfritt)

Se README.md.
"""
import io
import logging
import os
import threading
import time

import torch
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from transformers import Sam3Model, Sam3Processor

from sikkerhet import MAKS_BASE64, MAKS_PIKSLER, MAKS_VARER, UgyldigBilde, les_data_url, token_ok
from telling import Funn, egne_prompter, lag_resultat, prompt_for

MODELL = os.environ.get("SAM3_MODELL", "facebook/sam3")
REVISJON = os.environ.get("SAM3_REVISION") or None  # fast commit på Hugging Face (commit-hash)
TERSKEL = float(os.environ.get("SAM3_TERSKEL", "0.5"))  # sikre funn
LAV_TERSKEL = float(os.environ.get("SAM3_LAV_TERSKEL", "0.3"))  # usikre funn gir «alternativ»
TOKEN = os.environ.get("SAM3_TOKEN") or None

Image.MAX_IMAGE_PIXELS = MAKS_PIKSLER  # stopper «dekompresjonsbomber» (liten fil, enormt bilde)
logg = logging.getLogger("uvicorn.error")
if not TOKEN:
    logg.warning("SAM3_TOKEN er ikke satt: alle som når tjenesten kan bruke den. Greit lokalt, aldri på nett.")

ENHET = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
TYPE = torch.float16 if ENHET == "cuda" else torch.float32

print(f"Laster {MODELL} ({REVISJON or 'siste versjon'}) på {ENHET} …", flush=True)
prosessor = Sam3Processor.from_pretrained(MODELL, revision=REVISJON)
modell = Sam3Model.from_pretrained(MODELL, dtype=TYPE, revision=REVISJON).to(ENHET).eval()
modell_laas = threading.Lock()  # bare én telling om gangen på skjermkortet
print("SAM 3 er klar.", flush=True)

app = FastAPI()


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


class Vare(BaseModel):
    sku: str = Field(max_length=100)
    nivaa: str = Field(default="", max_length=100)
    navn: str = Field(default="", max_length=200)
    farge: str = Field(default="", max_length=100)
    beskrivelse: str = Field(default="", max_length=500)


class Foresporsel(BaseModel):
    hylle: str = Field(max_length=100)
    bilde: str = Field(max_length=MAKS_BASE64)  # data-URL
    varer: list[Vare] = Field(max_length=MAKS_VARER)


@app.get("/helse")
def helse():
    return {"ok": True, "modell": MODELL, "enhet": ENHET}


@torch.inference_mode()
def finn(bilde: Image.Image, prompt: str) -> list[Funn]:
    inn = prosessor(images=bilde, text=prompt, return_tensors="pt").to(ENHET)
    if "pixel_values" in inn:
        inn["pixel_values"] = inn["pixel_values"].to(TYPE)
    res = modell(**inn)
    svar = prosessor.post_process_instance_segmentation(
        res, threshold=LAV_TERSKEL, mask_threshold=0.5, target_sizes=inn.get("original_sizes").tolist()
    )[0]
    return [Funn(float(s), *map(float, b)) for s, b in zip(svar["scores"], svar["boxes"])]


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
    start = time.time()
    try:
        bilde = les_bilde(f.bilde)
    except UgyldigBilde as e:
        return JSONResponse({"feil": str(e)}, status_code=400)
    overstyr = egne_prompter()
    varer = [v.model_dump() for v in f.varer]
    prompter = {v["sku"]: prompt_for(v, overstyr) for v in varer}
    with modell_laas:
        funn = {p: finn(bilde, p) for p in set(prompter.values())}  # én kjøring per unik beskrivelse
    resultat = lag_resultat(varer, funn, prompter, bilde.width, bilde.height, TERSKEL)
    resultat["kommentar"] += f" på {time.time() - start:.1f} s ({ENHET})"
    return resultat
