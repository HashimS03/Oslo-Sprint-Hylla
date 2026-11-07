import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SkannVare } from "@/lib/typer";
import { ApiFeil, hent } from "@/lib/api";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { Display, Knapp, Skjerm, Txt } from "@/components/ui";

type Tilstand = { type: "leter" } | { type: "slar_opp" } | { type: "ukjent" } | { type: "feil"; melding: string };

/** Scann: kameraet leser QR-/strekkoden på varen og åpner varekortet. */
export default function Scann() {
  const [tillatelse, spor] = useCameraPermissions();
  const inn = useSafeAreaInsets();
  const [tilstand, setTilstand] = useState<Tilstand>({ type: "leter" });
  const [lykt, setLykt] = useState(false);
  const [skriv, setSkriv] = useState(false);
  const [kode, setKode] = useState("");
  const [aktiv, setAktiv] = useState(true);
  const opptatt = useRef(false);

  // Start scanningen på nytt hver gang skjermen kommer tilbake i fokus (etter varekortet).
  useFocusEffect(
    useCallback(() => {
      opptatt.current = false;
      setTilstand({ type: "leter" });
      setAktiv(true);
      return () => {
        setAktiv(false);
        setLykt(false);
      };
    }, []),
  );

  const slaOpp = async (lest: string) => {
    if (opptatt.current) return;
    opptatt.current = true;
    setTilstand({ type: "slar_opp" });
    try {
      const { vare } = await hent<{ vare: SkannVare }>(`/api/skann/${encodeURIComponent(lest.trim())}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSkriv(false);
      setKode("");
      router.push({ pathname: "/vare/[sku]", params: { sku: vare.sku } });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (e instanceof ApiFeil && e.status === 404) setTilstand({ type: "ukjent" });
      else setTilstand({ type: "feil", melding: e instanceof Error ? e.message : "Noe gikk galt" });
    }
  };

  const provIgjen = () => {
    opptatt.current = false;
    setTilstand({ type: "leter" });
  };

  const onLest = (r: BarcodeScanningResult) => {
    if (r.data) slaOpp(r.data);
  };

  if (!tillatelse) return <View style={{ flex: 1, backgroundColor: F.mork }} />;

  if (!tillatelse.granted) {
    return (
      <Skjerm tittel="Scann">
        <View style={{ gap: 16, paddingTop: 24 }}>
          <Ikon navn="kamera" size={48} />
          <Display style={{ fontSize: 26 }}>Appen trenger kameraet</Display>
          <Txt style={{ fontSize: 16, lineHeight: 22, color: F.dempet }}>
            Kameraet brukes bare til å lese koden på varene. Ingen bilder blir lagret.
          </Txt>
          <Knapp tekst="Gi tilgang til kameraet" ikon="kamera" onPress={spor} />
        </View>
      </Skjerm>
    );
  }

  const feil = tilstand.type === "ukjent" || tilstand.type === "feil";
  const melding =
    tilstand.type === "slar_opp" ? "Slår opp …" :
    tilstand.type === "ukjent" ? "Fant ingen vare med denne koden" :
    tilstand.type === "feil" ? tilstand.melding :
    "Pek på koden på varen";

  return (
    <View style={st.skjerm}>
      {aktiv && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={lykt}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128"] }}
          onBarcodeScanned={tilstand.type === "leter" && !skriv ? onLest : undefined}
        />
      )}

      <View style={[st.topp, { paddingTop: inn.top + 8 }]}>
        <Pressable accessibilityLabel="Tilbake" hitSlop={12} onPress={() => router.back()} style={st.rundKnapp}>
          <Ikon navn="tilbake" size={24} farge={F.hvit} />
        </Pressable>
        <Display style={{ color: F.hvit, fontSize: 24 }}>Scann</Display>
        <View style={{ width: 48 }} />
      </View>

      <View style={st.midt} pointerEvents="none">
        <View style={[st.ramme, feil && { borderColor: F.rod }]}>
          {tilstand.type === "slar_opp" && <ActivityIndicator size="large" color={F.gul} />}
        </View>
        <View style={[st.melding, feil && { backgroundColor: F.rod }]}>
          <Txt style={st.meldingTekst}>{melding}</Txt>
        </View>
      </View>

      <View style={[st.bunn, { paddingBottom: Math.max(inn.bottom, 16) }]}>
        {feil && <Knapp tekst="Prøv igjen" onPress={provIgjen} />}
        {skriv ? (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ gap: 10 }}>
            <TextInput
              value={kode}
              onChangeText={setKode}
              placeholder="Skriv koden, f.eks. KAFFE-KOPP"
              placeholderTextColor={F.dempet}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => kode.trim() && slaOpp(kode)}
              style={st.felt}
            />
            <Knapp tekst="Finn varen" deaktivert={!kode.trim() || tilstand.type === "slar_opp"} onPress={() => slaOpp(kode)} />
            <Pressable
              onPress={() => {
                setSkriv(false);
                provIgjen();
              }}
              hitSlop={10}
              style={{ alignSelf: "center", padding: 6 }}
            >
              <Txt style={{ color: F.hvit, textDecorationLine: "underline" }}>Tilbake til kameraet</Txt>
            </Pressable>
          </KeyboardAvoidingView>
        ) : (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <SmaKnapp ikon={lykt ? "lyktAv" : "lykt"} tekst={lykt ? "Lys av" : "Lys"} onPress={() => setLykt((l) => !l)} />
            <SmaKnapp
              ikon="sok"
              tekst="Skriv inn kode"
              onPress={() => {
                setSkriv(true);
                provIgjen();
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function SmaKnapp({ ikon, tekst, onPress }: { ikon: "lykt" | "lyktAv" | "sok"; tekst: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.smaKnapp, pressed && { opacity: 0.6 }]}>
      <Ikon navn={ikon} size={22} farge={F.hvit} />
      <Txt style={{ color: F.hvit, fontFamily: S.tekstHalvfet, fontSize: 15 }}>{tekst}</Txt>
    </Pressable>
  );
}

const st = StyleSheet.create({
  skjerm: { flex: 1, backgroundColor: F.mork },
  topp: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "rgba(17,21,23,0.55)" },
  rundKnapp: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
  midt: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
  ramme: { width: 250, height: 250, borderRadius: 24, borderWidth: 4, borderColor: F.gul, alignItems: "center", justifyContent: "center" },
  melding: { backgroundColor: "rgba(17,21,23,0.75)", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, maxWidth: "88%" },
  meldingTekst: { color: F.hvit, fontFamily: S.tekstHalvfet, fontSize: 17, textAlign: "center" },
  bunn: { paddingHorizontal: 16, paddingTop: 14, gap: 12, backgroundColor: "rgba(17,21,23,0.55)" },
  smaKnapp: {
    flex: 1, height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.6)",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  felt: { height: 56, borderRadius: 12, backgroundColor: F.hvit, paddingHorizontal: 14, fontFamily: S.monoMedium, fontSize: 17, color: F.tekst },
});
