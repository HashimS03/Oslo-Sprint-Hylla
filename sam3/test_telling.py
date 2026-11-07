"""Kjør: python -m pytest test_telling.py   (eller bare: python test_telling.py)"""
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


if __name__ == "__main__":
    test_prompter(); test_omraade(); test_resultat()
    print("Alle tester ok")
