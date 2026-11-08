"use client";
import { useEffect, useRef, useState } from "react";

function enhetsnavn(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows-PC";
  return "Nettleser";
}

async function koble(body: { kode?: string; lederkode?: string }): Promise<string | null> {
  const res = await fetch("/api/enheter/koble", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, navn: enhetsnavn() }),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { feil?: string };
  return data.feil ?? "Kunne ikke koble til";
}

export function KobleTil({ kode, neste }: { kode?: string; neste: string }) {
  const [status, setStatus] = useState<"venter" | "kobler" | "feil">(kode ? "kobler" : "venter");
  const [feil, setFeil] = useState("");
  const [lederkode, setLederkode] = useState("");
  const startet = useRef(false);

  // Kom vi hit fra en QR-kode, kobles enheten til med en gang.
  useEffect(() => {
    if (!kode || startet.current) return;
    startet.current = true;
    koble({ kode }).then((f) => {
      if (!f) return window.location.replace(neste);
      setFeil(f);
      setStatus("feil");
    });
  }, [kode, neste]);

  const medLederkode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("kobler");
    const f = await koble({ lederkode });
    if (!f) return window.location.replace(neste);
    setFeil(f);
    setStatus("feil");
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-5 px-6 py-10">
      <div>
        <h1 className="display text-[30px]">Koble til Hylla</h1>
        <p className="mt-2 text-[15px] leading-normal text-dempet">
          {kode && status === "kobler" ? "Kobler til …" : "Denne enheten er ikke koblet til ennå. Det gjør du bare én gang."}
        </p>
      </div>

      {status === "feil" && <p className="rounded-xl border border-rodkant bg-kort p-3 text-sm text-rod">{feil}</p>}

      {/* Skjules bare mens en QR-kode kobler til. Ellers blir lederkode-feltet stående åpent ved feil. */}
      {!(kode && status === "kobler") && (
        <>
          <div className="kort flex flex-col gap-2 p-4 text-[15px] leading-normal">
            <b className="font-semibold">Slik gjør du</b>
            <span>1. Gå til driftslederen.</span>
            <span>2. Driftslederen åpner <b>Innstillinger → Telefoner</b> i dashboardet. Der vises en QR-kode.</span>
            <span>3. Skann QR-koden: med «Koble til» i Hylla-appen, eller med kameraet hvis du vil bruke dashboardet på denne enheten.</span>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-dempet">Er du driftsleder og setter opp den første enheten?</summary>
            <form onSubmit={medLederkode} className="mt-3 flex flex-col gap-2">
              <label htmlFor="lederkode" className="text-[13px] font-semibold">Lederkode</label>
              <input
                id="lederkode"
                type="password"
                autoComplete="off"
                value={lederkode}
                onChange={(e) => setLederkode(e.target.value)}
                className="rounded-xl border-[1.5px] border-kant bg-kort px-3 py-2.5 text-[15px]"
              />
              <button className="knapp-gul" disabled={!lederkode || status === "kobler"}>{status === "kobler" ? "Kobler til …" : "Koble til"}</button>
            </form>
          </details>
        </>
      )}
    </main>
  );
}
