import { Pressable, StyleSheet, View } from "react-native";
import { F, S } from "@/lib/tema";
import { Ikon, type IkonNavn } from "./Ikon";
import { Txt } from "./ui";

/**
 * En stor, farget knapp til startsiden. Brukes i et rutenett i app/index.tsx.
 * `bred` gjør at knappen fyller hele raden (Scann). `merke` viser et rødt tall i hjørnet.
 */
export function StorKnapp({
  tekst, ikon, farge, onPress, bred, merke, undertekst,
}: {
  tekst: string; ikon: IkonNavn; farge: string; onPress: () => void; bred?: boolean; merke?: number; undertekst?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={merke ? `${tekst}, ${merke} nye` : tekst}
      onPress={onPress}
      style={[st.ytre, bred ? { width: "100%" } : { width: "48%" }]}
    >
      {({ pressed }) => (
        <View style={{ paddingRight: 4, paddingBottom: 4 }}>
          <View style={st.skygge} />
          <View style={[st.knapp, { backgroundColor: farge, height: bred ? 170 : 150 }, pressed && { transform: [{ translateX: 3 }, { translateY: 3 }] }]}>
            <Ikon navn={ikon} size={bred ? 52 : 44} tykk={2.2} />
            <Txt style={[st.tekst, bred && { fontSize: 26 }]}>{tekst}</Txt>
            {!!undertekst && <Txt style={st.under}>{undertekst}</Txt>}
            {!!merke && (
              <View style={st.merke}>
                <Txt style={st.merkeTekst}>{merke}</Txt>
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const st = StyleSheet.create({
  ytre: { marginBottom: 14 },
  skygge: { position: "absolute", left: 4, top: 4, right: 0, bottom: 0, backgroundColor: F.tekst, borderRadius: 18 },
  knapp: { borderRadius: 18, borderWidth: 2, borderColor: F.tekst, alignItems: "center", justifyContent: "center", gap: 10, padding: 12 },
  tekst: { fontFamily: S.display, fontSize: 21, letterSpacing: -0.5 },
  under: { fontSize: 13, color: F.tekst, opacity: 0.75, marginTop: -6 },
  merke: {
    position: "absolute", top: 10, right: 10, minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: 8,
    backgroundColor: F.rod, borderWidth: 2, borderColor: F.tekst, alignItems: "center", justifyContent: "center",
  },
  merkeTekst: { color: F.hvit, fontFamily: S.tekstFet, fontSize: 15 },
});
