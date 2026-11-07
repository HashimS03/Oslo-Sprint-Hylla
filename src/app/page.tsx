import Link from "next/link";
import { hentState } from "@/lib/store";
import { apneAvvik, erIdag, sisteTelling, totalBeholdning, vare } from "@/lib/lager";
import { fortegn, hilsen, klokke, typeFarge } from "@/lib/format";
import { Side } from "@/components/Nav";
import { Ikon } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Hjem() {
  const s = await hentState();
  const avvik = apneAvvik(s);
  const talt = s.hyller.filter((h) => {
    const t = sisteTelling(s, h.id);
    return t && erIdag(t.tid);
  }).length;
  const ting = avvik.length + (s.hyller.length - talt > 0 ? 1 : 0);
  const siste = [...s.hendelser].sort((a, b) => b.tid.localeCompare(a.tid)).slice(0, 4);
  const dato = new Date().toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "short" }).toUpperCase();

  return (
    <Side>
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="display flex items-center gap-2 text-[26px]" style={{ fontStretch: "78%" }}>
          <span className="inline-block h-4 w-4 border-[2.5px] border-tekst bg-gul" />
          Hylla
        </div>
        <Link href="/innstillinger" aria-label="Innstillinger" className="flex h-11 w-11 items-center justify-center rounded-full bg-graa">
          <Ikon navn="tannhjul" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-dempet">{s.innstillinger.lager.toUpperCase()} · {dato}</span>
          <h1 className="display text-[34px]">
            {hilsen()} {ting === 0 ? "Alt ser bra ut." : `${ting} ${ting === 1 ? "ting trenger" : "ting trenger"} deg i dag.`}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="kort rounded-xl p-2.5">
            <div className="display text-[26px]" style={{ fontStretch: "100%" }}>{totalBeholdning(s)}</div>
            <div className="text-[11px] text-dempet">varer på lager</div>
          </div>
          <Link href="/tell" className="kort rounded-xl p-2.5">
            <div className="display text-[26px]" style={{ fontStretch: "100%" }}>{talt}/{s.hyller.length}</div>
            <div className="text-[11px] text-dempet">hyller talt i dag</div>
          </Link>
          <Link href={avvik[0] ? `/avvik/${avvik[0].id}` : "/logg?type=mulig_svinn"} className={`rounded-xl bg-white p-2.5 ${avvik.length ? "border-[1.5px] border-rodkant" : "border border-kant"}`}>
            <div className={`display text-[26px] ${avvik.length ? "text-rod" : ""}`} style={{ fontStretch: "100%" }}>{avvik.length}</div>
            <div className="text-[11px] text-dempet">mulig svinn</div>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/tell" className="flex h-[132px] flex-col justify-between rounded-[18px] border-[2.5px] border-tekst bg-gul p-4">
            <Ikon navn="kamera" size={30} />
            <div>
              <div className="display text-xl" style={{ fontStretch: "85%" }}>Tell en hylle</div>
              <div className="text-xs">Ta ett bilde</div>
            </div>
          </Link>
          <Link href="/spor" className="flex h-[132px] flex-col justify-between rounded-[18px] bg-tekst p-4 text-bg">
            <Ikon navn="mikrofon" size={30} className="text-gul" />
            <div>
              <div className="display text-xl" style={{ fontStretch: "85%" }}>Spør Hylla</div>
              <div className="text-xs text-[#C9D1CE]">Snakk eller skriv</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-lg" style={{ fontStretch: "85%", fontWeight: 700 }}>Siste hendelser</h2>
            <Link href="/logg" className="text-[13px] underline">Se loggen</Link>
          </div>
          <div className="kort overflow-hidden">
            {siste.map((h, i) => {
              const svinn = h.type === "mulig_svinn" && h.avvik?.status === "apen";
              return (
                <Link
                  key={h.id}
                  href={h.type === "mulig_svinn" ? `/avvik/${h.id}` : `/varer/${h.sku}`}
                  className={`flex items-center gap-2.5 px-3 py-[11px] ${i ? "border-t border-kant" : ""} ${svinn ? "bg-rodlys" : ""}`}
                >
                  <span className="w-9 font-mono text-[11px] text-dempet">{klokke(h.tid)}</span>
                  <span className="flex-1 text-[13px]">
                    <b className="font-semibold">{h.hylle} · {vare(s, h.sku)?.navn}</b>
                    <br />
                    <span className="text-[11.5px] text-dempet">{h.aarsak}</span>
                  </span>
                  <span className={`font-mono text-xs font-medium ${typeFarge(h.type, h.endring)}`}>{fortegn(h.endring)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </Side>
  );
}
