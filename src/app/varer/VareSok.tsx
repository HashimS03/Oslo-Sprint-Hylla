"use client";
import Link from "next/link";
import { useState } from "react";
import { Ikon } from "@/components/ui";

type V = {
  sku: string; navn: string; swatch: string; variant: string; leverandor: string; hylle: string;
  antall: number; apneSalg: number; avvik: number; lav: boolean;
};

const STATUS = [
  { id: "", navn: "Alle" },
  { id: "lav", navn: "Lav beholdning" },
  { id: "avvik", navn: "Med avvik" },
];

export function VareSok({ varer, startStatus = "" }: { varer: V[]; startStatus?: string }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(startStatus);
  const [sortering, setSortering] = useState<"navn" | "antall">("navn");
  const liste = varer
    .filter((v) => `${v.navn} ${v.sku} ${v.hylle} ${v.leverandor}`.toLowerCase().includes(q.toLowerCase()))
    .filter((v) => (status === "lav" ? v.lav : status === "avvik" ? v.avvik > 0 : true))
    .sort((a, b) => (sortering === "antall" ? a.antall - b.antall : a.navn.localeCompare(b.navn, "nb")));
  const merke: Record<string, number> = { lav: varer.filter((v) => v.lav).length, avvik: varer.filter((v) => v.avvik > 0).length };

  return (
    <section className="kort overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-kant p-3">
        <label htmlFor="vsok" className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-kant bg-bg px-3">
          <Ikon navn="sok" size={16} className="text-dempet" />
          <input id="vsok" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søk på navn, SKU, lokasjon eller leverandør" className="flex-1 bg-transparent text-[14px] outline-none" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              aria-pressed={status === f.id}
              className={`rounded-full px-3 py-1.5 text-[13px] ${status === f.id ? "bg-tekst font-semibold text-bg" : "border border-kant bg-white hover:border-tekst"}`}
            >
              {f.navn}{merke[f.id] ? ` · ${merke[f.id]}` : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-kant bg-bg font-mono text-[10.5px] tracking-[.06em] text-dempet uppercase">
              <th scope="col" className="px-4 py-2.5 text-left font-medium"><button onClick={() => setSortering("navn")} className={`uppercase ${sortering === "navn" ? "text-tekst" : ""}`}>Vare {sortering === "navn" ? "↓" : ""}</button></th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">SKU</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Variant</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Lokasjon</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Leverandør</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Åpne ordrer</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Avvik</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium"><button onClick={() => setSortering("antall")} className={`uppercase ${sortering === "antall" ? "text-tekst" : ""}`}>På lager {sortering === "antall" ? "↑" : ""}</button></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((v) => (
              <tr key={v.sku} className="border-b border-kant last:border-0 hover:bg-bg">
                <td className="px-4 py-2.5">
                  <Link href={`/varer/${encodeURIComponent(v.sku)}`} className="flex items-center gap-2.5 font-semibold hover:underline">
                    <span className="h-7 w-7 shrink-0 rounded-md border border-kant" style={{ background: v.swatch }} />
                    {v.navn}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-dempet">{v.sku}</td>
                <td className="px-4 py-2.5 text-dempet">{v.variant || "Ikke oppgitt"}</td>
                <td className="px-4 py-2.5 font-semibold">{v.hylle || "–"}</td>
                <td className="px-4 py-2.5 text-dempet">{v.leverandor || "Ikke oppgitt"}</td>
                <td className="px-4 py-2.5 text-right font-mono">{v.apneSalg || "–"}</td>
                <td className={`px-4 py-2.5 text-right font-mono ${v.avvik ? "font-semibold text-rod" : "text-dempet"}`}>{v.avvik ? `−${v.avvik}` : "–"}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`display text-[19px] ${v.lav ? "text-rod" : ""}`} style={{ fontStretch: "100%" }}>{v.antall}</span>
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-dempet">Ingen varer passer søket.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
