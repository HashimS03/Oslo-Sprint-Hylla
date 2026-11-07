import Link from "next/link";
import { hentState, lagringstype } from "@/lib/store";
import { Innhold, Topp } from "@/components/dash";
import { Bryter, NullstillDemo, TerskelVelger, TomLager } from "./Kontroller";

export const dynamic = "force-dynamic";

export default async function Innstillinger() {
  const s = await hentState();
  const i = s.innstillinger;
  const reoler = new Set(s.hyller.map((h) => h.reol)).size;
  const stemme = process.env.ELEVENLABS_AGENT_ID ? "ElevenLabs" : "nettleseren";
  const Rad = ({ v, h, forste, href }: { v: string; h: React.ReactNode; forste?: boolean; href?: string }) => {
    const innhold = <><span>{v}</span><span className="text-dempet">{h}</span></>;
    const cls = `flex items-center justify-between px-3.5 py-[13px] ${forste ? "" : "border-t border-kant"}`;
    return href ? <Link href={href} className={cls}>{innhold}</Link> : <div className={cls}>{innhold}</div>;
  };
  return (
    <>
      <Topp tittel="Innstillinger" />
      <Innhold>
      <div className="flex max-w-[640px] flex-col gap-2.5 text-sm">
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

        <span className="etikett mt-1">Data</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Lagring" h={lagringstype() === "supabase" ? "Supabase" : "minne (lokal demo)"} />
          <Rad v="Oppdatering" h="hvert 10. sekund" />
        </div>

        <span className="etikett mt-1">Demo</span>
        <NullstillDemo />
        <TomLager />
      </div>
      </Innhold>
    </>
  );
}
