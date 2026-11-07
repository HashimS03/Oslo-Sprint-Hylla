import { View } from "react-native";
import { F, S } from "@/lib/tema";
import { Mono } from "./ui";

/** Tegnet hylle, brukes som plassholder når det ikke finnes et ekte bilde. */
export function HylleTegning({ hylle, hoyde = 220 }: { hylle: string; hoyde?: number }) {
  const rader = [
    { farge: "#1E1E20", kant: "#45454A", stabler: [6, 6, 6], lapp: `${hylle} ØVERST` },
    { farge: "#EDEBE6", kant: "#BDBAB4", stabler: [5, 5, 4], lapp: `${hylle} NEDERST` },
  ];
  return (
    <View style={{ height: hoyde, backgroundColor: "#3A4245", borderRadius: 4, paddingHorizontal: 12, justifyContent: "space-evenly", borderLeftWidth: 8, borderRightWidth: 8, borderColor: "#8A9294" }}>
      {rader.map((r) => (
        <View key={r.lapp}>
          <View style={{ flexDirection: "row", gap: 18, paddingHorizontal: 14, alignItems: "flex-end" }}>
            {r.stabler.map((n, i) => (
              <View key={i} style={{ flex: 1, gap: 2 }}>
                {Array.from({ length: n }).map((_, k) => (
                  <View key={k} style={{ height: 8, borderRadius: 4, backgroundColor: r.farge, borderWidth: 1, borderColor: r.kant }} />
                ))}
              </View>
            ))}
          </View>
          <View style={{ height: 5, backgroundColor: "#A7AEAF", marginTop: 1 }} />
          <View style={{ position: "absolute", left: 0, bottom: -4, backgroundColor: F.gul, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Mono style={{ fontSize: 8, fontFamily: S.monoMedium }}>{r.lapp}</Mono>
          </View>
        </View>
      ))}
    </View>
  );
}
