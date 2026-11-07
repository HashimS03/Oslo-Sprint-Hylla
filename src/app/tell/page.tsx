import Link from "next/link";
import { hentState } from "@/lib/store";
import { apneAvvik, hylleStatus, sisteTelling, vare } from "@/lib/lager";
import { dagTittel, klokke } from "@/lib/format";
import { Side } from "@/components/Nav";
import { StatusChip, Tilbake } from "@/components/ui";
import { HylleSok } from "./HylleSok";

export const dynamic = "force-dynamic";

export default async function VelgHylle() {
  const s = await hentState();
  const avvik = apneAvvik(s);
  const reoler = [...new Set(s.hyller.map((h) => h.reol))].sort();
  const forsteAvvik = avvik[0]?.hylle;
  const sortert = (r: string) =>
    s.hyller
      .filter((h) => h.reol === r)
      .sort((a, b) => (a.id === forsteAvvik ? -1 : b.id === forsteAvvik ? 1 : b.id.localeCompare(a.id)));

  return (
    <Side>
      <Tilbake href="/" tittel="Hvilken hylle?" />
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-1 pb-4">
        <HylleSok hyller={s.hyller.map((h) => ({ id: h.id, navn: h.navn }))} />
        {forsteAvvik && (
          <div className="flex items-center gap-2.5 rounded-xl bg-gullys px-3 py-2.5 text-[13px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" /></svg>
            <span>{forsteAvvik} har et åpent avvik. Tell den først.</span>
          </div>
        )}
        {reoler.map((r) => (
          <section key={r} className="flex flex-col gap-2">
            <span className="etikett">Reol {r}</span>
            {sortert(r).map((h) => {
              const st = hylleStatus(s, h.id);
              const t = sisteTelling(s, h.id);
              const innhold = h.innhold.map((i) => vare(s, i.sku)?.navn).filter(Boolean).join(", ");
              const fremhev = h.id === forsteAvvik;
              return (
                <Link
                  key={h.id}
                  href={`/tell/${h.id}`}
                  className={`flex items-center gap-3 rounded-[14px] bg-white p-3 ${fremhev ? "border-[2.5px] border-tekst" : "border border-kant"}`}
                >
                  <span className={`display flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[10px] text-xl ${fremhev ? "bg-gul" : "bg-graa"}`} style={{ fontStretch: "100%" }}>{h.id}</span>
                  <span className="min-w-0 flex-1">
                    <b className="text-[15px] font-semibold">{h.navn}</b>
                    <br />
                    <span className="text-xs text-dempet">
                      {innhold || "Tom hylle"} · {t ? `sist talt ${dagTittel(t.tid) === "I dag" ? klokke(t.tid) : dagTittel(t.tid).toLowerCase()}` : "ikke talt"}
                    </span>
                  </span>
                  <StatusChip status={st} />
                </Link>
              );
            })}
          </section>
        ))}
      </main>
    </Side>
  );
}
