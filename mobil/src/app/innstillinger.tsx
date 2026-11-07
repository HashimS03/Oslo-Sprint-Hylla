import { useState } from "react";
import { router } from "expo-router";
import { Alert, Pressable, TextInput, View } from "react-native";
import { apiUrl, send, usikkerAdresse } from "@/lib/api";
import { lagreNavn, useNavn } from "@/lib/navn";
import { F, S, lagStil, settTema, useTema, type Tema } from "@/lib/tema";
import { Etikett, Feilboks, Knapp, Kort, Mono, Skjerm, Txt } from "@/components/ui";

/** Innstillinger: navnet ditt, hvilken server appen snakker med, og nullstilling av demoen. */
export default function Innstillinger() {
  const tema = useTema();
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
        <Etikett>Utseende</Etikett>
        <View style={st.velger}>
          {([["mork", "Mørk"], ["lys", "Lys"]] as [Tema, string][]).map(([t, navn]) => (
            <Pressable
              key={t}
              onPress={() => settTema(t)}
              accessibilityRole="button"
              accessibilityState={{ selected: tema === t }}
              style={[st.valg, tema === t && st.valgt]}
            >
              <Txt style={[st.valgTekst, tema === t && { color: F.blekk }]}>{navn}</Txt>
            </Pressable>
          ))}
        </View>
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

const st = lagStil(() => ({
  felt: {
    height: 56, borderWidth: 1, borderColor: F.kant, borderRadius: 12, backgroundColor: F.kort, paddingHorizontal: 14,
    fontFamily: S.tekstMedium, fontSize: 18, color: F.tekst,
  },
  velger: { flexDirection: "row", gap: 4, padding: 4, borderWidth: 1, borderColor: F.kant, borderRadius: 14, backgroundColor: F.kort },
  valg: { flex: 1, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  valgt: { backgroundColor: F.gul },
  valgTekst: { fontFamily: S.tekstHalvfet, fontSize: 16, color: F.dempet },
}));
