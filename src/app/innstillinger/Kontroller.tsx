"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function lagre(endring: Record<string, unknown>) {
  await fetch("/api/innstillinger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(endring) });
}

/** Sender nullstilling og gir en lesbar feil tilbake (f.eks. manglende PIN eller skrudd av i produksjon). */
async function nullstill(tom: boolean): Promise<string | null> {
  try {
    const res = await fetch("/api/demo/nullstill", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tom }) });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { feil?: string };
    return data.feil ?? "Nullstillingen feilet";
  } catch {
    return "Fikk ikke kontakt med serveren";
  }
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

function FareKnapp({ tittel, ferdigTekst, undertekst, sporsmal, tom, ikon }: {
  tittel: string; ferdigTekst: string; undertekst: string; sporsmal: string; tom: boolean; ikon: React.ReactNode;
}) {
  const router = useRouter();
  const [ferdig, setFerdig] = useState(false);
  const [feil, setFeil] = useState("");
  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={async () => {
          if (!confirm(sporsmal)) return;
          setFeil("");
          const f = await nullstill(tom);
          if (f) return setFeil(f);
          setFerdig(true);
          router.refresh();
          setTimeout(() => setFerdig(false), 2500);
        }}
        className="flex items-center justify-between rounded-[14px] border-[1.5px] border-rodkant bg-white px-3.5 py-[13px] text-left"
      >
        <span>
          <b className="font-semibold text-rod">{ferdig ? ferdigTekst : tittel}</b>
          <br />
          <span className="text-xs text-dempet">{undertekst}</span>
        </span>
        {ikon}
      </button>
      {feil && <div role="alert" className="rounded-xl bg-rodlys px-3 py-2 text-[13px] text-rod">{feil}</div>}
    </div>
  );
}

export function NullstillDemo() {
  return (
    <FareKnapp
      tittel="Nullstill demo"
      ferdigTekst="Demoen er nullstilt"
      undertekst="Bord 1 tilbake til startbeholdningen"
      sporsmal="Nullstille demoen? Alle endringer siden start forsvinner."
      tom={false}
      ikon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B3362A" strokeWidth="2.2" aria-hidden="true"><path d="M4 4v6h6" /><path d="M20 12a8 8 0 1 1-2.3-5.7L20 9" /></svg>}
    />
  );
}

export function TomLager() {
  return (
    <FareKnapp
      tittel="Tøm lageret"
      ferdigTekst="Lageret er tomt"
      undertekst="Start uten varer, og registrer dine egne"
      sporsmal="Tømme lageret? Alle varer, hyller og all historikk slettes."
      tom
      ikon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B3362A" strokeWidth="2.2" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></svg>}
    />
  );
}
