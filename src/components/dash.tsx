import Link from "next/link";
import { TYPE_NAVN } from "@/lib/format";
import { PERIODER } from "@/lib/rapport";

// Byggeklosser for dashboard-sidene.

export function Topp({ tittel, under, children, tilbake }: { tittel: string; under?: React.ReactNode; children?: React.ReactNode; tilbake?: { href: string; navn: string } }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-5 pt-6 pb-4 lg:px-8 lg:pt-8">
      <div className="flex min-w-0 flex-col gap-1">
        {tilbake && (
          <Link href={tilbake.href} className="mb-1 flex items-center gap-1 text-[13px] text-dempet hover:text-tekst">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            {tilbake.navn}
          </Link>
        )}
        <h1 className="display text-[30px] lg:text-[34px]">{tittel}</h1>
        {under && <div className="text-[13.5px] text-dempet">{under}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Innhold({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 flex-col gap-5 px-5 pb-10 lg:px-8">{children}</main>;
}

export function Kpi({ etikett, verdi, under, tone, href }: { etikett: string; verdi: React.ReactNode; under?: React.ReactNode; tone?: "rod" | "gronn" | "gul"; href?: string }) {
  const kant = tone === "rod" ? "border-rodkant" : tone === "gul" ? "border-gulkant" : "border-kant";
  const farge = tone === "rod" ? "text-rod" : tone === "gronn" ? "text-gronn" : tone === "gul" ? "text-gultekst" : "";
  const innhold = (
    <>
      <span className="etikett">{etikett}</span>
      <span className={`display text-[40px] ${farge}`} style={{ fontStretch: "100%" }}>{verdi}</span>
      {under && <span className="text-[12.5px] text-dempet">{under}</span>}
    </>
  );
  const cls = `flex flex-col gap-1.5 rounded-[14px] border bg-kort p-[18px] ${kant} ${href ? "transition-colors hover:border-tekst" : ""}`;
  return href ? <Link href={href} className={cls}>{innhold}</Link> : <div className={cls}>{innhold}</div>;
}

/** Små ruter som viser hvor lite som er igjen (maks seks). */
export function Ruter({ antall, maks = 6 }: { antall: number; maks?: number }) {
  const farge = antall <= 2 ? "bg-rod" : "bg-gul";
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: maks }).map((_, i) => <span key={i} className={`h-3.5 w-2.5 rounded-[2px] ${i < antall ? farge : "bg-graa"}`} />)}
    </span>
  );
}

export function Panel({ tittel, handling, children, className = "" }: { tittel: string; handling?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`kort flex min-w-0 flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-kant px-4 py-3">
        <h2 className="display text-[18px]" style={{ fontStretch: "88%", fontWeight: 700 }}>{tittel}</h2>
        {handling}
      </div>
      {children}
    </section>
  );
}

export function PanelLenke({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="text-[13px] underline underline-offset-2 hover:text-dempet">{children}</Link>;
}

/** Tabell som kan rulles sideveis på smale skjermer. */
export function Tabell({ hode, children, hoyre = [] }: { hode: string[]; children: React.ReactNode; hoyre?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-kant bg-thead">
            {hode.map((h, i) => (
              <th key={h + i} scope="col" className={`px-4 py-2.5 font-mono text-[10.5px] font-medium tracking-[.06em] whitespace-nowrap text-dempet uppercase ${hoyre.includes(i) ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-linje [&>tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-2.5">{children}</tbody>
      </table>
    </div>
  );
}

export function TomRad({ kolonner, children }: { kolonner: number; children: React.ReactNode }) {
  return <tr><td colSpan={kolonner} className="!py-8 text-center text-dempet">{children}</td></tr>;
}

const TYPE_STIL: Record<string, string> = {
  mottak: "bg-gronnlys text-gronn",
  plukk: "bg-blaalys text-blaa",
  mulig_svinn: "bg-rodlys text-rod",
  svinn: "bg-rod text-bg",
  funnet: "bg-gronnlys text-gronn",
  korrigering: "bg-graa text-dempet",
  start: "bg-graa text-dempet",
};

export function TypeChip({ type }: { type: string }) {
  return <span className={`inline-block rounded-md px-2 py-[3px] font-mono text-[10.5px] tracking-[.04em] whitespace-nowrap uppercase ${TYPE_STIL[type] ?? TYPE_STIL.start}`}>{TYPE_NAVN[type] ?? type}</span>;
}

const AVVIK_STIL: Record<string, [string, string]> = {
  apen: ["bg-rodlys text-rod", "Åpent"],
  funnet: ["bg-gronnlys text-gronn", "Funnet"],
  svinn: ["bg-graa text-tekst", "Svinn"],
  lukket: ["bg-blaalys text-blaa", "Var salg"],
};

export function AvvikChip({ status }: { status: string }) {
  const [cls, tekst] = AVVIK_STIL[status] ?? AVVIK_STIL.apen;
  return <span className={`inline-block rounded-md px-2 py-[3px] font-mono text-[10.5px] tracking-[.04em] whitespace-nowrap uppercase ${cls}`}>{tekst}</span>;
}

export function Prikk({ farge }: { farge: string }) {
  return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] border border-kant align-[-2px]" style={{ background: farge }} />;
}

/** Knapperad for å velge periode. `lag` bygger lenken for et antall dager. */
export function PeriodeVelger({ valgt, lag }: { valgt: number; lag: (dager: number) => string }) {
  return (
    <div role="group" aria-label="Periode" className="flex rounded-lg border border-kant bg-kort p-0.5">
      {PERIODER.map((p) => (
        <Link
          key={p.dager}
          href={lag(p.dager)}
          aria-current={p.dager === valgt ? "true" : undefined}
          className={`rounded-md px-3 py-1.5 text-[13px] ${p.dager === valgt ? "bg-tekst font-semibold text-bg" : "text-dempet hover:text-tekst"}`}
        >
          {p.navn}
        </Link>
      ))}
    </div>
  );
}

export function Filter({ valg, valgt, lag, merke }: { valg: { id: string; navn: string }[]; valgt: string; lag: (id: string) => string; merke?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {valg.map((f) => (
        <Link
          key={f.id}
          href={lag(f.id)}
          aria-current={f.id === valgt ? "true" : undefined}
          className={`rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap ${f.id === valgt ? "bg-tekst font-semibold text-bg" : "border border-kant bg-kort hover:border-tekst"}`}
        >
          {f.navn}{merke?.[f.id] ? ` · ${merke[f.id]}` : ""}
        </Link>
      ))}
    </div>
  );
}
