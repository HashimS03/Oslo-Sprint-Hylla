import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { hentState } from "@/lib/store";
import { AutoOppdater, Sidemeny } from "@/components/Nav";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Hylla – lagerdashboard",
  description: "Beholdning, avvik og rapporter for lageret",
  icons: { icon: "/ikon-192.png", apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F8F7",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await hentState();
  return (
    <html lang="nb" className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
          <Sidemeny lager={s.innstillinger.lager} />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
        <AutoOppdater />
      </body>
    </html>
  );
}
