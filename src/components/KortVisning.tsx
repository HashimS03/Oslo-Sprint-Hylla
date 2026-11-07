import Link from "next/link";
import type { Kort } from "@/lib/types";
import { fortegn, klokke } from "@/lib/format";

export function KortVisning({ kort }: { kort: Kort }) {
  if (kort.type === "vare") {
    const hovedhylle = kort.hyller.filter((h) => h.antall > 0)[0];
    return (
      <Link href={`/varer/${kort.sku}`} className="flex flex-col gap-2.5 self-stretch rounded-2xl border-[2.5px] border-tekst bg-white p-3.5">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 shrink-0 rounded-[10px] border border-kant" style={{ background: kort.swatch }} />
          <span className="flex-1">
            <b className="text-[15px] font-semibold">{kort.navn}</b>
            <br />
            <span className="font-mono text-[11px] text-dempet">{kort.sku}{kort.po ? ` · ${kort.po.id}` : ""}</span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {kort.po ? (
            <>
              <Tall n={String(kort.po.bestilt)} t="bestilt" />
              <Tall n={fortegn(-kort.po.plukket)} t="plukket" />
            </>
          ) : (
            kort.hyller.slice(0, 2).map((h) => <Tall key={h.hylle} n={String(h.antall)} t={`på ${h.hylle}`} />)
          )}
          <Tall n={String(kort.beholdning)} t={hovedhylle && kort.po ? `på ${hovedhylle.hylle}` : "totalt"} gul />
        </div>
      </Link>
    );
  }
  if (kort.type === "avvik") {
    return (
      <Link href={`/avvik/${kort.id}`} className="flex items-center gap-3 self-stretch rounded-2xl border-[1.5px] border-rodkant bg-white p-3.5">
        <span className="flex-1">
          <span className="font-mono text-[11px] text-rod">MULIG SVINN · {klokke(kort.tid)}</span>
          <br />
          <b className="text-[15px] font-semibold">{kort.hylle} · {kort.navn}</b>
        </span>
        <span className="display text-[26px] text-rod" style={{ fontStretch: "100%" }}>{fortegn(kort.endring)}</span>
      </Link>
    );
  }
  return null;
}

function Tall({ n, t, gul }: { n: string; t: string; gul?: boolean }) {
  return (
    <div className={`rounded-lg px-1 py-2 ${gul ? "bg-gullys" : "bg-bg"}`}>
      <div className="display text-[22px]" style={{ fontStretch: "100%" }}>{n}</div>
      <div className="text-[11px] text-dempet">{t}</div>
    </div>
  );
}
