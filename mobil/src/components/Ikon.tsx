import Svg, { Circle, Path, Rect } from "react-native-svg";
import { F } from "@/lib/tema";

export type IkonNavn =
  | "kamera" | "mikrofon" | "pluss" | "pil" | "pilHoyre" | "tilbake" | "lukk" | "advarsel" | "sok" | "tannhjul"
  | "skann" | "hjem" | "logg" | "varer" | "hoyttaler" | "lykt" | "lyktAv" | "pilOpp" | "hake" | "telefon" | "skjorte";

export function Ikon({ navn, size = 22, farge = F.tekst, tykk = 2 }: { navn: IkonNavn; size?: number; farge?: string; tykk?: number }) {
  const p = { stroke: farge, strokeWidth: tykk, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {tegning(navn, p, farge)}
    </Svg>
  );
}

function tegning(navn: IkonNavn, p: object, farge: string) {
  switch (navn) {
    case "kamera": return <><Path {...p} d="M4 8h3l2-3h6l2 3h3v11H4z" /><Circle {...p} cx="12" cy="13" r="3.5" /></>;
    case "mikrofon": return <><Rect {...p} x="9" y="3" width="6" height="12" rx="3" /><Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>;
    case "pluss": return <Path {...p} d="M12 5v14M5 12h14" />;
    case "pil": return <Path {...p} d="M9 5l7 7-7 7" />;
    case "pilHoyre": return <Path {...p} d="M4 12h15M13 6l6 6-6 6" />;
    case "tilbake": return <Path {...p} d="M20 12H5M11 6l-6 6 6 6" />;
    case "lukk": return <Path {...p} d="M6 6l12 12M18 6L6 18" />;
    case "advarsel": return <><Path {...p} d="M12 3l9 16H3z" /><Path {...p} d="M12 10v4M12 17v.5" /></>;
    case "sok": return <><Circle {...p} cx="11" cy="11" r="7" /><Path {...p} d="M20 20l-4-4" /></>;
    case "tannhjul": return <><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>;
    case "skann": return <Path {...p} d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />;
    case "hjem": return <Path {...p} d="M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />;
    case "logg": return <Path {...p} d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5" />;
    case "varer": return <><Path {...p} d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><Path {...p} d="M4 7.5l8 4.5 8-4.5M12 12v9" /></>;
    case "hoyttaler": return <><Path {...p} d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><Path {...p} d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>;
    case "lykt": return <Path {...p} d="M8 3h8v4l-2 3v11h-4V10L8 7zM8 7h8" />;
    case "lyktAv": return <><Path {...p} d="M8 3h8v4l-2 3v11h-4V10L8 7zM8 7h8" /><Path {...p} d="M4 4l16 16" /></>;
    case "pilOpp": return <Path {...p} d="M7 17L17 7M9 7h8v8" />;
    case "hake": return <Path {...p} d="M5 12.5l4.5 4.5L19 7.5" />;
    case "telefon": return <><Rect {...p} x="7" y="2.5" width="10" height="19" rx="2" /><Path {...p} d="M11 18.5h2" /></>;
    case "skjorte": return <Path d="M8 3l-5 3 2 5 3-1.5V21h8V9.5l3 1.5 2-5-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z" fill={farge} />;
  }
}
