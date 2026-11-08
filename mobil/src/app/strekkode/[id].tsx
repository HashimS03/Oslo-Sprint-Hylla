import { useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { send } from "@/lib/api";
import { F, S, lagStil } from "@/lib/tema";
import { Knapp, Txt } from "@/components/ui";

/** Skanner strekkoden til én vare for dashboardet, og sender den tilbake. */
export default function SkannForDashboard() {
  const { id, navn } = useLocalSearchParams<{ id: string; navn?: string }>();
  const inn = useSafeAreaInsets();
  const [tillatelse, spor] = useCameraPermissions();
  const [status, setStatus] = useState(`Hold strekkoden på ${navn ?? "varen"} foran kameraet`);
  const [ferdig, setFerdig] = useState<string | null>(null);
  const opptatt = useRef(false);

  async function lest({ data: kode }: { data: string }) {
    if (opptatt.current || ferdig) return;
    opptatt.current = true;
    setStatus("Sender …");
    try {
      await send(`/api/strekkode/${id}`, { status: "ferdig", kode });
      setFerdig(kode);
      setStatus("Registrert. Den vises i dashboardet nå.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setTimeout(() => router.back(), 1500);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Fikk ikke sendt koden");
      opptatt.current = false;
    }
  }

  const avbryt = () => {
    if (!ferdig) send(`/api/strekkode/${id}`, { status: "avvist" }).catch(() => undefined);
    router.back();
  };

  return (
    <View style={[st.skjerm, { paddingTop: inn.top }]}>
      {tillatelse?.granted && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] }}
          onBarcodeScanned={ferdig ? undefined : lest}
        />
      )}
      {tillatelse?.granted && <View pointerEvents="none" style={[st.ramme, ferdig && { borderColor: F.gronn }]} />}
      <View style={st.topp}>
        <Txt style={st.tittel}>Strekkode · {navn ?? "vare"}</Txt>
        <Pressable onPress={avbryt} hitSlop={12}><Txt style={st.tittel}>{ferdig ? "Lukk" : "Avbryt"}</Txt></Pressable>
      </View>
      {tillatelse && !tillatelse.granted && (
        <View style={st.midt}>
          <Txt style={{ color: F.hvit }}>Hylla trenger kameraet for å lese strekkoder.</Txt>
          <Knapp tekst="Gi tilgang" onPress={spor} />
        </View>
      )}
      <View style={[st.bunn, { paddingBottom: Math.max(inn.bottom, 16) }]}>
        <Txt style={{ color: F.hvit, fontFamily: S.tekstHalvfet }}>{status}</Txt>
        {ferdig && <Txt style={{ color: F.hvit, fontFamily: S.mono, fontSize: 16 }}>{ferdig}</Txt>}
      </View>
    </View>
  );
}

const st = lagStil(() => ({
  skjerm: { flex: 1, backgroundColor: F.mork },
  topp: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  tittel: { color: F.hvit, fontFamily: S.tekstHalvfet, fontSize: 18 },
  ramme: { position: "absolute", left: "12%", right: "12%", top: "30%", height: 170, borderWidth: 3, borderColor: F.gul, borderRadius: 14 },
  midt: { flex: 1, padding: 16, gap: 10, justifyContent: "center" },
  bunn: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, gap: 8, backgroundColor: "rgba(17,21,23,0.85)" },
}));
