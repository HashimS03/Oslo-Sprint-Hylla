"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Slett-knapp på varesiden. Spør først, fordi all historikk for varen forsvinner. */
export function SlettVare({ sku, navn }: { sku: string; navn: string }) {
  const router = useRouter();
  const [sletter, setSletter] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  const slett = async () => {
    if (!confirm(`Slette ${navn}? Varen og all historikken for den blir borte.`)) return;
    setSletter(true);
    setFeil(null);
    const r = await fetch(`/api/varer/${encodeURIComponent(sku)}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) {
      router.push("/varer");
      router.refresh();
    } else {
      setFeil((await r?.json().catch(() => null))?.feil ?? "Fikk ikke slettet varen");
      setSletter(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {feil && <span className="text-[13px] text-rod">{feil}</span>}
      <button onClick={slett} disabled={sletter} className="h-10 rounded-xl border border-rodkant px-4 text-[14px] font-semibold text-rod hover:bg-rodlys disabled:opacity-60">
        {sletter ? "Sletter …" : "Slett vare"}
      </button>
    </div>
  );
}
