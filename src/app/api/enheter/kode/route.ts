import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { lagKoblingskode } from "@/lib/enheter";
import { begrens } from "@/lib/vern";

export const runtime = "nodejs";

// Lager en ny engangskode til QR-koden under Innstillinger → Telefoner i dashboardet.
// Bare koblede enheter slipper inn hit (middleware), og bare dashboardet (nettleser med cookie):
// scannerappen sender nøkkelen som «authorization: Bearer …» og får nei. QR-koden skal bare vises hos driftslederen.
export async function POST(req: Request) {
  if (req.headers.get("authorization")) {
    return NextResponse.json({ feil: "QR-koder lages bare i dashboardet (Innstillinger → Telefoner)." }, { status: 403 });
  }
  const stopp = begrens(req, "kobling");
  if (stopp) return stopp;
  const { kode, utloper } = await lagKoblingskode();
  const vert = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const lenke = `${proto}://${vert}/koble?k=${encodeURIComponent(kode)}`;
  const svg = await QRCode.toString(lenke, { type: "svg", margin: 1, color: { dark: "#1B2226", light: "#FFFFFF" } });
  return NextResponse.json({ kode, utloper, lenke, svg });
}
