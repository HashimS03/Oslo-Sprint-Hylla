"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { filTilBilde, tilJpeg } from "@/lib/bilde";
import type { Bokse, KameraHendelse, Sone } from "@/lib/types";
import { Panel, Tabell, TomRad, TypeChip } from "@/components/dash";

type SoneInfo = { id: string; navn: string; sone: Sone; skuer: string[]; varer: string[] };
type Katalog = { sku: string; navn: string }[];
type SoneSvar = {
  sone: string; navn: string; status: string; bevegelse: number; endring: number;
  funnet?: { sku: string; navn: string; antall: number; hjemmehorende: boolean; bokser: Bokse[] }[];
  hendelser?: KameraHendelse[]; feil?: string;
};

const STATUS: Record<string, string> = {
  bevegelse: "Bevegelse", stille: "Venter på ro", uendret: "Uendret", teller: "Teller", pause: "Pause", talt: "Talt", feil: "Feil",
};

export function TakTest({ kameraId, soner, katalog }: { kameraId: string; soner: SoneInfo[]; katalog: Katalog }) {
  const router = useRouter();
  const [lagrer, setLagrer] = useState(false);
  async function lagreSone(id: string, skuer: string[]) {
    setLagrer(true);
    setFeil("");
    const r = await fetch(`/api/hyller/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ skuer }) });
    if (!r.ok) setFeil(((await r.json()) as { feil?: string }).feil ?? "Kunne ikke lagre");
    setLagrer(false);
    router.refresh();
  }
  const video = useRef<HTMLVideoElement>(null);
  const bildeRef = useRef<HTMLImageElement | null>(null);
  const strom = useRef<MediaStream | null>(null);
  const opptatt = useRef(false);
  const [kilde, setKilde] = useState<"ingen" | "kamera" | "bilde">("ingen");
  const [forhandsvisning, setForhandsvisning] = useState<string>("");
  const [auto, setAuto] = useState(true);
  const [svar, setSvar] = useState<SoneSvar[]>([]);
  const [hendelser, setHendelser] = useState<KameraHendelse[]>([]);
  const [feil, setFeil] = useState("");
  const [teller, setTeller] = useState(false);

  const hentHendelser = useCallback(async () => {
    const r = await fetch("/api/kamera/tak", { cache: "no-store" });
    if (r.ok) setHendelser(((await r.json()) as { hendelser: KameraHendelse[] }).hendelser.filter((h) => h.kamera === kameraId).reverse());
  }, [kameraId]);

  useEffect(() => { hentHendelser(); }, [hentHendelser]);
  useEffect(() => () => strom.current?.getTracks().forEach((t) => t.stop()), []);

  async function startKamera() {
    setFeil("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false });
      strom.current = s;
      setKilde("kamera");
      requestAnimationFrame(async () => {
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => undefined); }
      });
    } catch {
      setFeil("Fikk ikke tilgang til kamera. Last opp et bilde i stedet.");
    }
  }

  async function velgBilde(fil?: File) {
    if (!fil) return;
    strom.current?.getTracks().forEach((t) => t.stop());
    const img = await filTilBilde(fil);
    bildeRef.current = img;
    setForhandsvisning(img.src);
    setKilde("bilde");
  }

  const send = useCallback(async (tving: boolean) => {
    const el = kilde === "kamera" ? video.current : bildeRef.current;
    if (!el || opptatt.current) return;
    opptatt.current = true;
    setTeller(true);
    setFeil("");
    try {
      const bilde = tilJpeg(el, 1568, 0.85);
      const liten = tilJpeg(el, 320, 0.6);
      const r = await fetch("/api/kamera/tak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kameraId, bilde, liten, tving }),
      });
      const j = (await r.json()) as { soner?: SoneSvar[]; feil?: string };
      if (!r.ok) throw new Error(j.feil ?? "Feil fra serveren");
      setSvar(j.soner ?? []);
      await hentHendelser();
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      opptatt.current = false;
      setTeller(false);
    }
  }, [kilde, kameraId, hentHendelser]);

  // Automatisk modus: send et bilde hvert 2. sekund, serveren avgjør per sone om det er verdt å telle.
  useEffect(() => {
    if (!auto || kilde !== "kamera") return;
    const t = setInterval(() => send(false), 2000);
    return () => clearInterval(t);
  }, [auto, kilde, send]);

  const tid = (iso: string) => new Date(iso).toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const knapp = "flex h-10 items-center rounded-lg border border-kant bg-kort px-3.5 text-[13.5px] font-semibold hover:border-tekst disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={startKamera} className="knapp-gul !h-10 !w-auto !rounded-lg !border-2 px-4 !text-[13.5px]">{kilde === "kamera" ? "Kameraet er på" : "Start kamera"}</button>
        <label className={`${knapp} cursor-pointer`}>
          Last opp bilde
          <input type="file" accept="image/*" hidden onChange={(e) => velgBilde(e.target.files?.[0])} />
        </label>
        <button onClick={() => send(true)} disabled={kilde === "ingen" || teller} className={knapp}>{teller ? "Teller …" : "Tell nå"}</button>
        <label className="ml-auto flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-kant bg-kort px-3.5 text-[13.5px]">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-tekst" />
          Tell automatisk hvert 2. sekund
        </label>
      </div>
      {feil && <div role="alert" className="rounded-lg border border-rodkant bg-rodlys px-4 py-2.5 text-[13.5px] text-rod">{feil}</div>}

      <Panel tittel="Kamerabilde" handling={<span className="font-mono text-[12px] text-dempet">{kameraId} · {soner.length} soner</span>}>
        <div className="p-3">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-skifer">
            {kilde === "kamera" && <video ref={video} playsInline muted className="h-full w-full object-fill" />}
            {kilde === "bilde" && <img src={forhandsvisning} alt="Opplastet bilde" className="h-full w-full object-fill" />}
            {kilde === "ingen" && (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-white/60">
                <span className="text-[15px] font-semibold text-white/80">Kameraet er av</span>
                <span className="text-[13px]">Start kameraet eller last opp et bilde av hyllene.</span>
              </div>
            )}
            {/* En boks per funn med navn og sikkerhet. Rødt = vare som ikke hører hjemme i sonen. */}
            {svar.flatMap((s) => (s.funnet ?? []).flatMap((f) => f.bokser.map((b, i) => (
              <div
                key={`${s.sone}-${f.sku}-${i}`}
                className={`pointer-events-none absolute box-border border-2 ${f.hjemmehorende ? "border-[#3DDC84]" : "border-[#FF5A4F]"}`}
                style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.b * 100}%`, height: `${b.h * 100}%` }}
              >
                <span className={`absolute -top-[18px] -left-[2px] px-1 font-mono text-[10.5px] whitespace-nowrap text-black ${f.hjemmehorende ? "bg-[#3DDC84]" : "bg-[#FF5A4F]"}`}>
                  {f.navn} {Math.round(b.c * 100)} %
                </span>
              </div>
            ))))}
            {soner.map((z) => {
              const s = svar.find((x) => x.sone === z.id);
              const gang = z.sone.type === "gang";
              return (
                <div
                  key={z.id}
                  className={`absolute box-border flex flex-col items-start gap-0.5 border-[3px] p-2 text-[12.5px] text-white [text-shadow:0_1px_3px_#000] ${gang ? "border-dashed border-gul/80" : "border-gul"}`}
                  style={{ left: `${z.sone.x * 100}%`, top: `${z.sone.y * 100}%`, width: `${z.sone.b * 100}%`, height: `${z.sone.h * 100}%` }}
                >
                  <span className="rounded-md bg-gul px-1.5 py-px font-display text-[13px] font-extrabold text-[#1B2226] [text-shadow:none]">{z.navn}</span>
                  {!gang && <span className="opacity-85">{z.varer.join(", ")}</span>}
                  {s && <span className="font-mono text-[11px] uppercase opacity-90">{STATUS[s.status] ?? s.status}</span>}
                  {s?.funnet?.filter((f) => f.antall > 0).map((f) => (
                    <span key={f.sku} className={f.hjemmehorende ? "text-[#9BE3B3]" : "font-semibold text-[#FF9A8F]"}>{f.antall} × {f.navn}{f.hjemmehorende ? "" : " (feil sted)"}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel tittel="Varer per sone">
          <div className="flex flex-col gap-3 p-4">
            <p className="text-[13px] text-dempet">Velg hvilke varer hver sone skal kjenne igjen. Endringen nullstiller utgangspunktet for sonen.</p>
            {soner.filter((z) => z.sone.type !== "gang").map((z) => (
              <fieldset key={z.id} disabled={lagrer} className="flex flex-col gap-2 disabled:opacity-60">
                <legend className="etikett mb-1.5">{z.navn}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {katalog.filter((v) => ["REDBULL", "COLA-BOKS", "BRUS-RED", "VANN-KLAR"].includes(v.sku) || z.skuer.includes(v.sku)).map((v) => {
                    const pa = z.skuer.includes(v.sku);
                    return (
                      <label key={v.sku} className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] ${pa ? "border-2 border-tekst bg-gullys font-semibold" : "border-kant bg-kort hover:border-tekst"}`}>
                        <input
                          type="checkbox"
                          checked={pa}
                          onChange={(e) => lagreSone(z.id, e.target.checked ? [...z.skuer, v.sku] : z.skuer.filter((x) => x !== v.sku))}
                          className="accent-tekst"
                        />
                        {v.navn}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </Panel>

        <Panel tittel="Kamerahendelser" handling={<span className="font-mono text-[12px] text-dempet">Vises også i Hendelser</span>}>
          <Tabell hode={["Tid", "Hva", "Sone", "Vare", "Antall", "Sikkerhet"]} hoyre={[4, 5]}>
            {hendelser.slice(0, 30).map((h) => (
              <tr key={h.id}>
                <td className="font-mono text-[12px] whitespace-nowrap text-dempet">{tid(h.tid)}</td>
                <td><TypeChip type={`kamera_${h.type}`} /></td>
                <td className="font-semibold">{h.sone}</td>
                <td>
                  {h.sku ? katalog.find((v) => v.sku === h.sku)?.navn ?? h.sku : <span className="text-dempet">Ukjent</span>}
                  {h.hjemmehorende === false && <span className="ml-2 text-[12px] font-semibold text-rod">mulig feilplassert</span>}
                </td>
                <td className="text-right font-mono">{h.antall}</td>
                <td className="text-right font-mono text-dempet">{Math.round(h.sikkerhet * 100)} %</td>
              </tr>
            ))}
            {hendelser.length === 0 && <TomRad kolonner={6}>Ingen ennå. Det første bildet setter bare utgangspunktet.</TomRad>}
          </Tabell>
        </Panel>
      </div>
    </>
  );
}
