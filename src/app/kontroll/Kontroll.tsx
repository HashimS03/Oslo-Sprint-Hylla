"use client";
import { useCallback, useEffect, useState } from "react";
import type { MatcherAvvik, MatcherAvvikType } from "@/lib/types";

type Oversikt = {
  avvik: MatcherAvvik[];
  tall: { apne: number; loestIdag: number; samsvar: number; enighet: number | null };
  tellListe: { sone: string; navn: string; uenigheter: number; apne: number }[];
  kart: { sone: string; navn: string; apne: number; rod: boolean; vare: string }[];
  vinduSek: number;
};

const TYPE: Record<MatcherAvvikType, { tittel: string; farge: string }> = {
  feil_vare: { tittel: "Feil produkt", farge: "#B93A2B" },
  feil_plass: { tittel: "Feil plass", farge: "#B93A2B" },
  uregistrert_uttak: { tittel: "Uregistrert uttak", farge: "#D9822B" },
  skannet_uten_uttak: { tittel: "Skannet uten uttak", farge: "#D9822B" },
  mulig_feilplassert: { tittel: "Mulig feilplassert", farge: "#7B3FB0" },
  gjenglemt: { tittel: "Gjenglemt vare", farge: "#7B3FB0" },
};

export function Kontroll() {
  const [d, setD] = useState<Oversikt | null>(null);
  const hent = useCallback(async () => {
    const r = await fetch("/api/matcher", { cache: "no-store" });
    if (r.ok) setD(await r.json());
  }, []);
  useEffect(() => {
    hent();
    const t = setInterval(hent, 2000);
    return () => clearInterval(t);
  }, [hent]);

  async function sett(id: string, status: MatcherAvvik["status"]) {
    await fetch(`/api/matcher/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    hent();
  }
  if (!d) return <main style={{ padding: 16 }}>Laster …</main>;

  const boks = { border: "2px solid #1B2326", borderRadius: 8, padding: 12, background: "#fff" } as const;
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, margin: "0 0 12px" }}>Kontroll</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={boks}><div style={{ fontSize: 32, fontWeight: 800 }}>{d.tall.apne}</div>Åpne avvik</div>
        <div style={boks}><div style={{ fontSize: 32, fontWeight: 800 }}>{d.tall.loestIdag}</div>Løst i dag</div>
        <div style={boks}><div style={{ fontSize: 32, fontWeight: 800 }}>{d.tall.enighet === null ? "–" : `${d.tall.enighet} %`}</div>Kamera og skanner enige</div>
      </div>

      <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Lagerkart</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {d.kart.map((k) => (
          <div key={k.sone} style={{ ...boks, minWidth: 140, background: k.rod ? "#F3C7C1" : k.apne ? "#FBE7B5" : "#CFE8D6" }}>
            <b>{k.navn}</b>
            <div style={{ fontSize: 13 }}>{k.vare || "gang"}</div>
            <div style={{ fontSize: 13 }}>{k.apne ? `${k.apne} åpne avvik` : "Ingen avvik"}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Tell i dag</h2>
      {d.tellListe.length === 0 ? <p style={{ color: "#777" }}>Ingen uenigheter ennå.</p> : (
        <ol style={{ margin: "0 0 16px", paddingLeft: 20 }}>
          {d.tellListe.map((x) => <li key={x.sone}><b>{x.navn}</b> · {x.uenigheter} uenigheter, {x.apne} åpne</li>)}
        </ol>
      )}

      <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Avvik <span style={{ fontWeight: 400, color: "#777", fontSize: 13 }}>(vindu ±{d.vinduSek} s)</span></h2>
      {d.avvik.length === 0 && <p style={{ color: "#777" }}>Normal drift er stille.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {d.avvik.map((a) => (
          <li key={a.id} style={{ ...boks, display: "flex", gap: 12, alignItems: "center", opacity: a.status === "apen" ? 1 : 0.55 }}>
            {a.bilde && <img src={a.bilde} alt="" style={{ width: 96, height: 64, objectFit: "cover", borderRadius: 4 }} />}
            <div style={{ flex: 1 }}>
              <span style={{ background: TYPE[a.type].farge, color: "#fff", borderRadius: 4, padding: "1px 8px", fontSize: 13 }}>{TYPE[a.type].tittel}</span>{" "}
              <b>{a.sone}</b> · {new Date(a.tid).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" })} · {a.status === "apen" ? "åpen" : a.status === "loest" ? "løst" : "falsk alarm"}
              <div>{a.tekst}</div>
            </div>
            {a.status === "apen" && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => sett(a.id, "loest")}>Løst</button>
                <button onClick={() => sett(a.id, "falsk_alarm")}>Falsk alarm</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
