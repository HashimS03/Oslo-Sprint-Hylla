"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ikon } from "@/components/ui";

export function HylleSok({ hyller }: { hyller: { id: string; navn: string }[] }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const treff = q ? hyller.filter((h) => `${h.id} ${h.navn}`.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div className="relative">
      <label htmlFor="sok" className="flex h-12 items-center gap-2 rounded-xl border border-kant bg-white px-3">
        <Ikon navn="sok" size={18} className="text-dempet" />
        <input
          id="sok"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && treff[0] && router.push(`/tell/${treff[0].id}`)}
          placeholder="Søk eller skriv hyllekode"
          className="flex-1 bg-transparent text-[15px] outline-none"
          autoComplete="off"
        />
      </label>
      {treff.length > 0 && (
        <div className="kort absolute inset-x-0 top-[52px] z-10 overflow-hidden shadow-lg">
          {treff.map((h) => (
            <button key={h.id} onClick={() => router.push(`/tell/${h.id}`)} className="block w-full border-b border-kant px-3 py-2.5 text-left text-sm last:border-0">
              <b className="font-semibold">{h.id}</b> · {h.navn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
