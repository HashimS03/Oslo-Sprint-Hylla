import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Device from "expo-device";
import { router } from "expo-router";
import { send } from "@/lib/api";
import { kodeFraQr, lagreNokkel } from "@/lib/enhet";
import { F, S, lagStil } from "@/lib/tema";
import { Feilboks, Knapp, LenkeKnapp, Skjerm, Txt } from "@/components/ui";

// Kobler telefonen til Hylla: skann QR-koden driftslederen viser i dashboardet (Innstillinger → Telefoner).
// Den første enheten kan kobles med lederkoden i stedet.
export default function Koble() {
  const [tillatelse, spor] = useCameraPermissions();
  const [feil, setFeil] = useState<string | null>(null);
  const [jobber, setJobber] = useState(false);
  const [visLeder, setVisLeder] = useState(false);
  const [lederkode, setLederkode] = useState("");
  const opptatt = useRef(false);

  const koble = async (bevis: { kode?: string; lederkode?: string }) => {
    if (opptatt.current) return;
    opptatt.current = true;
    setJobber(true);
    setFeil(null);
    try {
      const res = await send<{ nokkel: string }>("/api/enheter/koble", { ...bevis, navn: Device.modelName ?? "Telefon" }, { "x-hylla-app": "1" });
      await lagreNokkel(res.nokkel);
      // Ferdig: skanneren skal ikke koble til en gang til mens skjermen lukkes (opptatt blir stående).
      router.replace("/");
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke koble til");
      opptatt.current = false;
      setJobber(false);
    }
  };

  const skannet = ({ data }: { data: string }) => {
    if (opptatt.current) return;
    const kode = kodeFraQr(data);
    if (kode) koble({ kode });
    else setFeil("Det er ikke en Hylla-kode. Skann QR-koden i driftslederens dashboard.");
  };

  return (
    <Skjerm tittel="Koble til Hylla" tilbake={false}>
      <Txt style={{ color: F.dempet, marginBottom: 12 }}>
        Telefonen må kobles til én gang. Gå til driftslederen og be om QR-koden i dashboardet, og skann den her.
      </Txt>
      {feil && <Feilboks melding={feil} />}

      {tillatelse?.granted ? (
        <View style={st.ramme}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={jobber ? undefined : skannet}
          />
          {jobber && (
            <View style={st.over}>
              <Txt style={{ color: F.hvit, fontFamily: S.tekstHalvfet }}>Kobler til …</Txt>
            </View>
          )}
        </View>
      ) : (
        <Knapp tekst="Skann QR-kode" ikon="kamera" onPress={spor} />
      )}

      <View style={{ marginTop: 20, gap: 10 }}>
        {!visLeder ? (
          <LenkeKnapp tekst="Er du driftsleder og setter opp den første enheten?" onPress={() => setVisLeder(true)} />
        ) : (
          <>
            <Txt style={{ fontFamily: S.tekstHalvfet }}>Lederkode</Txt>
            <TextInput
              value={lederkode}
              onChangeText={setLederkode}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={st.felt}
            />
            <Knapp tekst="Koble til" laster={jobber} deaktivert={!lederkode || jobber} onPress={() => koble({ lederkode })} />
          </>
        )}
      </View>
    </Skjerm>
  );
}

const st = lagStil(() => ({
  ramme: { height: 320, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
  over: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  felt: {
    height: 56, borderWidth: 1, borderColor: F.kant, borderRadius: 12, backgroundColor: F.kort, paddingHorizontal: 14,
    fontFamily: S.tekstMedium, fontSize: 18, color: F.tekst,
  },
}));
