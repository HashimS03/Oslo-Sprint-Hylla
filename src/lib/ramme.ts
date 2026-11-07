import "server-only";
import sharp from "sharp";

// Endringsdeteksjon for kameratelefonen. Telefonen sender et bilde hvert sekund eller to.
// Vi teller først når noen har rørt på noe, bildet har vært stille en liten stund,
// og bildet nå er annerledes enn bildet vi sist telte. Da blir kameraet en slags «RFID-leser».

const BREDDE = 64;
const HOYDE = 48;

const BEVEGELSE = Number(process.env.RAMME_BEVEGELSE ?? 0.035); // gjennomsnittlig pikselendring mellom to bilder
// Andel av pikslene som har endret seg tydelig mot sist telte bilde. Et snitt over hele bildet
// ble for lite når én liten vare ble tatt bort, så nå teller vi piksler i stedet.
const ENDRING = Number(process.env.RAMME_ENDRING ?? 0.01);
const PIKSEL_TERSKEL = 0.1; // så mye én piksel må endre seg for å telle som endret
const STILLE_RAMMER = Number(process.env.RAMME_STILLE ?? 2); // så mange stille bilder på rad før vi teller
const PAUSE_MS = Number(process.env.RAMME_PAUSE_MS ?? 4000); // minste tid mellom tellinger per kamera

type Tilstand = {
  forrige?: Buffer;
  referanse?: Buffer;
  stille: number;
  teller: boolean;
  sistTelt: number;
};

type Global = { __hyllaRamme?: Map<string, Tilstand> };
const g = globalThis as unknown as Global;
const alle = () => (g.__hyllaRamme ??= new Map());

export type RammeStatus = "bevegelse" | "stille" | "uendret" | "teller" | "pause";

async function gra(dataUrl: string): Promise<Buffer> {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return sharp(Buffer.from(b64, "base64")).resize(BREDDE, HOYDE, { fit: "fill" }).removeAlpha().raw().toBuffer();
}

/** Andel piksler som har endret seg mer enn PIKSEL_TERSKEL. */
function andelEndret(a: Buffer, b: Buffer): number {
  const grense = PIKSEL_TERSKEL * 255;
  let n = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d / 3 > grense) n++;
  }
  return n / (a.length / 3);
}

function avstand(a: Buffer, b: Buffer): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length / 255;
}

/** Tar imot et nytt bilde og sier om det er verdt å telle. Etter vellykket telling må kalleren kalle `ferdigTelt`. */
export async function vurder(kameraId: string, bilde: string, tving = false) {
  const t = alle().get(kameraId) ?? { stille: 0, teller: false, sistTelt: 0 };
  alle().set(kameraId, t);
  const na = await gra(bilde);
  const bevegelse = t.forrige ? avstand(na, t.forrige) : 0;
  const endring = t.referanse ? andelEndret(na, t.referanse) : 1;
  t.forrige = na;

  const mal = { bevegelse, endring };
  if (t.teller) return { status: "teller" as RammeStatus, skalTelle: false, ...mal };
  if (tving) {
    t.teller = true;
    return { status: "teller" as RammeStatus, skalTelle: true, ...mal };
  }
  if (bevegelse > BEVEGELSE) {
    t.stille = 0;
    return { status: "bevegelse" as RammeStatus, skalTelle: false, ...mal };
  }
  t.stille++;
  if (t.stille < STILLE_RAMMER) return { status: "stille" as RammeStatus, skalTelle: false, ...mal };
  if (t.referanse && endring < ENDRING) return { status: "uendret" as RammeStatus, skalTelle: false, ...mal };
  if (Date.now() - t.sistTelt < PAUSE_MS) return { status: "pause" as RammeStatus, skalTelle: false, ...mal };
  t.teller = true;
  return { status: "teller" as RammeStatus, skalTelle: true, ...mal };
}

/** Kalles når telling er ferdig (ok = bildet er nå referansen vi sammenligner mot). */
export async function ferdigTelt(kameraId: string, bilde: string, ok: boolean) {
  const t = alle().get(kameraId);
  if (!t) return;
  t.teller = false;
  t.sistTelt = Date.now();
  t.stille = 0;
  if (ok) t.referanse = await gra(bilde);
}
