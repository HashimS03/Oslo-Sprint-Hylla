import Link from "next/link";
import { hentState, lagringstype } from "@/lib/store";
import { Side } from "@/components/Nav";
import { Tilbake } from "@/components/ui";
import { Bryter, NullstillDemo, TerskelVelger } from "./Kontroller";

export const dynamic = "force-dynamic";

export default async function Innstillinger() {
  const s = await hentState();
  const i = s.innstillinger;
  const reoler = new Set(s.hyller.map((h) => h.reol)).size;
  const aktive = s.kameraer.filter((k) => Date.now() - new Date(k.sistSett).getTime() < 15 * 60e3).length;
  const teller = process.env.HYLLA_TELLER ?? (process.env.ANTHROPIC_API_KEY ? "claude" : process.env.YOLO_URL ? "yolo" : "demo");
  const stemme = process.env.ELEVENLABS_AGENT_ID ? "ElevenLabs" : "nettleseren";
  const Rad = ({ v, h, forste, href }: { v: string; h: React.ReactNode; forste?: boolean; href?: string }) => {
    const innhold = <><span>{v}</span><span className="text-dempet">{h}</span></>;
    const cls = `flex items-center justify-between px-3.5 py-[13px] ${forste ? "" : "border-t border-kant"}`;
    return href ? <Link href={href} className={cls}>{innhold}</Link> : <div className={cls}>{innhold}</div>;
  };
  return (
    <Side>
      <Tilbake href="/" tittel="Innstillinger" />
      <main className="flex flex-1 flex-col gap-2.5 px-5 pt-1 pb-4 text-sm">
        <span className="etikett">Lager</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Lager" h={i.lager.replace("Lager ", "")} />
          <Rad v="Reoler og hyller" h={`${reoler} reoler · ${s.hyller.length} hyller`} />
          <div className="flex items-center justify-between border-t border-kant px-3.5 py-[13px]"><span>Varsle ved mulig svinn fra</span><TerskelVelger verdi={i.svinnTerskel} /></div>
        </div>

        <span className="etikett mt-1">Stemme</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Språk" h="Norsk bokmål" />
          <Rad v="Stemme fra" h={stemme} />
          <div className="flex items-center justify-between border-t border-kant px-3.5 py-[13px]"><span>Svar høyt</span><Bryter felt="svarHoyt" pa={i.svarHoyt} /></div>
        </div>

        <span className="etikett mt-1">Kamera</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Hyllekameraer" h={`${aktive} aktiv ›`} href="/kameraer" />
          <div className="flex items-center justify-between border-t border-kant px-3.5 py-[13px]"><span>Spør meg når Hylla er usikker</span><Bryter felt="sporNaarUsikker" pa={i.sporNaarUsikker} /></div>
          <Rad v="Teller" h={teller} />
          <Rad v="Lagring" h={lagringstype() === "supabase" ? "Supabase" : "minne (lokal demo)"} />
        </div>

        <span className="etikett mt-1">Demo</span>
        <NullstillDemo />
      </main>
    </Side>
  );
}
