import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { OppgaverSvar } from "@/lib/typer";
import { lagreNavn, useNavn } from "@/lib/navn";
import { useHent } from "@/lib/useHent";
import { useOppdater } from "@/lib/useOppdater";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { StorKnapp } from "@/components/StorKnapp";
import { Logo } from "@/components/Logo";
import { Display, Knapp, Txt } from "@/components/ui";

/** Startsiden: fire store knapper. Første gang spør den om navnet til den ansatte. */
export default function Hjem() {
  const { navn } = useNavn();
  if (!navn) return <HvemErDu />;
  return <Knapper navn={navn} />;
}

function Knapper({ navn }: { navn: string }) {
  const inn = useSafeAreaInsets();
  const { data, last } = useHent<OppgaverSvar>("/api/oppgaver");
  useOppdater(last);

  return (
    <View style={[st.skjerm, { paddingTop: inn.top }]}>
      <ScrollView contentContainerStyle={[st.innhold, { paddingBottom: Math.max(inn.bottom, 20) }]}>
        <View style={st.merke}>
          <Logo size={28} />
          <Display style={{ fontSize: 22 }}>Hylla</Display>
          <Txt style={st.merkeEtikett}>SKANNER</Txt>
        </View>
        <View style={st.topp}>
          <View style={{ flex: 1 }}>
            <Txt style={{ color: F.dempet, fontSize: 16 }}>Hei,</Txt>
            <Display style={{ fontSize: 34 }} numberOfLines={1}>{navn}</Display>
          </View>
          <Pressable accessibilityLabel="Innstillinger" hitSlop={12} onPress={() => router.push("/innstillinger")} style={st.tannhjul}>
            <Ikon navn="tannhjul" size={24} />
          </Pressable>
        </View>

        <View style={st.rutenett}>
          {/* Legg til nye knapper her med én linje til. Takkamera ligger under Innstillinger. */}
          <StorKnapp bred tekst="Scann" undertekst="Pek kameraet på koden" ikon="skann" farge={F.gul} onPress={() => router.push("/scann")} />
          <StorKnapp tekst="Oppgaver" ikon="hake" farge={F.gronnlys} merke={data?.nye} onPress={() => router.push("/oppgaver")} />
          <StorKnapp tekst="Varer" ikon="varer" farge={F.blalys} onPress={() => router.push("/varer")} />
          <StorKnapp bred tekst="Spør Hylla" undertekst="Spør om en vare med stemmen" ikon="mikrofon" farge={F.lillalys} onPress={() => router.push("/spor")} />
        </View>
      </ScrollView>
    </View>
  );
}

function HvemErDu() {
  const inn = useSafeAreaInsets();
  const [tekst, setTekst] = useState("");
  const ok = tekst.trim().length > 0;
  return (
    <KeyboardAvoidingView style={[st.skjerm, { paddingTop: inn.top + 40 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[st.innhold, { gap: 18 }]}>
        <Logo size={72} />
        <Display style={{ fontSize: 34 }}>Hei! Hva heter du?</Display>
        <Txt style={{ color: F.dempet, fontSize: 16, lineHeight: 22 }}>
          Navnet vises for driftsleder når du tar en oppgave eller melder fra om noe. Du kan endre det senere.
        </Txt>
        <TextInput
          value={tekst}
          onChangeText={setTekst}
          placeholder="Fornavn"
          placeholderTextColor={F.dempet}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={() => ok && lagreNavn(tekst)}
          style={st.felt}
        />
        <Knapp tekst="Start" ikon="pilHoyre" deaktivert={!ok} onPress={() => lagreNavn(tekst)} />
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  skjerm: { flex: 1, backgroundColor: F.bg },
  innhold: { padding: 20 },
  merke: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  merkeEtikett: { fontFamily: S.mono, fontSize: 11, letterSpacing: 0.7, color: F.dempet, marginLeft: 4 },
  topp: { flexDirection: "row", alignItems: "center", marginBottom: 22, marginTop: 20 },
  tannhjul: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: F.kant, backgroundColor: F.kort, alignItems: "center", justifyContent: "center" },
  rutenett: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  felt: {
    height: 60, borderWidth: 1, borderColor: F.kant, borderRadius: 12, backgroundColor: F.kort, paddingHorizontal: 16,
    fontFamily: S.tekstMedium, fontSize: 20, color: F.tekst,
  },
});
