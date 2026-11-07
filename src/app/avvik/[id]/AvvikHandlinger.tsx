"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const VALG = [
  { id: "funnet", tittel: "Varene er funnet", tekst: "Antallet settes tilbake i loggen." },
  { id: "salg", tittel: "Det var et salg", tekst: "Nedgangen føres som salg, ikke svinn." },
  { id: "svinn", tittel: "Bekreft svinn", tekst: "Varene trekkes fra som svinn." },
] as const;

export function AvvikHandlinger({ id }: { id: string }) {
  const router = useRouter();
  const [valg, setValg] = useState<(typeof VALG)[number]["id"] | null>(null);
  const [venter, setVenter] = useState(false);
  const [feil, setFeil] = useState("");
  const bekreft = async () => {
    if (!valg) return;
    setVenter(true);
    setFeil("");
    const r = await fetch(`/api/avvik/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handling: valg }) });
    if (!r.ok) setFeil("Kunne ikke lagre. Prøv igjen.");
    router.refresh();
    setVenter(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-dempet">Velg hva kontrollen viste.</span>
      {VALG.map((v) => (
        <label key={v.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${valg === v.id ? "border-2 border-tekst bg-gullys" : "border-kant bg-kort hover:border-tekst"}`}>
          <input type="radio" name="avklaring" value={v.id} checked={valg === v.id} onChange={() => setValg(v.id)} className="mt-1 accent-tekst" />
          <span className="flex flex-col">
            <span className={`text-[14px] font-semibold ${v.id === "svinn" ? "text-rod" : ""}`}>{v.tittel}</span>
            <span className="text-[12.5px] text-dempet">{v.tekst}</span>
          </span>
        </label>
      ))}
      <button disabled={!valg || venter} onClick={bekreft} className="knapp-gul mt-1 !h-11 !rounded-lg !border-2">
        {venter ? "Lagrer …" : "Bekreft avklaringen"}
      </button>
      {feil && <span role="alert" className="text-[13px] text-rod">{feil}</span>}
    </div>
  );
}
