import QRCode from "qrcode";

export async function QrKode({ tekst }: { tekst: string }) {
  const svg = await QRCode.toString(tekst, { type: "svg", margin: 1, color: { dark: "#1B2226", light: "#FFFFFF" } });
  return <div className="h-[160px] w-[160px] rounded-lg border border-kant p-1" dangerouslySetInnerHTML={{ __html: svg }} />;
}
