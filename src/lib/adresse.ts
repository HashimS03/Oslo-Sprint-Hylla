import { headers } from "next/headers";

/** Adressen siden ble åpnet på, f.eks. https://hylla.vercel.app. Brukes i QR-koder. */
export async function adresse(): Promise<string> {
  const h = await headers();
  const vert = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (vert.startsWith("localhost") ? "http" : "https");
  return `${proto}://${vert}`;
}
