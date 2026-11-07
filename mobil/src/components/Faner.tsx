import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { F, S } from "@/lib/tema";
import { Ikon, type IkonNavn } from "./Ikon";

export type FaneNavn = "index" | "skann" | "spor" | "logg" | "varer";

export const FANER: { navn: FaneNavn; tekst: string; ikon: IkonNavn; sti: "/" | "/skann" | "/spor" | "/logg" | "/varer" }[] = [
  { navn: "index", tekst: "Hjem", ikon: "hjem", sti: "/" },
  { navn: "skann", tekst: "Skann", ikon: "skann", sti: "/skann" },
  { navn: "spor", tekst: "Spør", ikon: "mikrofon", sti: "/spor" },
  { navn: "logg", tekst: "Logg", ikon: "logg", sti: "/logg" },
  { navn: "varer", tekst: "Varer", ikon: "varer", sti: "/varer" },
];

/** Fanelinja, slik den ser ut i skissene: strek over, gul markør på aktiv fane. */
export function FaneLinje({ aktiv, onVelg }: { aktiv: FaneNavn; onVelg: (f: (typeof FANER)[number]) => void }) {
  const inn = useSafeAreaInsets();
  return (
    <View style={[st.linje, { paddingBottom: Math.max(inn.bottom, 8) }]}>
      {FANER.map((f) => {
        const er = f.navn === aktiv;
        return (
          <Pressable key={f.navn} accessibilityRole="tab" accessibilityState={{ selected: er }} onPress={() => onVelg(f)} style={st.fane}>
            <View style={[st.markor, er && { backgroundColor: F.gul }]} />
            <Ikon navn={f.ikon} size={22} farge={er ? F.tekst : F.dempet} />
            <Text style={[st.tekst, er && { color: F.tekst, fontFamily: S.tekstHalvfet }]}>{f.tekst}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Brukes på skjermer utenfor fanene. Trykk går tilbake til riktig fane. */
export function StatiskFaner({ aktiv }: { aktiv: FaneNavn }) {
  return (
    <FaneLinje
      aktiv={aktiv}
      onVelg={(f) => {
        if (router.canDismiss()) router.dismissAll();
        router.navigate(f.sti);
      }}
    />
  );
}

const st = StyleSheet.create({
  linje: { flexDirection: "row", borderTopWidth: 1.5, borderTopColor: F.tekst, backgroundColor: F.bg },
  fane: { flex: 1, alignItems: "center", gap: 3, paddingBottom: 4 },
  markor: { width: 40, height: 4, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginBottom: 8 },
  tekst: { fontFamily: S.tekst, fontSize: 12, color: F.dempet },
});
