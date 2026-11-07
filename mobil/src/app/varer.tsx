import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, TextInput, View } from "react-native";
import { router } from "expo-router";
import type { VareRad } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S, lagStil } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { Display, Feilboks, Laster, Mono, Skjerm, Swatch, Txt } from "@/components/ui";

/** Varer: alle varer med søk. Trykk på en vare for å åpne varekortet. */
export default function Varer() {
  const { data, feil, laster, last } = useHent<{ varer: VareRad[] }>("/api/varer");
  const [sok, setSok] = useState("");

  const treff = useMemo(() => {
    const q = sok.trim().toLowerCase();
    const alle = data?.varer ?? [];
    if (!q) return alle;
    return alle.filter((v) => v.navn.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));
  }, [data, sok]);

  return (
    <Skjerm tittel="Varer" rull={false}>
      <View style={st.sokRad}>
        <Ikon navn="sok" size={22} farge={F.dempet} />
        <TextInput
          value={sok}
          onChangeText={setSok}
          placeholder="Søk på navn eller kode"
          placeholderTextColor={F.dempet}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={st.sok}
        />
      </View>
      {feil && !data && <View style={{ padding: 16 }}><Feilboks melding={feil} igjen={last} /></View>}
      {!data && !feil && <Laster />}
      {data && (
        <FlatList
          data={treff}
          keyExtractor={(v) => v.sku}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={laster} onRefresh={last} />}
          ListEmptyComponent={<Txt style={{ color: F.dempet, fontSize: 16, textAlign: "center", marginTop: 24 }}>Ingen varer passer «{sok}».</Txt>}
          renderItem={({ item: v }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/vare/[sku]", params: { sku: v.sku } })}
              style={({ pressed }) => [st.rad, pressed && { opacity: 0.7 }]}
            >
              <Swatch farge={v.swatch} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }} numberOfLines={1}>{v.navn}</Txt>
                <Mono style={{ color: F.dempet }}>{v.sku}{v.hyller.length ? ` · ${v.hyller.join(", ")}` : ""}</Mono>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Display style={{ fontSize: 24 }}>{v.antall}</Display>
                <Txt style={{ fontSize: 12, color: F.dempet }}>stk</Txt>
              </View>
              <Ikon navn="pil" size={20} farge={F.dempet} />
            </Pressable>
          )}
        />
      )}
    </Skjerm>
  );
}

const st = lagStil(() => ({
  sokRad: {
    flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 14, height: 56,
    borderWidth: 1, borderColor: F.kant, borderRadius: 12, backgroundColor: F.kort, paddingHorizontal: 14,
  },
  sok: { flex: 1, height: "100%", fontFamily: S.tekstMedium, fontSize: 17, color: F.tekst },
  rad: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: F.kort, borderWidth: 1, borderColor: F.kant,
    borderRadius: 12, padding: 12, minHeight: 72,
  },
}));
