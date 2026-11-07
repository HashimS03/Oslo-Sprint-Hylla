"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AvvikHandlinger({ id }: { id: string }) {
  const router = useRouter();
  const [venter, setVenter] = useState(false);
  const handling = async (h: "funnet" | "svinn") => {
    setVenter(true);
    await fetch(`/api/avvik/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handling: h }) });
    router.refresh();
    setVenter(false);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <button disabled={venter} onClick={() => handling("funnet")} className="knapp-hvit">Marker funnet</button>
      <button disabled={venter} onClick={() => handling("svinn")} className="knapp-hvit !border-rodkant text-rod">Registrer svinn</button>
    </div>
  );
}
