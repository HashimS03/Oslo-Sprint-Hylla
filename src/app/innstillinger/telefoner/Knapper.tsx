"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const klokke = (iso: string) => new Date(iso).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });

/**
 * QR-koden for å koble til en ny telefon. Hentes én gang her i nettleseren, ikke på serveren:
 * dashboardet oppdaterer siden hvert 3. sekund, og da ville koden ellers byttet hele tiden.
 */
export function KoblingsQr() {
  const [kode, setKode] = useState<{ svg: string; utloper: string } | null>(null);
  const [feil, setFeil] = useState("");

  const ny = useCallback(async () => {
    const res = await fetch("/api/enheter/kode", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { svg?: string; utloper?: string; feil?: string };
    if (res.ok && data.svg && data.utloper) {
      setKode({ svg: data.svg, utloper: data.utloper });
      setFeil("");
    } else setFeil(data.feil ?? "Kunne ikke lage QR-kode");
  }, []);

  useEffect(() => {
    let aktiv = true;
    fetch("/api/enheter/kode", { method: "POST" })
      .then((r) => r.json())
      .then((d: { svg?: string; utloper?: string; feil?: string }) => {
        if (!aktiv) return;
        if (d.svg && d.utloper) setKode({ svg: d.svg, utloper: d.utloper });
        else setFeil(d.feil ?? "Kunne ikke lage QR-kode");
      })
      .catch(() => aktiv && setFeil("Kunne ikke lage QR-kode"));
    return () => {
      aktiv = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* SVG-en lages av qrcode-biblioteket på serveren fra vår egen lenke, ikke fra brukerdata. */}
      {kode ? (
        <div className="h-[200px] w-[200px] rounded-lg bg-white p-1" dangerouslySetInnerHTML={{ __html: kode.svg }} />
      ) : (
        <div className="h-[200px] w-[200px] rounded-lg bg-graa" />
      )}
      <span className="text-center text-[13px] leading-snug text-dempet">
        {feil || (kode ? `Skann koden med kameraet på den nye telefonen, eller med «Koble til» i Hylla-appen. Koden virker til ${klokke(kode.utloper)}.` : "Lager kode …")}
      </span>
      <button onClick={ny} className="text-[13px] underline">Lag ny kode</button>
    </div>
  );
}

export function FjernEnhet({ id, denne }: { id: string; denne: boolean }) {
  const router = useRouter();
  const [jobber, setJobber] = useState(false);
  return (
    <button
      disabled={jobber}
      onClick={async () => {
        const tekst = denne
          ? "Dette er enheten du bruker nå. Fjerner du den, må den kobles til på nytt med QR-kode. Fortsette?"
          : "Fjerne denne enheten? Den mister tilgangen til Hylla.";
        if (!confirm(tekst)) return;
        setJobber(true);
        await fetch(`/api/enheter/${encodeURIComponent(id)}/fjern`, { method: "POST" });
        if (denne) window.location.replace("/koble");
        else router.refresh();
        setJobber(false);
      }}
      className="shrink-0 rounded-lg border border-rodkant px-2.5 py-1.5 text-xs font-semibold text-rod disabled:opacity-50"
    >
      {jobber ? "Fjerner …" : "Fjern"}
    </button>
  );
}
