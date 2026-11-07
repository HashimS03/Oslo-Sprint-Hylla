import { hentState } from "@/lib/store";
import { KameraStasjon } from "./KameraStasjon";

export const dynamic = "force-dynamic";

export default async function Kamera({ searchParams }: { searchParams: Promise<{ hylle?: string; id?: string }> }) {
  const { hylle = "B3", id } = await searchParams;
  const s = await hentState();
  const hy = s.hyller.find((h) => h.id === hylle.toUpperCase()) ?? s.hyller[0];
  return (
    <KameraStasjon
      hylle={hy.id}
      kameraId={id}
      intervallMin={s.innstillinger.kameraIntervallMin}
      demo={!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.YOLO_URL || process.env.SAM3_URL) || process.env.HYLLA_TELLER === "demo"}
    />
  );
}
