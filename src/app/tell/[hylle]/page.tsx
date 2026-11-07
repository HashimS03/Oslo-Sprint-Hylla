import { notFound } from "next/navigation";
import { hentState } from "@/lib/store";
import { sisteTelling, vare } from "@/lib/lager";
import { klokke } from "@/lib/format";
import { TellFlyt } from "./TellFlyt";

export const dynamic = "force-dynamic";

export default async function TellHylle({ params }: { params: Promise<{ hylle: string }> }) {
  const { hylle: id } = await params;
  const s = await hentState();
  const hylle = s.hyller.find((h) => h.id === id.toUpperCase());
  if (!hylle) notFound();
  const forrige = sisteTelling(s, hylle.id);
  const ekteTeller = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.YOLO_URL) && process.env.HYLLA_TELLER !== "demo";
  return (
    <TellFlyt
      hylle={{ id: hylle.id, navn: hylle.navn }}
      varer={hylle.innhold.map((i) => ({ sku: i.sku, navn: vare(s, i.sku)?.navn ?? i.sku, nivaa: i.nivaa }))}
      forrige={forrige ? { tid: klokke(forrige.tid), bilde: forrige.bilde } : null}
      ekteTeller={ekteTeller}
      sporNaarUsikker={s.innstillinger.sporNaarUsikker}
    />
  );
}
