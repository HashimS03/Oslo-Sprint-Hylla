"""
Sikkerhetssjekker for tellertjenesten: token og innkommende bilde.

Bare standardbiblioteket, så filen kan testes uten modellen eller FastAPI.
Samme fil finnes i yolo/ (tjenestene kjøres hver for seg).
"""
from __future__ import annotations

import base64
import binascii
import hmac
import re

MAKS_BASE64 = 8 * 1024 * 1024  # ca. 8 MB tekst ≈ 6 MB bilde
MAKS_PIKSLER = 40_000_000  # brukes som Image.MAX_IMAGE_PIXELS
MAKS_VARER = 50

_PREFIKS = re.compile(r"^data:image/(jpeg|png|webp);base64,")


class UgyldigBilde(ValueError):
    """Bildet i forespørselen kan ikke brukes. Meldingen vises til brukeren."""


def token_ok(header: str | None, token: str | None) -> bool:
    """Sjekker «Authorization: Bearer <token>». Uten token satt slipper alt gjennom (lokal utvikling)."""
    if not token:
        return True
    if not header or not header.startswith("Bearer "):
        return False
    return hmac.compare_digest(header[len("Bearer "):].encode(), token.encode())


def les_data_url(bilde: str) -> bytes:
    """Gjør en data-URL om til bytes, eller kaster UgyldigBilde."""
    if len(bilde) > MAKS_BASE64:
        raise UgyldigBilde("Bildet er for stort")
    treff = _PREFIKS.match(bilde)
    if not treff:
        raise UgyldigBilde("Bildet må være en data-URL med JPEG, PNG eller WebP")
    try:
        data = base64.b64decode(bilde[treff.end():], validate=True)
    except (binascii.Error, ValueError):
        raise UgyldigBilde("Bildet er ikke gyldig base64") from None
    if not data:
        raise UgyldigBilde("Bildet er tomt")
    return data
