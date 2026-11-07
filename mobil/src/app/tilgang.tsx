import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { lagrePin, slettPin } from "@/lib/pin";
import { sjekkTilgang } from "@/lib/tilgang";
import { F, S } from "@/lib/tema";
import { Display, Etikett, Knapp, Skjerm, Txt } from "@/components/ui";

// Vises når serveren krever PIN (HYLLA_PIN) og telefonen mangler riktig kode.
// Når koden er riktig, slipper app/_layout.tsx brukeren videre til Hjem av seg selv.
export default function Tilgang() {
  const [pin, setPin] = useState("");
  const [feil, setFeil] = useState("");
  const [sjekker, setSjekker] = useState(false);

  const lasOpp = async () => {
    if (!pin.trim() || sjekker) return;
    setSjekker(true);
    setFeil("");
    try {
      await lagrePin(pin);
      if ((await sjekkTilgang()) === "laast") {
        await slettPin(); // ikke send en feil kode med neste kall
        setFeil("Feil PIN-kode. Prøv igjen.");
        setPin("");
      }
    } catch {
      setFeil("Klarte ikke å lagre koden på telefonen.");
    } finally {
      setSjekker(false);
    }
  };

  return (
    <Skjerm>
      <View style={st.innhold}>
        <Etikett>HYLLA</Etikett>
        <Display style={{ fontSize: 34 }}>Skriv inn PIN-koden</Display>
        <Txt style={{ color: F.dempet }}>
          Lageret er låst. Spør den som satte opp Hylla om koden. Du trenger den bare én gang på denne telefonen.
        </Txt>
        <TextInput
          value={pin}
          onChangeText={(t) => {
            setPin(t);
            setFeil("");
          }}
          accessibilityLabel="PIN-kode"
          placeholder="PIN-kode"
          placeholderTextColor={F.dempet}
          secureTextEntry
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={lasOpp}
          style={st.input}
        />
        {!!feil && (
          <Txt accessibilityRole="alert" style={st.feil}>
            {feil}
          </Txt>
        )}
        <Knapp tekst={sjekker ? "Sjekker …" : "Lås opp"} onPress={lasOpp} laster={sjekker} deaktivert={!pin.trim()} />
      </View>
    </Skjerm>
  );
}

const st = StyleSheet.create({
  innhold: { gap: 14, paddingTop: 48 },
  input: {
    borderWidth: 1.5, borderColor: F.tekst, borderRadius: 10, backgroundColor: F.hvit,
    paddingHorizontal: 14, paddingVertical: 14, fontFamily: S.tekst, fontSize: 18, color: F.tekst, letterSpacing: 2,
  },
  feil: { backgroundColor: F.rodlys, color: F.rod, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, overflow: "hidden" },
});
