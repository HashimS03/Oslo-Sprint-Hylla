import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import type { VareRad } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { Display, Feilboks, Knapp, Laster, Mono, Rad, Skjerm, Swatch, Txt } from "@/components/ui";

const LAV = 5;

export default function Varer() {
  const { data, feil, last } = useHent<{ varer: VareRad[] }>("/api/varer");
  const [sok, setSok] = useState("");
  const varer = useMemo(() => {
    const q = sok.trim().toLowerCase();
    return (data?.varer ?? []).filter((v) => !q || v.navn.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));
  }, [data, sok]);

  return (
    <Skjerm tittel="Varer" tilbake={false} bunn={<Knapp tekst="Legg til produkt" ikon="pluss" onPress={() => router.push("/ny-vare")} />}>
      <Rad style={st.sok}>
        <Ikon navn="sok" size={20} farge={F.dempet} />
        <TextInput value={sok} onChangeText={setSok} placeholder="Søk etter navn eller SKU" placeholderTextColor={F.dempet} style={st.sokFelt} />
      </Rad>
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!data && !feil && <Laster />}
      <View>
        {varer.map((v) => (
          <Pressable key={v.sku} onPress={() => router.push({ pathname: "/vare/[sku]", params: { sku: v.sku } })} style={({ pressed }) => [st.rad, pressed && { opacity: 0.6 }]}>
            <Swatch farge={v.swatch} size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt style={{ fontFamily: S.tekstHalvfet }}>{v.navn}</Txt>
              <Mono style={{ color: F.dempet }}>{v.sku} · {v.hyller.join(", ") || "ingen hylle"}</Mono>
              {v.antall < LAV && <Txt style={{ fontSize: 12, color: F.rod }}>Lav beholdning</Txt>}
            </View>
            <Display style={{ fontSize: 24, color: v.antall < LAV ? F.rod : F.tekst }}>{v.antall}</Display>
          </Pressable>
        ))}
      </View>
    </Skjerm>
  );
}

const st = StyleSheet.create({
  sok: { height: 52, borderWidth: 1, borderColor: F.kant, backgroundColor: F.hvit, borderRadius: 12, paddingHorizontal: 14, gap: 10 },
  sokFelt: { flex: 1, fontFamily: S.tekst, fontSize: 16, color: F.tekst, height: "100%" },
  rad: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: F.kant },
});
