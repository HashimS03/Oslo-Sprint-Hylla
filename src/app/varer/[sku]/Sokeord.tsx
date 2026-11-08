"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Søketeksten kameraet (SAM 3.1) leter etter. SAM forstår bare engelsk, for eksempel «red instant noodle packet». */
export function Sokeord({ sku, naa, forslag }: { sku: string; naa: string; forslag: string }) {
  const router = useRouter();
  const [tekst, setTekst] = useState(naa);
  const [lagrer, setLagrer] = useState(false);
  const [lagret, setLagret] = useState(false);

  const lagre = async () => {
    setLagrer(true);
    setLagret(false);
    const r = await fetch(`/api/varer/${encodeURIComponent(sku)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: tekst }),
    }).catch(() => null);
    setLagrer(false);
    if (r?.ok) {
      setLagret(true);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-kant p-4">
      <label htmlFor="sokeord" className="text-[13px] font-semibold">Kameraet leter etter (engelsk)</label>
      <div className="flex gap-2">
        <input
          id="sokeord"
          value={tekst}
          onChange={(e) => { setTekst(e.target.value); setLagret(false); }}
          placeholder={forslag}
          className="h-10 min-w-0 flex-1 rounded-xl border border-kant bg-kort px-3 text-[14px]"
        />
        <button onClick={lagre} disabled={lagrer || tekst.trim() === naa} className="knapp-gul h-10 rounded-xl px-4 text-[14px] font-semibold disabled:opacity-50">
          {lagrer ? "Lagrer …" : "Lagre"}
        </button>
      </div>
      <span className="text-[12.5px] text-dempet">
        {lagret ? "Lagret. Neste bilde fra kameraet bruker den nye teksten." : `Tomt felt betyr at kameraet bruker «${forslag}».`}
      </span>
    </div>
  );
}
