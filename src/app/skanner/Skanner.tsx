"use client";
import { useEffect, useRef, useState } from "react";

type Varsel = { id: string; melding: string; tid: string };
type Modus = "plukk" | "plassering";

function pip() {
  try {
    const ctx = new AudioContext();
    for (const [i, f] of [880, 660].entries()) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.value = 0.2;
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.2);
      o.stop(ctx.currentTime + i * 0.2 + 0.15);
    }
  } catch { /* lyd er valgfritt */ }
}

export function Skanner({ varer }: { varer: { sku: string; navn: string }[] }) {
  const [modus, setModus] = useState<Modus>("plukk");
  const [skannet, setSkannet] = useState<{ tid: string; tekst: string }[]>([]);
  const [varsler, setVarsler] = useState<Varsel[]>([]);
  const [feil, setFeil] = useState("");
  // Demo-ordre med flere varer: skann dem i én tur, uansett hylle. Hver skanning krysser av en linje.
  const [ordre, setOrdre] = useState<Record<string, number>>({});
  const [plukket, setPlukket] = useState<Record<string, number>>({});
  const sist = useRef(new Date().toISOString());
  const sett = useRef(new Set<string>());

  function nyeVarsler(liste: Varsel[]) {
    const nye = liste.filter((v) => !sett.current.has(v.id));
    if (!nye.length) return;
    nye.forEach((v) => sett.current.add(v.id));
    setVarsler((x) => [...nye, ...x].slice(0, 5));
    pip();
  }

  // Skanneren spør jevnlig om varsler fra matcheren og piper når det kommer ett.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/skanner/varsel?etter=${encodeURIComponent(sist.current)}`, { cache: "no-store" });
        nyeVarsler(((await r.json()) as { varsler: Varsel[] }).varsler);
      } catch { /* prøv igjen */ }
    }, 1500);
    return () => clearInterval(t);
  }, []);

  async function skann(sku: string, navn: string) {
    setFeil("");
    const r = await fetch("/api/skanner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sku, type: modus }) });
    const j = (await r.json()) as { varsler?: Varsel[]; feil?: string };
    if (!r.ok) return setFeil(j.feil ?? "Skanningen feilet");
    if (modus === "plukk") setPlukket((p) => ({ ...p, [sku]: (p[sku] ?? 0) + 1 }));
    setSkannet((x) => [{ tid: new Date().toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" }), tekst: `${modus === "plukk" ? "Plukk" : "Plassering"} · ${navn}` }, ...x].slice(0, 8));
    nyeVarsler(j.varsler ?? []);
  }

  const ordreSkuer = Object.keys(ordre);
  const ferdig = ordreSkuer.length > 0 && ordreSkuer.every((k) => (plukket[k] ?? 0) >= ordre[k]);
  const knapp = { padding: "14px 18px", fontSize: 18, borderRadius: 8, border: "2px solid #1B2326", fontWeight: 700, cursor: "pointer" } as const;
  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>Skanner (simulator)</h1>
      {varsler.map((v) => (
        <div key={v.id} style={{ background: "#B93A2B", color: "#fff", padding: 12, borderRadius: 8, marginBottom: 8, fontWeight: 700 }}>🔴 {v.melding}</div>
      ))}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["plukk", "plassering"] as Modus[]).map((m) => (
          <button key={m} onClick={() => setModus(m)} style={{ ...knapp, flex: 1, background: m === modus ? "#F4C430" : "#fff" }}>{m === "plukk" ? "Plukk" : "Plassering"}</button>
        ))}
      </div>
      <div style={{ border: "2px solid #1B2326", borderRadius: 8, padding: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <b>Plukkliste</b>
          <button onClick={() => { setOrdre(Object.fromEntries(varer.map((v) => [v.sku, 1 + (v.sku.length % 2)]))); setPlukket({}); }}>Ny ordre</button>
        </div>
        {ordreSkuer.length === 0 && <span style={{ color: "#777" }}>Trykk «Ny ordre» for en ordre med flere varer.</span>}
        {ordreSkuer.map((k) => {
          const ok = (plukket[k] ?? 0) >= ordre[k];
          return <div key={k} style={{ textDecoration: ok ? "line-through" : "none", color: ok ? "#2E7D4F" : "inherit" }}>{ok ? "✓" : "○"} {ordre[k]} × {varer.find((v) => v.sku === k)?.navn} ({plukket[k] ?? 0}/{ordre[k]})</div>;
        })}
        {ferdig && <div style={{ color: "#2E7D4F", fontWeight: 700, marginTop: 6 }}>Ordren er plukket</div>}
      </div>
      <p style={{ margin: "0 0 6px" }}>Skann en vare, uansett hylle:</p>
      <div style={{ display: "grid", gap: 8 }}>
        {varer.map((v) => (
          <button key={v.sku} onClick={() => skann(v.sku, v.navn)} style={{ ...knapp, background: "#F4C430" }}>{v.navn}</button>
        ))}
      </div>
      {feil && <p style={{ color: "#B93A2B" }}>{feil}</p>}
      <h2 style={{ fontSize: 16, margin: "20px 0 6px" }}>Skannet</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#333" }}>
        {skannet.map((x, i) => <li key={i} style={{ padding: "4px 0", borderBottom: "1px solid #ddd" }}>{x.tid} · {x.tekst}</li>)}
      </ul>
    </main>
  );
}
