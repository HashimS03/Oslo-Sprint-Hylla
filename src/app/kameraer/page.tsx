import Link from "next/link";
import { headers } from "next/headers";
import { hentState } from "@/lib/store";
import { klokke } from "@/lib/format";
import { Side } from "@/components/Nav";
import { Ikon, StatusChip, Tilbake } from "@/components/ui";
import { QrKode } from "./QrKode";

export const dynamic = "force-dynamic";

export default async function Kameraer() {
  const s = await hentState();
  const h = await headers();
  const vert = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (vert.startsWith("localhost") ? "http" : "https");
  const forsteUtenKamera = s.hyller.find((hy) => !s.kameraer.some((k) => k.hylle === hy.id))?.id ?? s.hyller[0]?.id;
  const lenke = `${proto}://${vert}/kamera?hylle=${forsteUtenKamera}`;
  return (
    <Side>
      <Tilbake href="/innstillinger" tittel="Hyllekameraer" />
      <main className="flex flex-1 flex-col gap-3 px-5 pt-1 pb-4">
        <p className="text-[13px] leading-normal text-dempet">En gammel telefon på et stativ kan følge med på en hylle hele dagen. Endringer havner i loggen uten at noen tar bilde.</p>
        {s.kameraer.map((k) => {
          const aktiv = Date.now() - new Date(k.sistSett).getTime() < 15 * 60e3;
          return (
            <Link key={k.id} href={`/kamera?hylle=${k.hylle}&id=${k.id}`} className="kort flex items-center gap-3 p-3">
              <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[10px] ${aktiv ? "bg-skifer text-gul" : "bg-graa text-dempet"}`}><Ikon navn="kamera" size={24} /></span>
              <span className="flex-1">
                <b className="text-[15px] font-semibold">{k.navn}</b>
                <br />
                <span className="text-xs text-dempet">
                  {aktiv ? `Sist sett ${klokke(k.sistSett)} · ${k.bilderIdag} i dag${k.lader ? " · lader" : ""}` : `Frakoblet ${klokke(k.sistSett)}${k.batteri !== undefined ? ` · batteri ${k.batteri} %` : ""}`}
                </span>
              </span>
              <StatusChip status={aktiv ? "aktiv" : "offline"} />
            </Link>
          );
        })}
        <div className="mt-1 flex flex-col items-center gap-2.5 rounded-2xl border-[2.5px] border-tekst bg-white p-4">
          <b className="text-[15px] font-semibold">Legg til en kameratelefon</b>
          <QrKode tekst={lenke} />
          <span className="text-center text-[12.5px] leading-snug text-dempet">Skann koden med den andre telefonen. Den åpner kameramodus for hylle {forsteUtenKamera}.</span>
          <Link href={`/kamera?hylle=${forsteUtenKamera}`} className="text-[13px] underline">Åpne kameramodus på denne enheten</Link>
        </div>
      </main>
    </Side>
  );
}
