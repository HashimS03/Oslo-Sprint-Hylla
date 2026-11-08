"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Legger inn tre tilfeldige bestillinger, så pitchen har pakkeoppgaver å vise. */
export function DemoBestillinger() {
  const router = useRouter();
  const [venter, setVenter] = useState(false);
  const [feil, setFeil] = useState("");
  return (
    <span className="flex items-center gap-2">
      {feil && <span className="text-[12.5px] text-rod">{feil}</span>}
      <button
        disabled={venter}
        onClick={async () => {
          setVenter(true);
          setFeil("");
          const r = await fetch("/api/ordrer/demo", { method: "POST" }).catch(() => null);
          if (!r?.ok) setFeil((await r?.json().catch(() => null))?.feil ?? "Fikk ikke laget bestillinger");
          router.refresh();
          setVenter(false);
        }}
        className="h-8 rounded-lg bg-gul px-3 text-[13px] font-semibold text-[#1B2226] hover:brightness-95 disabled:opacity-50"
      >
        {venter ? "Lager …" : "Lag demo-bestillinger"}
      </button>
    </span>
  );
}
