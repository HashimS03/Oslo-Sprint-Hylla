"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Liten slett-knapp på en hylle. Spør først; varer som står igjen, føres ut med en korrigering. */
export function SlettHylle({ id, navn, antall }: { id: string; navn: string; antall: number }) {
  const router = useRouter();
  const [sletter, setSletter] = useState(false);

  const slett = async () => {
    const tekst = antall > 0
      ? `Slette ${navn}? Det står ${antall} stk på hylla. De trekkes ut av beholdningen med en korrigering i loggen.`
      : `Slette ${navn}?`;
    if (!confirm(tekst)) return;
    setSletter(true);
    const r = await fetch(`/api/hyller/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (!r?.ok) alert((await r?.json().catch(() => null))?.feil ?? "Fikk ikke slettet hylla");
    setSletter(false);
    router.refresh();
  };

  return (
    <button onClick={slett} disabled={sletter} className="h-8 rounded-lg border border-rodkant px-3 text-[12.5px] font-semibold text-rod hover:bg-rodlys disabled:opacity-60">
      {sletter ? "Sletter …" : "Slett"}
    </button>
  );
}
