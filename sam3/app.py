"""
SAM 3-teller for Hylla (Meta Segment Anything 3, via Hugging Face transformers).

Start:  pip install -r requirements.txt
        hf auth login            # kontoen må ha fått tilgang til facebook/sam3
        uvicorn app:app --host 0.0.0.0 --port 8001
Appen:  SAM3_URL=http://<maskinen>:8001   (HYLLA_TELLER=sam3 er valgfritt)

Se README.md.
"""
import base64
import io
import os
import time

import torch
from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel
from transformers import Sam3Model, Sam3Processor

from telling import Funn, egne_prompter, lag_resultat, prompt_for

MODELL = os.environ.get("SAM3_MODELL", "facebook/sam3")
TERSKEL = float(os.environ.get("SAM3_TERSKEL", "0.5"))  # sikre funn
LAV_TERSKEL = float(os.environ.get("SAM3_LAV_TERSKEL", "0.3"))  # usikre funn gir «alternativ»

ENHET = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
TYPE = torch.float16 if ENHET == "cuda" else torch.float32

print(f"Laster {MODELL} på {ENHET} …", flush=True)
prosessor = Sam3Processor.from_pretrained(MODELL)
modell = Sam3Model.from_pretrained(MODELL, dtype=TYPE).to(ENHET).eval()
print("SAM 3 er klar.", flush=True)

app = FastAPI()


class Vare(BaseModel):
    sku: str
    nivaa: str = ""
    navn: str = ""
    farge: str = ""
    beskrivelse: str = ""


class Foresporsel(BaseModel):
    hylle: str
    bilde: str  # data-URL
    varer: list[Vare]


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


@app.post("/tell")
def tell(f: Foresporsel):
    start = time.time()
    data = base64.b64decode(f.bilde.split(",", 1)[1])
    bilde = Image.open(io.BytesIO(data)).convert("RGB")
    overstyr = egne_prompter()
    varer = [v.model_dump() for v in f.varer]
    prompter = {v["sku"]: prompt_for(v, overstyr) for v in varer}
    funn = {p: finn(bilde, p) for p in set(prompter.values())}  # én kjøring per unik beskrivelse
    resultat = lag_resultat(varer, funn, prompter, bilde.width, bilde.height, TERSKEL)
    resultat["kommentar"] += f" på {time.time() - start:.1f} s ({ENHET})"
    return resultat
