import { useState } from "react";
import { router } from "expo-router";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { apiUrl, send, usikkerAdresse } from "@/lib/api";
import { lagreNavn, useNavn } from "@/lib/navn";
import { F, S } from "@/lib/tema";
import { Etikett, Feilboks, Knapp, Kort, Mono, Skjerm, Txt } from "@/components/ui";

/** Innstillinger: navnet ditt, hvilken server appen snakker med, og nullstilling av demoen. */
export default function Innstillinger() {
  const { navn } = useNavn();
  const [nytt, setNytt] = useState(navn ?? "");
  const [nullstiller, setNullstiller] = useState(false);
  const usikker = usikkerAdresse();
  const endret = nytt.trim() !== (navn ?? "") && nytt.trim().length > 0;

  const nullstill = () =>
    Alert.alert("Nullstille demoen?", "Alle data går tilbake til demodataene. Dette gjelder dashbordet også.", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Nullstill", style: "destructive", onPress: async () => {
          setNullstiller(true);
          try {
            await send("/api/demo/nullstill", {});
            Alert.alert("Ferdig", "Demoen er nullstilt.");
          } catch (e) {
            Alert.alert("Det gikk ikke", e instanceof Error ? e.message : "");
          } finally {
            setNullstiller(false);
          }
        },
      },
    ]);

  return (
    <Skjerm tittel="Innstillinger">
      <View style={{ gap: 8 }}>
        <Etikett>Navnet ditt</Etikett>
        <TextInput
          value={nytt}
          onChangeText={setNytt}
          placeholder="Fornavn"
          placeholderTextColor={F.dempet}
          autoCapitalize="words"
          style={st.felt}
        />
        <Knapp tekst="Lagre navn" deaktivert={!endret} onPress={() => lagreNavn(nytt)} />
      </View>

      <View style={{ gap: 8, marginTop: 8 }}>
        <Etikett>Takkamera</Etikett>
        <Knapp tekst="Takkamera" undertekst="Plukk og plassering, kamerasoner og hyller" ikon="kamera" variant="hvit" pil onPress={() => router.push("/takkamera")} />
      </View>

      <Kort style={{ gap: 6, marginTop: 8 }}>
        <Etikett>Server</Etikett>
        <Mono style={{ fontSize: 14 }}>{apiUrl()}</Mono>
        <Txt style={{ color: F.dempet, fontSize: 13 }}>Settes med EXPO_PUBLIC_API_URL. Uten den bruker appen samme maskin som Expo, port 3000.</Txt>
      </Kort>
      {usikker && <Feilboks melding={usikker} />}

      <View style={{ marginTop: 16 }}>
        <Knapp tekst={nullstiller ? "Nullstiller …" : "Nullstill demoen"} variant="hvit" laster={nullstiller} onPress={nullstill} />
      </View>
    </Skjerm>
  );
}

const st = StyleSheet.create({
  felt: {
    height: 56, borderWidth: 1, borderColor: F.kant, borderRadius: 12, backgroundColor: F.kort, paddingHorizontal: 14,
    fontFamily: S.tekstMedium, fontSize: 18, color: F.tekst,
  },
});
