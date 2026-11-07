import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { hentState } from "@/lib/store";
import { apneAvvik } from "@/lib/lager";
import { AutoOppdater, Sidemeny, type Tema } from "@/components/Nav";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1214" },
  ],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await hentState();
  // Mørk modus er standard. Valget fra bryteren i menyen ligger i informasjonskapselen «tema».
  const tema: Tema = (await cookies()).get("tema")?.value === "lys" ? "lys" : "mork";
  return (
    <html lang="nb" data-theme={tema === "mork" ? "dark" : "light"} className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
          <Sidemeny lager={s.innstillinger.lager} avvik={apneAvvik(s).length} tema={tema} />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
        <AutoOppdater />
      </body>
    </html>
  );
}
