"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type IkonNavn = "oversikt" | "varer" | "lokasjoner" | "avvik" | "hendelser" | "rapport" | "spor" | "innstillinger" | "kamera";

const MENY: { href: string; navn: string; ikon: IkonNavn; aktiv: (p: string) => boolean }[] = [
  { href: "/", navn: "Oversikt", ikon: "oversikt", aktiv: (p) => p === "/" },
  { href: "/varer", navn: "Varer", ikon: "varer", aktiv: (p) => p.startsWith("/varer") },
  { href: "/lokasjoner", navn: "Lokasjoner", ikon: "lokasjoner", aktiv: (p) => p.startsWith("/lokasjoner") },
  { href: "/avvik", navn: "Avvik", ikon: "avvik", aktiv: (p) => p.startsWith("/avvik") },
  { href: "/kamera", navn: "Kamera", ikon: "kamera", aktiv: (p) => p.startsWith("/kamera") || p.startsWith("/tak") },
  { href: "/logg", navn: "Hendelser", ikon: "hendelser", aktiv: (p) => p.startsWith("/logg") },
  { href: "/rapport", navn: "Rapport", ikon: "rapport", aktiv: (p) => p.startsWith("/rapport") },
];
const BUNN: typeof MENY = [
  { href: "/spor", navn: "Spør Hylla", ikon: "spor", aktiv: (p) => p.startsWith("/spor") },
  { href: "/innstillinger", navn: "Innstillinger", ikon: "innstillinger", aktiv: (p) => p.startsWith("/innstillinger") },
];

/** Hylla-logoen: gul flis med en mørk ramme og tre hyllestreker, som app-ikonet. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Hylla">
      <rect width="512" height="512" rx="96" fill="#F4C430" />
      <rect x="158" y="158" width="196" height="196" fill="none" stroke="#1B2226" strokeWidth="30" />
      <path d="M203 199h106M203 256h106M203 312h106" stroke="#1B2226" strokeWidth="16" />
    </svg>
  );
}

function MenyIkon({ navn }: { navn: IkonNavn }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (navn) {
    case "oversikt": return <svg {...p}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>;
    case "varer": return <svg {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></svg>;
    case "lokasjoner": return <svg {...p}><path d="M3 10l9-6 9 6v10H3z" /><path d="M7 20v-7h10v7M7 16h10" /></svg>;
    case "avvik": return <svg {...p}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.5" /></svg>;
    case "hendelser": return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
    case "rapport": return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case "kamera": return <svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case "spor": return <svg {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>;
    case "innstillinger": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>;
  }
}

function Lenke({ m, p, merke }: { m: (typeof MENY)[number]; p: string; merke?: number }) {
  const a = m.aktiv(p);
  return (
    <Link
      href={m.href}
      aria-current={a ? "page" : undefined}
      className={`flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[14px] ${a ? "bg-gullys font-semibold text-aktiv ring-1 ring-gulkant" : "text-dempet hover:bg-graa hover:text-tekst"}`}
    >
      <MenyIkon navn={m.ikon} />
      <span className="flex-1">{m.navn}</span>
      {merke ? <span className="ml-1 rounded-full bg-rod px-2 py-px text-[11.5px] font-semibold text-bg" aria-label={`${merke} åpne`}>{merke}</span> : null}
    </Link>
  );
}

/** Sidemenyen. På smale skjermer blir den en rad øverst. */
export function Sidemeny({ lager, avvik, tema }: { lager: string; avvik: number; tema: Tema }) {
  const p = usePathname();
  return (
    <aside className="sticky top-0 z-20 flex shrink-0 flex-col gap-1 border-b border-kant bg-meny px-3 py-3 lg:h-dvh lg:w-[232px] lg:border-r lg:border-b-0 lg:py-5">
      <div className="flex items-center justify-between px-2 pb-2 lg:flex-col lg:items-start lg:gap-1 lg:pb-5">
        <Link href="/" className="display flex items-center gap-2 text-[24px]" style={{ fontStretch: "78%" }}>
          <Logo />
          Hylla
        </Link>
        <span className="etikett">{lager}</span>
      </div>
      <nav aria-label="Hovedmeny" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {MENY.map((m) => <Lenke key={m.href} m={m} p={p} merke={m.href === "/avvik" ? avvik : undefined} />)}
        <span className="hidden lg:block lg:h-4" />
        <div className="flex gap-1 lg:hidden">{BUNN.map((m) => <Lenke key={m.href} m={m} p={p} />)}<TemaBryter start={tema} /></div>
      </nav>
      <div className="mt-auto hidden flex-col gap-1 lg:flex">
        {BUNN.map((m) => <Lenke key={m.href} m={m} p={p} />)}
        <TemaBryter start={tema} />
        <span className="mt-3 px-3 text-[11px] text-dempet">Driftsleder · oppdateres automatisk</span>
      </div>
    </aside>
  );
}

/** Henter ferske tall fra serveren jevnlig, så dashboardet viser nye skann og avvik uten at noen trykker. */
export function AutoOppdater({ sekunder = 10 }: { sekunder?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, sekunder * 1000);
    return () => clearInterval(t);
  }, [router, sekunder]);
  return null;
}

export type Tema = "lys" | "mork";

/** Bytter mellom lys og mørk modus. Valget lagres i en informasjonskapsel, så serveren tegner riktig tema fra start. */
export function TemaBryter({ start }: { start: Tema }) {
  const [tema, setTema] = useState<Tema>(start);
  const bytt = () => {
    const neste: Tema = tema === "mork" ? "lys" : "mork";
    setTema(neste);
    document.documentElement.dataset.theme = neste === "mork" ? "dark" : "light";
    document.cookie = `tema=${neste}; path=/; max-age=31536000; samesite=lax`;
  };
  const mork = tema === "mork";
  return (
    <button
      type="button"
      onClick={bytt}
      role="switch"
      aria-checked={mork}
      className="flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[14px] text-dempet hover:bg-graa hover:text-tekst"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
        {mork ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> : <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />}
      </svg>
      <span className="flex-1 text-left whitespace-nowrap">{mork ? "Lys modus" : "Mørk modus"}</span>
    </button>
  );
}
