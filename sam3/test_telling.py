"""Kjør: python -m pytest test_telling.py   (eller bare: python test_telling.py)"""
import base64

from sikkerhet import MAKS_BASE64, UgyldigBilde, les_data_url, token_ok
from telling import Funn, i_omraade, lag_resultat, prompt_for

B3 = [
    {"sku": "TS-BLK-M", "nivaa": "øverst", "navn": "Svart t-skjorte M", "farge": "svart"},
    {"sku": "TS-WHT-M", "nivaa": "nederst", "navn": "Hvit t-skjorte M", "farge": "hvit"},
]


def test_prompter():
    assert prompt_for(B3[0]) == "black folded t-shirt"
    assert prompt_for({"sku": "HG", "navn": "Hettegenser grå L", "farge": "grå"}) == "grey folded hoodie"
    assert prompt_for({"sku": "LU", "navn": "Lue, sort", "farge": "sort"}) == "black beanie"
    assert prompt_for({"sku": "X", "navn": "Noe rart"}) == "item"
    assert prompt_for(B3[0], {"TS-BLK-M": "black shirt stack"}) == "black shirt stack"


def test_omraade():
    topp = Funn(0.9, 10, 10, 50, 40)
    bunn = Funn(0.9, 10, 600, 50, 640)
    assert i_omraade(topp, "øverst", 100, 1000) and not i_omraade(bunn, "øverst", 100, 1000)
    assert i_omraade(bunn, "nederst", 100, 1000)
    assert i_omraade(bunn, "hele hylla", 100, 1000)


def test_resultat():
    prompter = {v["sku"]: prompt_for(v) for v in B3}
    svarte = [Funn(0.9, 0, 50, 10, 100)] * 18 + [Funn(0.9, 0, 800, 10, 900)]  # én svart nederst telles ikke
    hvite = [Funn(0.8, 0, 700, 10, 800)] * 14 + [Funn(0.4, 0, 700, 10, 800)]  # ett usikkert funn
    r = lag_resultat(B3, {"black folded t-shirt": svarte, "white folded t-shirt": hvite}, prompter, 100, 1000, 0.5)
    svart, hvit = r["varer"]
    assert svart["antall"] == 18 and svart["alternativ"] is None
    assert hvit["antall"] == 14 and hvit["alternativ"] == 15 and hvit["sikkerhet"] < 0.8


def test_token():
    assert token_ok(None, None) and token_ok("noe", "")  # uten token: åpent (lokal utvikling)
    assert token_ok("Bearer hemmelig", "hemmelig")
    assert not token_ok(None, "hemmelig")
    assert not token_ok("Bearer feil", "hemmelig")
    assert not token_ok("hemmelig", "hemmelig")  # mangler «Bearer »
    assert not token_ok("Basic hemmelig", "hemmelig")


def avvist(bilde: str) -> bool:
    try:
        les_data_url(bilde)
    except UgyldigBilde:
        return True
    return False


def test_data_url():
    png = b"\x89PNG\r\n\x1a\nnoe"
    b64 = base64.b64encode(png).decode()
    assert les_data_url("data:image/png;base64," + b64) == png
    assert les_data_url("data:image/jpeg;base64," + b64) == png
    assert les_data_url("data:image/webp;base64," + b64) == png
    assert avvist(b64)  # uten prefiks (krasjet før med IndexError)
    assert avvist("data:image/png;base64")  # uten komma
    assert avvist("data:image/gif;base64," + b64)
    assert avvist("data:image/svg+xml;base64," + b64)
    assert avvist("data:image/png;base64,ikke base64!!")
    assert avvist("data:image/png;base64,")
    assert avvist("data:image/png;base64," + "A" * MAKS_BASE64)  # for stort


if __name__ == "__main__":
    test_prompter(); test_omraade(); test_resultat(); test_token(); test_data_url()
    print("Alle tester ok")
