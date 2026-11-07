"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function KameraAvvikKnapper({ id }: { id: string }) {
  const router = useRouter();
  const [venter, setVenter] = useState(false);
  const sett = async (status: "loest" | "falsk_alarm") => {
    setVenter(true);
    await fetch(`/api/matcher/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    router.refresh();
    setVenter(false);
  };
  return (
    <div className="flex shrink-0 gap-1.5">
      <button disabled={venter} onClick={() => sett("loest")} className="h-9 rounded-lg bg-rod px-3 text-[13px] font-bold text-bg hover:opacity-90 disabled:opacity-50">Løst</button>
      <button disabled={venter} onClick={() => sett("falsk_alarm")} className="h-9 rounded-lg border border-kant bg-kort px-3 text-[13px] font-semibold hover:border-tekst disabled:opacity-50">Falsk alarm</button>
    </div>
  );
}
