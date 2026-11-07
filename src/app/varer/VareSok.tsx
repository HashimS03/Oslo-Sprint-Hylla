"use client";
import Link from "next/link";
import { useState } from "react";
import { Ikon } from "@/components/ui";

type V = { sku: string; navn: string; swatch: string; hylle: string; antall: number };

export function VareSok({ varer }: { varer: V[] }) {
  const [q, setQ] = useState("");
  const liste = varer.filter((v) => `${v.navn} ${v.sku} ${v.hylle}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <label htmlFor="vsok" className="flex h-[46px] items-center gap-2 rounded-xl border border-kant bg-white px-3">
        <Ikon navn="sok" size={18} className="text-dempet" />
        <input id="vsok" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søk på navn eller SKU" className="flex-1 bg-transparent text-[15px] outline-none" />
      </label>
      <div className="kort overflow-hidden">
        {liste.map((v, i) => (
          <Link key={v.sku} href={`/varer/${v.sku}`} className={`flex items-center gap-3 px-3 py-2.5 ${i ? "border-t border-kant" : ""}`}>
            <span className="h-[38px] w-[38px] shrink-0 rounded-lg border border-kant" style={{ background: v.swatch }} />
            <span className="flex-1 text-sm">
              <b className="font-semibold">{v.navn}</b>
              <br />
              <span className="font-mono text-[11px] text-dempet">{v.sku}{v.hylle ? ` · ${v.hylle}` : ""}</span>
            </span>
            <span className={`display text-xl ${v.antall <= 3 ? "text-rod" : ""}`} style={{ fontStretch: "100%" }}>{v.antall}</span>
          </Link>
        ))}
        {liste.length === 0 && <p className="p-4 text-center text-sm text-dempet">Ingen varer passer søket.</p>}
      </div>
    </>
  );
}
