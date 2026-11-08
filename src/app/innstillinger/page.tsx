import Link from "next/link";
import { hentState, lagringstype } from "@/lib/store";
import { Innhold, Topp } from "@/components/dash";
import { Bryter, NullstillDemo, TerskelVelger, TomLager } from "./Kontroller";

export const dynamic = "force-dynamic";

export default async function Innstillinger() {
  const s = await hentState();
  const i = s.innstillinger;
  const reoler = new Set(s.hyller.map((h) => h.reol)).size;
  const kamSoner = s.hyller.filter((h) => h.sone).length;
  const sistSett = Object.values(s.soneSett ?? {}).sort().at(-1);
  const kameraPaa = !!sistSett && Date.now() - Date.parse(sistSett) < 60_000;
  const sist = sistSett ? new Date(sistSett).toLocaleString("nb-NO", { timeZone: "Europe/Oslo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "aldri";
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

        <span className="etikett mt-1">Takkamera</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Status" h={<span className="flex items-center gap-1.5"><span className={`inline-block h-2 w-2 rounded-full ${kameraPaa ? "bg-gronn" : "bg-kant"}`} />{kameraPaa ? "På" : `Av · sist sett ${sist}`}</span>} />
          <Rad v="Soner" h={`${kamSoner} soner`} />
          <Link href="/tak" className="flex items-center justify-between border-t border-kant px-3.5 py-[13px] font-semibold hover:bg-graa">
            <span>Åpne takkamera</span><span className="text-dempet">›</span>
          </Link>
        </div>

        <span className="etikett mt-1">Stemme</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Språk" h="Norsk bokmål" />
          <Rad v="Stemme fra" h={stemme} />
          <div className="flex items-center justify-between border-t border-kant px-3.5 py-[13px]"><span>Svar høyt</span><Bryter felt="svarHoyt" pa={i.svarHoyt} /></div>
        </div>

        <span className="etikett mt-1">Tilgang</span>
        <div className="kort overflow-hidden">
          <Link href="/innstillinger/telefoner" className="flex items-center justify-between px-3.5 py-[13px] font-semibold hover:bg-graa">
            <span>Telefoner</span><span className="text-dempet">{s.enheter?.length ?? 0} koblet til ›</span>
          </Link>
        </div>

        <span className="etikett mt-1">Data</span>
        <div className="kort overflow-hidden">
          <Rad forste v="Lagring" h={lagringstype() === "supabase" ? "Supabase" : "minne (lokal demo)"} />
          <Rad v="Oppdatering" h="hvert 5. sekund" />
        </div>

        <span className="etikett mt-1">Demo</span>
        <NullstillDemo />
        <TomLager />
      </div>
      </Innhold>
    </>
  );
}
