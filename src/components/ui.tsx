import Link from "next/link";

export function Tilbake({ href, tittel, children }: { href: string; tittel?: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2 px-3 pt-4 pb-2">
      <Link href={href} aria-label="Tilbake" className="flex h-11 w-11 items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </Link>
      {tittel && <h1 className="display text-[26px]">{tittel}</h1>}
      {children}
    </header>
  );
}

export function Swatch({ farge, size = 44, className = "" }: { farge: string; size?: number; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-[10px] border border-kant ${className}`}
      style={{ width: size, height: size, background: farge }}
    />
  );
}

const CHIP: Record<string, string> = {
  avvik: "bg-rodlys text-rod",
  ok: "bg-gronnlys text-gronn",
  ikke_talt: "bg-graa text-dempet",
  aktiv: "bg-gronnlys text-gronn",
  offline: "bg-rodlys text-rod",
};
const CHIP_TEKST: Record<string, string> = { avvik: "avvik", ok: "ok", ikke_talt: "ikke talt", aktiv: "aktiv", offline: "offline" };

export function StatusChip({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-[3px] font-mono text-[11px] ${CHIP[status] ?? CHIP.ikke_talt}`}>{CHIP_TEKST[status] ?? status}</span>;
}

export function Ikon({ navn, size = 20, className = "" }: { navn: "kamera" | "mikrofon" | "pluss" | "pil" | "lukk" | "advarsel" | "tannhjul" | "sok"; size?: number; className?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className, "aria-hidden": true };
  switch (navn) {
    case "kamera": return <svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case "mikrofon": return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
    case "pluss": return <svg {...p} strokeWidth={2.6}><path d="M12 5v14M5 12h14" /></svg>;
    case "pil": return <svg {...p} strokeWidth={2.2}><path d="M9 5l7 7-7 7" /></svg>;
    case "lukk": return <svg {...p} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "advarsel": return <svg {...p}><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" /></svg>;
    case "sok": return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>;
    case "tannhjul": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
  }
}

/** Tegnet hylle (brukes når det ikke finnes et ekte bilde). */
export function HylleTegning({ stabler, mork = false, hoyde = 100 }: { stabler: { farge: string; antall: number[] }[]; mork?: boolean; hoyde?: number }) {
  return (
    <div className={`flex flex-col gap-8 rounded-[18px] p-5 ${mork ? "bg-skifer" : "bg-skifer"}`}>
      {stabler.map((rad, i) => (
        <div key={i} className="flex flex-col">
          <div className="flex items-end gap-1.5 px-2" style={{ height: hoyde }}>
            {rad.antall.map((n, j) => (
              <div key={j} className="flex flex-1 flex-col-reverse gap-[3px]">
                {Array.from({ length: n }).map((_, k) => (
                  <div key={k} className="h-3.5 rounded-[3px] border" style={{ background: rad.farge, borderColor: rad.farge === "#1E1E20" ? "#45454A" : "#BDBAB4" }} />
                ))}
              </div>
            ))}
          </div>
          <div className="h-[7px] rounded-sm bg-[#6B7376]" />
        </div>
      ))}
    </div>
  );
}
