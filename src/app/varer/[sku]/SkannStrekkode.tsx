"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "venter" | "godtatt" | "ferdig" | "avvist" | "avbrutt";
const TEKST: Record<Status, string> = {
  venter: "Sendt til skanneren. Venter på at noen godtar …",
  godtatt: "Skanneren er klar. Skann strekkoden på pakken …",
  ferdig: "Strekkoden er registrert.",
  avvist: "Skanneren avviste forespørselen.",
  avbrutt: "Forespørselen ble avbrutt eller gikk ut.",
};

/** «Skann med skanneren»: sender en forespørsel til skannerappen og venter til koden kommer tilbake. */
export function SkannStrekkode({ sku }: { sku: string }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [kode, setKode] = useState<string | null>(null);
  const [feil, setFeil] = useState<string | null>(null);

  const start = async () => {
    setFeil(null);
    setKode(null);
    const r = await fetch("/api/strekkode", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sku }) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (!r?.ok || !d?.id) return setFeil(d?.feil ?? "Fikk ikke sendt forespørselen");
    setId(d.id);
    setStatus("venter");
  };

  const avbryt = async () => {
    if (id) await fetch(`/api/strekkode/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "avbrutt" }) }).catch(() => null);
    setId(null);
    setStatus(null);
  };

  // Spør etter svar hvert annet sekund til skanneren er ferdig.
  useEffect(() => {
    if (!id || (status !== "venter" && status !== "godtatt")) return;
    const t = setInterval(async () => {
      const d = await fetch(`/api/strekkode/${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (!d?.status) return;
      setStatus(d.status);
      if (d.status === "ferdig") {
        setKode(d.kode ?? null);
        router.refresh();
      }
    }, 2000);
    return () => clearInterval(t);
  }, [id, status, router]);

  const aktiv = status === "venter" || status === "godtatt";
  return (
    <div className="flex flex-col gap-2 border-t border-kant px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-dempet">Registrer strekkoden med skanneren</span>
        {aktiv ? (
          <button onClick={avbryt} className="h-9 shrink-0 rounded-xl border border-kant px-3 text-[13.5px] font-semibold">Avbryt</button>
        ) : (
          <button onClick={start} className="h-9 shrink-0 rounded-xl bg-gul px-4 text-[13.5px] font-semibold text-[#1B2226] hover:brightness-95">Skann strekkode</button>
        )}
      </div>
      {status && (
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] ${status === "ferdig" ? "border-gronn/40 bg-gronnlys" : status === "avvist" || status === "avbrutt" ? "border-rodkant bg-rodlys" : "border-gulkant bg-gullys"}`}>
          {aktiv && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gul" />}
          <span>{TEKST[status]}{status === "ferdig" && kode ? <span className="ml-1 font-mono font-semibold">{kode}</span> : null}</span>
        </div>
      )}
      {feil && <span className="text-[13px] text-rod">{feil}</span>}
    </div>
  );
}
