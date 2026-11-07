"""
Ren tellelogikk for SAM 3-tjenesten, uten modell, så den kan testes for seg.

SAM 3 finner alle forekomster av en tekstbeskrivelse («black folded t-shirt»).
Hylla vet hvilke varer som står på hylla og hvor (øverst, nederst, venstre …),
så vi lager én beskrivelse per vare og teller bare funnene i varens del av bildet.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass

# Norsk farge → engelsk (SAM 3 forstår engelske beskrivelser best).
FARGER = {
    "svart": "black", "sort": "black", "hvit": "white", "grå": "grey", "gra": "grey", "rød": "red", "rod": "red",
    "blå": "blue", "bla": "blue", "grønn": "green", "gronn": "green", "gul": "yellow", "brun": "brown",
    "beige": "beige", "rosa": "pink", "lilla": "purple", "oransje": "orange", "marine": "navy",
}

# Varetype (ord i navnet) → engelsk beskrivelse. Første treff vinner, så lengre ord står først.
TYPER = [
    ("hettegenser", "folded hoodie"), ("t-skjorte", "folded t-shirt"), ("tskjorte", "folded t-shirt"),
    ("skjorte", "folded shirt"), ("genser", "folded sweater"), ("bukse", "folded trousers"), ("jeans", "folded jeans"),
    ("shorts", "folded shorts"), ("jakke", "jacket"), ("lue", "beanie"), ("skjerf", "scarf"), ("sokk", "pair of socks"),
    ("vott", "mitten"), ("hanske", "glove"), ("caps", "cap"), ("veske", "bag"), ("eske", "cardboard box"), ("boks", "box"),
]


@dataclass
class Funn:
    score: float
    x1: float
    y1: float
    x2: float
    y2: float


def egne_prompter() -> dict[str, str]:
    """SAM3_PROMPTER kan peke på en JSON-fil {"TS-BLK-M": "black folded t-shirt", ...} som overstyrer."""
    sti = os.environ.get("SAM3_PROMPTER")
    if not sti or not os.path.exists(sti):
        return {}
    with open(sti, encoding="utf-8") as f:
        return {k.upper(): v for k, v in json.load(f).items()}


def prompt_for(vare: dict, overstyr: dict[str, str] | None = None) -> str:
    sku = vare.get("sku", "").upper()
    if overstyr and sku in overstyr:
        return overstyr[sku]
    navn = (vare.get("navn") or "").lower()
    farge = FARGER.get((vare.get("farge") or "").lower().strip(), "")
    if not farge:
        farge = next((en for no, en in FARGER.items() if no in navn.split() or navn.startswith(no)), "")
    type_ = next((en for no, en in TYPER if no in navn), "item")
    return f"{farge} {type_}".strip()


def i_omraade(f: Funn, nivaa: str, bredde: float, hoyde: float) -> bool:
    """Ligger midten av funnet i den delen av bildet varen står?"""
    cx, cy = (f.x1 + f.x2) / 2 / bredde, (f.y1 + f.y2) / 2 / hoyde
    n = (nivaa or "").lower()
    if "øverst" in n or "overst" in n or "topp" in n:
        return cy < 0.5
    if "nederst" in n or "bunn" in n:
        return cy >= 0.5
    if "midt" in n:
        return 0.33 <= cy < 0.67
    if "venstre" in n:
        return cx < 0.5
    if "høyre" in n or "hoyre" in n:
        return cx >= 0.5
    return True


def lag_resultat(varer: list[dict], funn_per_prompt: dict[str, list[Funn]], prompter: dict[str, str],
                 bredde: float, hoyde: float, terskel: float) -> dict:
    """Bygger TelleResultat (samme format som Claude- og YOLO-telleren gir)."""
    ut = []
    totalt = 0
    for v in varer:
        alle = [f for f in funn_per_prompt.get(prompter[v["sku"]], []) if i_omraade(f, v.get("nivaa", ""), bredde, hoyde)]
        sikre = [f for f in alle if f.score >= terskel]
        usikre = [f for f in alle if f.score < terskel]
        antall = len(sikre)
        totalt += antall
        snitt = sum(f.score for f in sikre) / antall if antall else (0.5 if usikre else 0.9)
        sikkerhet = round(min(0.99, snitt) * (0.85 if usikre else 1.0), 2)
        ut.append({
            "sku": v["sku"],
            "antall": antall,
            "sikkerhet": sikkerhet,
            "alternativ": antall + len(usikre) if usikre else None,
            "merknad": f"{len(usikre)} usikre funn ({prompter[v['sku']]})" if usikre else "",
        })
    return {
        "varer": ut,
        "ukjente": [],
        "bildekvalitet": "ok",
        "kommentar": f"SAM 3 fant {totalt} varer",
    }
