import { Pressable, View } from "react-native";
import { F, S, lagStil } from "@/lib/tema";
import { Ikon, type IkonNavn } from "./Ikon";
import { Txt } from "./ui";

/**
 * En stor knapp til startsiden, i samme stil som nøkkeltallene i dashboardet.
 * `bred` gjør at knappen fyller hele raden. Er `farge` gul, blir den den gule hovedknappen (Scann).
 * Ellers er `farge` bakgrunnen bak ikonet. `merke` viser et rødt tall i hjørnet.
 */
export function StorKnapp({
  tekst, ikon, farge, onPress, bred, merke, undertekst,
}: {
  tekst: string; ikon: IkonNavn; farge: string; onPress: () => void; bred?: boolean; merke?: number; undertekst?: string;
}) {
  const gul = farge === F.gul;
  const skrift = gul ? F.blekk : F.tekst;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={merke ? `${tekst}, ${merke} nye` : tekst}
      onPress={onPress}
      style={({ pressed }) => [st.ytre, bred ? { width: "100%" } : { width: "48%" }, pressed && { opacity: 0.75 }]}
    >
      <View style={[st.knapp, gul ? st.gul : st.kort, { height: bred ? 150 : 140 }, bred && !gul && { height: 96, flexDirection: "row", justifyContent: "flex-start" }]}>
        <View style={[st.ikon, { backgroundColor: gul ? "rgba(27,34,38,0.12)" : farge }]}>
          <Ikon navn={ikon} size={bred && gul ? 34 : 28} tykk={2} farge={skrift} />
        </View>
        <View style={{ alignItems: bred && !gul ? "flex-start" : "center", gap: 2 }}>
          <Txt style={[st.tekst, { color: skrift }, bred && gul && { fontSize: 26 }]}>{tekst}</Txt>
          {!!undertekst && <Txt style={[st.under, { color: skrift }]}>{undertekst}</Txt>}
        </View>
        {!!merke && (
          <View style={st.merke}>
            <Txt style={st.merkeTekst}>{merke}</Txt>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const st = lagStil(() => ({
  ytre: { marginBottom: 12 },
  knapp: { borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 12, padding: 16 },
  kort: { backgroundColor: F.kort, borderWidth: 1, borderColor: F.kant },
  gul: { backgroundColor: F.gul, borderWidth: 2.5, borderColor: F.blekk },
  ikon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tekst: { fontFamily: S.display, fontSize: 20, letterSpacing: -0.5 },
  under: { fontSize: 13, opacity: 0.75 },
  merke: {
    position: "absolute", top: 10, right: 10, minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 7,
    backgroundColor: F.rod, alignItems: "center", justifyContent: "center",
  },
  merkeTekst: { color: F.bg, fontFamily: S.tekstFet, fontSize: 13 },
}));
