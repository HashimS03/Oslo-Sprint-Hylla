import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { Kort as KortData } from "@/lib/typer";
import { F, S } from "@/lib/tema";
import { fortegn, klokke } from "@/lib/format";
import { Ikon } from "./Ikon";
import { Display, Kort, Mono, Rad, Swatch, Txt } from "./ui";

/** Kortene Spør Hylla viser under svaret. */
export function KortVisning({ kort }: { kort: KortData }) {
  if (kort.type === "vare") {
    const hylle = kort.hyller[0];
    const tall: [string, string][] = kort.po
      ? [[String(kort.po.bestilt), "bestilt"], [fortegn(-kort.po.plukket), "plukket"], [String(hylle?.antall ?? kort.beholdning), hylle ? `på ${hylle.hylle}` : "på lager"]]
      : [[String(kort.beholdning), "på lager"], ...kort.hyller.slice(0, 2).map((h): [string, string] => [String(h.antall), `på ${h.hylle}`])];
    return (
      <Kort onPress={() => router.push({ pathname: "/vare/[sku]", params: { sku: kort.sku } })} style={{ gap: 16 }}>
        <Rad gap={12}>
          <Swatch farge={kort.swatch} size={40} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 16 }}>{kort.navn}</Txt>
            <Mono style={{ color: F.dempet }}>{kort.sku}{kort.po ? ` · ${kort.po.id}` : ""}</Mono>
          </View>
          <Ikon navn="pilOpp" size={18} />
        </Rad>
        <Rad style={{ justifyContent: "space-between" }}>
          {tall.map(([t, e], i) => (
            <View key={i} style={{ alignItems: i === 0 ? "flex-start" : i === tall.length - 1 ? "flex-end" : "center" }}>
              <Display style={{ fontSize: 24 }}>{t}</Display>
              <Txt style={{ fontSize: 12, color: F.dempet }}>{e}</Txt>
            </View>
          ))}
        </Rad>
      </Kort>
    );
  }
  if (kort.type === "avvik") {
    return (
      <Kort farge={F.rodlys} style={{ borderColor: F.rod }} onPress={() => router.push({ pathname: "/avvik/[id]", params: { id: kort.id } })}>
        <Rad gap={12}>
          <View style={{ flex: 1, gap: 2 }}>
            <Mono style={{ color: F.rod, fontSize: 11 }}>MULIG SVINN · {kort.hylle} · {klokke(kort.tid)}</Mono>
            <Txt style={{ fontFamily: S.tekstHalvfet }}>{kort.navn}</Txt>
          </View>
          <Display style={{ fontSize: 24, color: F.rod }}>{fortegn(kort.endring)}</Display>
          <Ikon navn="pilOpp" size={18} />
        </Rad>
      </Kort>
    );
  }
  return (
    <Kort style={{ gap: 8 }}>
      <Txt style={{ fontFamily: S.tekstHalvfet }}>{kort.tittel}</Txt>
      {kort.rader.map((r, i) => (
        <Rad key={i}>
          <Mono style={{ color: F.dempet, width: 40 }}>{klokke(r.tid)}</Mono>
          <Txt style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>{r.tekst}</Txt>
          <Mono style={{ color: r.type === "mulig_svinn" ? F.rod : r.endring > 0 ? F.gronn : F.tekst }}>{fortegn(r.endring)}</Mono>
        </Rad>
      ))}
    </Kort>
  );
}

export function KortLenke({ tekst, onPress }: { tekst: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 4 }}>
      <Txt style={{ textDecorationLine: "underline" }}>{tekst}</Txt>
    </Pressable>
  );
}
