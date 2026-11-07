import QRCode from "qrcode";
import { hentState } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Utskriftsvennlig side med én QR-kode per vare. Koden inneholder «HYLLA:<SKU>». */
export async function GET() {
  const s = await hentState();
  const kort = await Promise.all(
    s.varer.map(async (v) => {
      const svg = await QRCode.toString(`HYLLA:${v.sku}`, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return `<div class="etikett">${svg}<div class="navn">${esc(v.navn)}</div><div class="sku">${esc(v.sku)}</div></div>`;
    }),
  );
  const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hylla – QR-etiketter</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 16px; color: #1B2226; background: #fff; }
  h1 { font-size: 20px; margin: 0 0 4px; } p { margin: 0 0 16px; color: #56636A; }
  .rutenett { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
  .etikett { border: 2px solid #1B2226; border-radius: 10px; padding: 10px; text-align: center; break-inside: avoid; }
  .etikett svg { width: 100%; height: auto; }
  .navn { font-weight: 700; font-size: 15px; margin-top: 4px; }
  .sku { font-family: ui-monospace, monospace; font-size: 12px; color: #56636A; }
  @media print { p, button { display: none; } body { margin: 0; } }
</style></head><body>
<h1>QR-etiketter</h1>
<p>${s.varer.length} varer. Skriv ut, klipp og fest på varene. <button onclick="print()">Skriv ut</button></p>
<div class="rutenett">${kort.join("")}</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
