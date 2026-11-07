"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type IkonNavn = "oversikt" | "varer" | "lokasjoner" | "avvik" | "hendelser" | "rapport" | "spor" | "innstillinger";

const MENY: { href: string; navn: string; ikon: IkonNavn; aktiv: (p: string) => boolean }[] = [
  { href: "/", navn: "Oversikt", ikon: "oversikt", aktiv: (p) => p === "/" },
  { href: "/varer", navn: "Varer", ikon: "varer", aktiv: (p) => p.startsWith("/varer") },
  { href: "/lokasjoner", navn: "Lokasjoner", ikon: "lokasjoner", aktiv: (p) => p.startsWith("/lokasjoner") },
  { href: "/avvik", navn: "Avvik", ikon: "avvik", aktiv: (p) => p.startsWith("/avvik") },
  { href: "/logg", navn: "Hendelser", ikon: "hendelser", aktiv: (p) => p.startsWith("/logg") },
  { href: "/rapport", navn: "Rapport", ikon: "rapport", aktiv: (p) => p.startsWith("/rapport") },
];
const BUNN: typeof MENY = [
  { href: "/spor", navn: "Spør Hylla", ikon: "spor", aktiv: (p) => p.startsWith("/spor") },
  { href: "/innstillinger", navn: "Innstillinger", ikon: "innstillinger", aktiv: (p) => p.startsWith("/innstillinger") },
];

function MenyIkon({ navn }: { navn: IkonNavn }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (navn) {
    case "oversikt": return <svg {...p}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>;
    case "varer": return <svg {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></svg>;
    case "lokasjoner": return <svg {...p}><path d="M3 10l9-6 9 6v10H3z" /><path d="M7 20v-7h10v7M7 16h10" /></svg>;
    case "avvik": return <svg {...p}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.5" /></svg>;
    case "hendelser": return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
    case "rapport": return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case "spor": return <svg {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>;
    case "innstillinger": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>;
  }
}

function Lenke({ m, p }: { m: (typeof MENY)[number]; p: string }) {
  const a = m.aktiv(p);
  return (
    <Link
      href={m.href}
      aria-current={a ? "page" : undefined}
      className={`flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[14px] ${a ? "bg-gullys font-semibold text-tekst shadow-[inset_3px_0_0_var(--color-gul)]" : "text-dempet hover:bg-graa hover:text-tekst"}`}
    >
      <MenyIkon navn={m.ikon} />
      {m.navn}
    </Link>
  );
}

/** Sidemenyen. På smale skjermer blir den en rad øverst. */
export function Sidemeny({ lager }: { lager: string }) {
  const p = usePathname();
  return (
    <aside className="sticky top-0 z-20 flex shrink-0 flex-col gap-1 border-b border-kant bg-white px-3 py-3 lg:h-dvh lg:w-[232px] lg:border-r lg:border-b-0 lg:py-5">
      <div className="flex items-center justify-between px-2 pb-2 lg:flex-col lg:items-start lg:gap-1 lg:pb-5">
        <Link href="/" className="display flex items-center gap-2 text-[24px]" style={{ fontStretch: "78%" }}>
          <span className="inline-block h-4 w-4 border-[2.5px] border-tekst bg-gul" />
          Hylla
        </Link>
        <span className="etikett">{lager}</span>
      </div>
      <nav aria-label="Hovedmeny" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {MENY.map((m) => <Lenke key={m.href} m={m} p={p} />)}
        <span className="hidden lg:block lg:h-4" />
        <div className="flex gap-1 lg:hidden">{BUNN.map((m) => <Lenke key={m.href} m={m} p={p} />)}</div>
      </nav>
      <div className="mt-auto hidden flex-col gap-1 lg:flex">
        {BUNN.map((m) => <Lenke key={m.href} m={m} p={p} />)}
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
