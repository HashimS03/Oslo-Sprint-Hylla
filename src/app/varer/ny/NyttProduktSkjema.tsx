"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { filTilJpeg } from "@/lib/bilde";
import { Ikon } from "@/components/ui";

const FARGER = [
  { navn: "svart", hex: "#1E1E20" },
  { navn: "hvit", hex: "#E8E6E1" },
  { navn: "grå", hex: "#9AA3A6" },
  { navn: "rød", hex: "#B3362A" },
  { navn: "blå", hex: "#2F5D8A" },
  { navn: "grønn", hex: "#2F7D55" },
  { navn: "gul", hex: "#F4C430" },
  { navn: "oransje", hex: "#E07B2A" },
  { navn: "brun", hex: "#8A5A3B" },
];
const STR = ["S", "M", "L", "XL", "One size"];

export function NyttProduktSkjema({ hyller }: { hyller: string[] }) {
  const router = useRouter();
  const fil = useRef<HTMLInputElement>(null);
  const [navn, setNavn] = useState("");
  const [sku, setSku] = useState("");
  const [hylle, setHylle] = useState(hyller[hyller.length - 1] ?? "");
  const [str, setStr] = useState("M");
  const [farge, setFarge] = useState(FARGER[2]);
  const [bilder, setBilder] = useState<string[]>([]);
  const [antall, setAntall] = useState("");
  const [prompt, setPrompt] = useState("");
  const [feil, setFeil] = useState("");
  const [lagrer, setLagrer] = useState(false);

  const foreslattSku = () => {
    const a = navn.replace(/[^a-zA-ZæøåÆØÅ ]/g, "").split(" ").filter(Boolean);
    return [a[0]?.slice(0, 2), farge.navn.slice(0, 3), str === "One size" ? "" : str].filter(Boolean).join("-").toUpperCase().replace(/[ÆØÅ]/g, (c) => ({ Æ: "AE", Ø: "O", Å: "A" })[c]!);
  };

  const lagre = async () => {
    setLagrer(true);
    setFeil("");
    const res = await fetch("/api/varer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        navn: navn || `${farge.navn} vare ${str}`,
        sku: sku || foreslattSku(),
        hylle,
        storrelse: str,
        farge: farge.navn,
        swatch: farge.hex,
        bilder,
        antall: Number(antall) || 0,
        prompt,
        beskrivelse: `${navn}, ${farge.navn}, størrelse ${str}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeil(data.feil ?? "Kunne ikke lagre");
      setLagrer(false);
      return;
    }
    router.push(`/varer/${data.sku}`);
    router.refresh();
  };

  const felt = "h-[46px] w-full min-w-0 rounded-xl border border-kant bg-kort px-3 text-[15px]";
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-3 pt-4 pb-2">
        <Link href="/varer" aria-label="Avbryt" className="flex h-11 w-11 items-center justify-center"><Ikon navn="lukk" /></Link>
        <h1 className="display text-[26px]">Nytt produkt</h1>
      </header>
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-1 pb-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Bilder, så Hylla kjenner den igjen</span>
          <div className="flex gap-2">
            {bilder.map((b, i) => (
              <button key={i} onClick={() => setBilder(bilder.filter((_, j) => j !== i))} className="h-[76px] w-[76px] overflow-hidden rounded-xl" aria-label="Fjern bilde">
                <img src={b} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
            {bilder.length < 3 && (
              <button onClick={() => fil.current?.click()} aria-label="Ta bilde" className="flex h-[76px] w-[76px] items-center justify-center rounded-xl border-2 border-dashed border-[#9AA3A6] text-dempet">
                <Ikon navn="kamera" size={24} />
              </button>
            )}
          </div>
          <span className="text-xs text-dempet">{bilder.length} av 3 bilder. Ta ett brettet og ett stablet.</span>
          <input ref={fil} type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setBilder([...bilder, await filTilJpeg(f, 768)]);
            e.target.value = "";
          }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="navn" className="text-[13px] font-semibold">Navn</label>
          <input id="navn" value={navn} onChange={(e) => setNavn(e.target.value)} placeholder="Hettegenser grå" className={felt} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sku" className="text-[13px] font-semibold">SKU</label>
            <input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} placeholder={foreslattSku() || "HG-GRA-M"} className={`${felt} font-mono text-sm`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hylle" className="text-[13px] font-semibold">Hylle</label>
            <input id="hylle" list="hyller" value={hylle} onChange={(e) => setHylle(e.target.value.toUpperCase())} className={felt} />
            <datalist id="hyller">{hyller.map((h) => <option key={h} value={h} />)}</datalist>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="antall" className="text-[13px] font-semibold">Antall på hylla nå</label>
            <input id="antall" inputMode="numeric" value={antall} onChange={(e) => setAntall(e.target.value.replace(/\D/g, ""))} placeholder="0" className={felt} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt" className="text-[13px] font-semibold">På engelsk (for kameraet)</label>
            <input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="red soda can" className={felt} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Størrelse</span>
          <div className="flex gap-1.5">
            {STR.map((s) => (
              <button key={s} onClick={() => setStr(s)} className={`h-10 flex-1 rounded-[10px] text-sm ${s === str ? "bg-tekst font-semibold text-bg" : "border border-kant bg-kort"}`}>{s === "One size" ? "OS" : s}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Farge</span>
          <div className="flex flex-wrap gap-2.5">
            {FARGER.map((f) => (
              <button key={f.navn} onClick={() => setFarge(f)} aria-label={f.navn} className="h-[34px] w-[34px] rounded-full border border-[#BDBAB4]" style={{ background: f.hex, outline: f === farge ? "2.5px solid #1B2226" : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-gullys px-3 py-2.5 text-[12.5px]">Tips: legg inn 2–3 bilder av varen. Da kjenner Hylla den lettere igjen på hyllebildene.</div>
        {feil && <div className="rounded-xl bg-rodlys px-3 py-2.5 text-[13px] text-rod">{feil}</div>}
      </main>
      <div className="px-5 pt-1 pb-8">
        <button className="knapp-gul" onClick={lagre} disabled={lagrer || !navn || !hylle}>{lagrer ? "Lagrer …" : "Lagre produkt"}</button>
      </div>
    </div>
  );
}
