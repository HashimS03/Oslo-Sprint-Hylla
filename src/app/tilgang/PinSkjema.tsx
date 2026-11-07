"use client";
import { useState } from "react";

export function PinSkjema({ neste }: { neste: string }) {
  const [pin, setPin] = useState("");
  const [feil, setFeil] = useState("");
  const [sjekker, setSjekker] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSjekker(true);
    setFeil("");
    try {
      const res = await fetch("/api/tilgang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) });
      const data = (await res.json().catch(() => ({}))) as { feil?: string };
      if (!res.ok) throw new Error(data.feil ?? "Klarte ikke å sjekke koden");
      window.location.assign(neste); // full innlasting, så alle sider får den nye cookien
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Noe gikk galt");
      setSjekker(false);
    }
  };

  return (
    <form onSubmit={send} className="flex flex-col gap-3">
      <label htmlFor="pin" className="text-sm font-semibold">PIN-kode</label>
      <input
        id="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="h-12 rounded-xl border border-kant bg-white px-3 text-base tracking-widest"
      />
      {feil && <div role="alert" className="rounded-xl bg-rodlys px-3 py-2.5 text-[13px] text-rod">{feil}</div>}
      <button type="submit" className="knapp-gul mt-2" disabled={sjekker || !pin}>{sjekker ? "Sjekker …" : "Lås opp"}</button>
    </form>
  );
}
