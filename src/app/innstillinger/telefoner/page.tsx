import { headers } from "next/headers";
import { enhetsliste, kreverKobling } from "@/lib/enheter";
import { kortDato } from "@/lib/format";
import { Innhold, Panel, Topp } from "@/components/dash";
import { FjernEnhet, KoblingsQr } from "./Knapper";

export const dynamic = "force-dynamic";

// Legg til nye telefoner (QR-kode) og fjern telefoner som er mistet.
export default async function Telefoner() {
  const [enheter, h] = await Promise.all([enhetsliste(), headers()]);
  const denne = h.get("x-hylla-enhet");
  return (
    <>
      <Topp tittel="Telefoner" tilbake={{ href: "/innstillinger", navn: "Innstillinger" }} under="Hver telefon eller PC kobles til én gang. Etterpå husker den tilkoblingen." />
      <Innhold>
        <div className="flex max-w-[640px] flex-col gap-4 text-sm">
          <Panel tittel="Legg til en telefon">
            <KoblingsQr />
          </Panel>

          {!kreverKobling() && (
            <p className="rounded-xl bg-graa p-3 text-[12.5px] leading-snug text-dempet">
              Lokalt (npm run dev) slipper alle inn uten kobling. På Vercel må hver enhet kobles til.
            </p>
          )}

          <Panel tittel={`Koblet til (${enheter.length})`}>
            {enheter.length === 0 && <p className="p-4 text-dempet">Ingen enheter er koblet til ennå.</p>}
            {[...enheter].reverse().map((e, i) => (
              <div key={e.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i ? "border-t border-kant" : ""}`}>
                <span>
                  <b className="font-semibold">{e.navn}</b>
                  {e.id === denne && <span className="ml-1.5 text-xs text-gronn">denne</span>}
                  <br />
                  <span className="text-xs text-dempet">Koblet til {kortDato(e.opprettet)}</span>
                </span>
                <FjernEnhet id={e.id} denne={e.id === denne} />
              </div>
            ))}
          </Panel>
          <p className="text-[12.5px] leading-snug text-dempet">Har noen mistet en telefon? Fjern den her, så mister den tilgangen innen et halvt minutt.</p>
        </div>
      </Innhold>
    </>
  );
}
