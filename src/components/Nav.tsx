"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FANER = [
  { href: "/", navn: "Hjem", aktiv: (p: string) => p === "/" },
  { href: "/tell", navn: "Tell", aktiv: (p: string) => p.startsWith("/tell") },
  { href: "/spor", navn: "Spør", aktiv: (p: string) => p.startsWith("/spor") },
  { href: "/logg", navn: "Logg", aktiv: (p: string) => p.startsWith("/logg") || p.startsWith("/avvik") },
  { href: "/varer", navn: "Varer", aktiv: (p: string) => p.startsWith("/varer") },
];

export function Nav() {
  const p = usePathname();
  return (
    <nav aria-label="Hovedmeny" className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-kant bg-white px-1 pt-1.5 pb-[max(22px,env(safe-area-inset-bottom))]">
      {FANER.map((f) => {
        const a = f.aktiv(p);
        return (
          <Link key={f.href} href={f.href} className={`flex flex-col items-center gap-[3px] py-1.5 text-[11px] ${a ? "font-semibold text-tekst" : "text-dempet"}`}>
            <span className={`h-1 w-[22px] rounded-sm ${a ? "bg-gul" : ""}`} />
            {f.navn}
          </Link>
        );
      })}
    </nav>
  );
}

export function Side({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      {nav && <Nav />}
    </div>
  );
}
