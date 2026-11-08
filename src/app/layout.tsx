import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { kreverKobling } from "@/lib/enheter";
import { hentState } from "@/lib/store";
import { apneAvvik, apneKameraAvvik } from "@/lib/lager";
import { kjorMatcherVedBehov } from "@/lib/matcher";
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
  const tema: Tema = (await cookies()).get("tema")?.value === "lys" ? "lys" : "mork";
  // En enhet som ikke er koblet til (bare /koble slipper gjennom middleware), får ingen meny og ingen lagerdata.
  if (kreverKobling() && !(await headers()).get("x-hylla-enhet")) {
    return (
      <html lang="nb" data-theme={tema === "mork" ? "dark" : "light"} className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
        <body className="antialiased">
          <div className="flex min-h-dvh flex-col bg-bg">{children}</div>
        </body>
      </html>
    );
  }
  // Avvik som venter på at tidsvinduet går ut, dukker opp uten at kameraet må sende noe nytt.
  await kjorMatcherVedBehov().catch(() => undefined);
  const s = await hentState();
  // Mørk modus er standard (tema leses øverst). Valget fra bryteren i menyen ligger i informasjonskapselen «tema».
  return (
    <html lang="nb" data-theme={tema === "mork" ? "dark" : "light"} className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
          <Sidemeny lager={s.innstillinger.lager} avvik={apneAvvik(s).length + apneKameraAvvik(s).length} tema={tema} />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
        <AutoOppdater sekunder={3} />
      </body>
    </html>
  );
}
