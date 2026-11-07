import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { send } from "@/lib/api";
import { F, S } from "@/lib/tema";
import { Feilboks, Knapp, Skjerm, Txt } from "@/components/ui";

export default function NyHylle() {
  const [id, setId] = useState("");
  const [navn, setNavn] = useState("");
  const [lagrer, setLagrer] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  const lagre = async () => {
    setFeil(null);
    if (!id.trim()) return setFeil("Gi hylla en ID, f.eks. T1.");
    setLagrer(true);
    try {
      const res = await send<{ id: string }>("/api/hyller", { id, navn });
      // Produktet velges per kamerasone på Kameraer-skjermen.
      router.replace("/kameraer");
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke lagre");
      setLagrer(false);
    }
  };

  return (
    <Skjerm tittel="Ny hylle" bunn={<Knapp tekst={lagrer ? "Lagrer …" : "Lagre"} laster={lagrer} onPress={lagre} />}>
      <Txt style={{ color: F.dempet }}>
        En hylle er stedet kameraet ser på, f.eks. en hylle i en reol eller et bord. Etterpå velger du hvilket produkt kameraet skal se etter der.
      </Txt>
      <View style={{ gap: 6 }}>
        <Txt style={st.etikett}>ID</Txt>
        <TextInput value={id} onChangeText={(t) => setId(t.toUpperCase())} placeholder="T1" placeholderTextColor={F.dempet} autoCapitalize="characters" autoFocus style={[st.input, { fontFamily: S.mono }]} />
        <Txt style={{ fontSize: 13, color: F.dempet }}>Bokstaven er reolen, tallet er hylla. T1 er reol T, hylle 1.</Txt>
      </View>
      <View style={{ gap: 6 }}>
        <Txt style={st.etikett}>Navn (valgfritt)</Txt>
        <TextInput value={navn} onChangeText={setNavn} placeholder="Bord 1" placeholderTextColor={F.dempet} style={st.input} />
      </View>
      {feil && <Feilboks melding={feil} />}
    </Skjerm>
  );
}

const st = StyleSheet.create({
  etikett: { fontFamily: S.tekstHalvfet, fontSize: 14 },
  input: { height: 48, borderWidth: 1, borderColor: F.kant, borderRadius: 10, backgroundColor: F.kort, paddingHorizontal: 14, fontFamily: S.tekst, fontSize: 16, color: F.tekst },
});
