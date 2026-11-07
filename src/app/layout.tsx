import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Hylla",
  description: "Lagerassistent som teller hylla fra ett bilde",
  manifest: "/manifest.webmanifest",
  // Lagt til på hjemskjermen åpnes Hylla i fullskjerm, som en vanlig app.
  appleWebApp: { capable: true, title: "Hylla", statusBarStyle: "default" },
  icons: { icon: "/ikon-192.png", apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F8F7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <div className="mx-auto min-h-dvh max-w-[480px] bg-bg">{children}</div>
      </body>
    </html>
  );
}
