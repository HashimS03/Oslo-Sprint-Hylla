"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UTFALL_FORKLARING, UTFALL_TEKST, type KameraUtfall } from "@/lib/kameraavvik";

export function KameraAvvikValg({ id, valg }: { id: string; valg: KameraUtfall[] }) {
  const router = useRouter();
  const [valgt, setValgt] = useState<KameraUtfall | null>(null);
  const [venter, setVenter] = useState(false);
  const [feil, setFeil] = useState("");
  const bekreft = async () => {
    if (!valgt) return;
    setVenter(true);
    setFeil("");
    const r = await fetch(`/api/matcher/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ utfall: valgt }) });
    if (!r.ok) setFeil((await r.json().catch(() => null))?.feil ?? "Kunne ikke lagre. Prøv igjen.");
    router.refresh();
    setVenter(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-dempet">Velg hva kontrollen viste. Det samme valget lukker oppgaven i appen.</span>
      {valg.map((v) => (
        <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${valgt === v ? "border-2 border-tekst bg-gullys" : "border-kant bg-kort hover:border-tekst"}`}>
          <input type="radio" name="avklaring" value={v} checked={valgt === v} onChange={() => setValgt(v)} className="mt-1 accent-tekst" />
          <span className="flex flex-col">
            <span className={`text-[14px] font-semibold ${v === "svinn" ? "text-rod" : ""}`}>{UTFALL_TEKST[v]}</span>
            <span className="text-[12.5px] text-dempet">{UTFALL_FORKLARING[v]}</span>
          </span>
        </label>
      ))}
      <button disabled={!valgt || venter} onClick={bekreft} className="knapp-gul mt-1 !h-11 !rounded-lg !border-2">
        {venter ? "Lagrer …" : "Bekreft avklaringen"}
      </button>
      {feil && <span role="alert" className="text-[13px] text-rod">{feil}</span>}
    </div>
  );
}
