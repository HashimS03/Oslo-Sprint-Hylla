import { KobleTil } from "./KobleTil";

export const dynamic = "force-dynamic";

/** Bare stier på denne siden (starter med én /), så lenken ikke kan sende folk til en annen nettside. */
function tryggSti(s: string | undefined): string {
  return s && s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

export default async function Koble({ searchParams }: { searchParams: Promise<{ k?: string; neste?: string }> }) {
  const { k, neste } = await searchParams;
  return <KobleTil kode={k} neste={tryggSti(neste)} />;
}
