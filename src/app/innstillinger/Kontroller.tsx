"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function lagre(endring: Record<string, unknown>) {
  await fetch("/api/innstillinger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(endring) });
}

export function Bryter({ felt, pa }: { felt: string; pa: boolean }) {
  const [verdi, setVerdi] = useState(pa);
  return (
    <button
      role="switch"
      aria-checked={verdi}
      onClick={() => { setVerdi(!verdi); lagre({ [felt]: !verdi }); }}
      className={`relative block h-7 w-[46px] rounded-full transition ${verdi ? "bg-gronn" : "bg-[#C9D1CE]"}`}
    >
      <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all ${verdi ? "right-[3px]" : "right-[21px]"}`} />
    </button>
  );
}

export function TerskelVelger({ verdi }: { verdi: number }) {
  const [v, setV] = useState(verdi);
  return (
    <select value={v} onChange={(e) => { const n = Number(e.target.value); setV(n); lagre({ svinnTerskel: n }); }} className="bg-transparent text-dempet">
      {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n} stk</option>)}
    </select>
  );
}

export function NullstillDemo() {
  const router = useRouter();
  const [ferdig, setFerdig] = useState(false);
  return (
    <button
      onClick={async () => {
        await fetch("/api/demo/nullstill", { method: "POST" });
        setFerdig(true);
        router.refresh();
        setTimeout(() => setFerdig(false), 2500);
      }}
      className="flex items-center justify-between rounded-[14px] border-[1.5px] border-rodkant bg-white px-3.5 py-[13px] text-left"
    >
      <span>
        <b className="font-semibold text-rod">{ferdig ? "Demoen er nullstilt" : "Nullstill demo"}</b>
        <br />
        <span className="text-xs text-dempet">Bord 1 tilbake til startbeholdningen</span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B3362A" strokeWidth="2.2" aria-hidden="true"><path d="M4 4v6h6" /><path d="M20 12a8 8 0 1 1-2.3-5.7L20 9" /></svg>
    </button>
  );
}
