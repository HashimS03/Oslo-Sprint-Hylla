"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { KameraUtfall } from "@/lib/kameraavvik";

const TEKST: Record<KameraUtfall, string> = { salg: "Salg", svinn: "Svinn", funnet: "Funnet", falsk_alarm: "Falsk alarm" };

/** Samme valg som appen viser. Når ett er valgt, er avviket avklart begge steder. */
export function KameraAvvikKnapper({ id, valg }: { id: string; valg: KameraUtfall[] }) {
  const router = useRouter();
  const [venter, setVenter] = useState(false);
  const sett = async (utfall: KameraUtfall) => {
    setVenter(true);
    await fetch(`/api/matcher/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ utfall }) });
    router.refresh();
    setVenter(false);
  };
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5">
      {valg.map((u) => (
        <button
          key={u}
          disabled={venter}
          onClick={() => sett(u)}
          className={`h-9 rounded-lg px-3 text-[13px] font-semibold disabled:opacity-50 ${u === "svinn" ? "bg-rod font-bold text-bg hover:opacity-90" : "border border-kant bg-kort hover:border-tekst"}`}
        >
          {TEKST[u]}
        </button>
      ))}
    </div>
  );
}
