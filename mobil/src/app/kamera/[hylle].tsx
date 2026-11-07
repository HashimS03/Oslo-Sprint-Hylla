import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import * as Battery from "expo-battery";
import * as Device from "expo-device";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Forslag, InnstillingerSvar } from "@/lib/typer";
import { hent, send } from "@/lib/api";
import { tilJpeg } from "@/lib/bilde";
import { F, S } from "@/lib/tema";
import { fortegn, klokke } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Display, Knapp, Mono, Rad, Txt } from "@/components/ui";

type Hendelse = { tid: string; tekst: string; endring?: number };

/**
 * Kameratelefonen: står på stativ foran én hylle, holder skjermen våken,
 * tar bilde med jevne mellomrom og sender det til /api/kamera/bilde, som teller og lagrer.
 */
export default function KameraStasjon() {
  useKeepAwake();
  const inn = useSafeAreaInsets();
  const { hylle } = useLocalSearchParams<{ hylle: string }>();
  const [tillatelse, spor] = useCameraPermissions();
  const kamera = useRef<CameraView>(null);
  const [klar, setKlar] = useState(false);
  const [intervall, setIntervall] = useState(10);
  const [neste, setNeste] = useState<number>(Date.now() + 15_000);
  const [jobber, setJobber] = useState(false);
  const [logg, setLogg] = useState<Hendelse[]>([]);
  const [nå, setNå] = useState(Date.now());
  const kameraId = `kam_${hylle.toLowerCase()}_${(Device.modelName ?? "telefon").toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
  const navn = `${hylle} · ${Device.modelName ?? "kameratelefon"}`;

  const pling = useCallback(async () => {
    const [batteri, tilstand] = await Promise.all([
      Battery.getBatteryLevelAsync().catch(() => -1),
      Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNKNOWN),
    ]);
    await send("/api/kamera/ping", {
      kameraId, navn, hylle,
      batteri: batteri >= 0 ? Math.round(batteri * 100) : undefined,
      lader: tilstand === Battery.BatteryState.CHARGING || tilstand === Battery.BatteryState.FULL,
    }).catch(() => {});
  }, [kameraId, navn, hylle]);

  // Meld fra at kameraet lever, og hent intervallet fra innstillingene.
  useEffect(() => {
    pling();
    hent<InnstillingerSvar>("/api/innstillinger").then((d) => setIntervall(d.innstillinger.kameraIntervallMin)).catch(() => {});
    const t = setInterval(pling, 60_000);
    return () => clearInterval(t);
  }, [pling]);

  useEffect(() => {
    const t = setInterval(() => setNå(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const tell = useCallback(async () => {
    if (!kamera.current || jobber) return;
    setJobber(true);
    setNeste(Date.now() + intervall * 60_000);
    try {
      const b = await kamera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      const [bilde, liten] = await Promise.all([tilJpeg(b.uri, 1600, 0.75), tilJpeg(b.uri, 480, 0.55)]);
      const res = await send<{ forslag: Forslag; endret: boolean }>("/api/kamera/bilde", { kameraId, hylle, bilde, liten });
      const endringer = res.forslag.endringer.filter((e) => e.deler.length > 0);
      const svinn = endringer.some((e) => e.deler.some((d) => d.type === "mulig_svinn"));
      setLogg((l) => [
        {
          tid: new Date().toISOString(),
          tekst: endringer.length === 0 ? "Ingen endring" : `${endringer.map((e) => `${e.navn} ${fortegn(e.na - e.forrige)}`).join(", ")}${svinn ? " · mulig svinn" : ""}`,
          endring: endringer.reduce((s, e) => s + e.na - e.forrige, 0),
        },
        ...l,
      ].slice(0, 6));
    } catch (e) {
      setLogg((l) => [{ tid: new Date().toISOString(), tekst: e instanceof Error ? e.message : "Tellingen feilet" }, ...l].slice(0, 6));
    } finally {
      setJobber(false);
    }
  }, [jobber, intervall, kameraId, hylle]);

  // Tar bilde når nedtellingen er ferdig.
  useEffect(() => {
    if (klar && !jobber && nå >= neste) tell();
  }, [nå, neste, klar, jobber, tell]);

  const igjen = Math.max(0, Math.round((neste - nå) / 1000));
  const avslutt = () =>
    Alert.alert("Stoppe kameraet?", `Hylle ${hylle} blir ikke fulgt med på lenger.`, [
      { text: "Fortsett", style: "cancel" },
      { text: "Stopp", style: "destructive", onPress: () => router.back() },
    ]);

  if (!tillatelse?.granted) {
    return (
      <View style={[st.mork, { paddingTop: inn.top + 40, padding: 24, gap: 16 }]}>
        <Display style={{ color: F.hvit, fontSize: 28 }}>Kameratelefon for {hylle}</Display>
        <Txt style={{ color: "#C9D0CE" }}>Telefonen trenger kameraet for å følge med på hylla.</Txt>
        <Knapp tekst="Gi tilgang til kamera" onPress={spor} />
        <Knapp tekst="Avbryt" variant="hvit" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={st.mork}>
      <CameraView ref={kamera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setKlar(true)} />
      <View style={[st.topp, { paddingTop: inn.top + 8 }]}>
        <Rad style={{ justifyContent: "space-between" }}>
          <Rad gap={8}>
            <View style={[st.prikk, { backgroundColor: klar ? "#4CC38A" : F.gul }]} />
            <Mono style={{ color: F.hvit, fontSize: 13 }}>{klar ? "AKTIV" : "STARTER"} · HYLLE {hylle}</Mono>
          </Rad>
          <Pressable accessibilityLabel="Stopp kamera" hitSlop={12} onPress={avslutt}>
            <Ikon navn="lukk" size={24} farge={F.hvit} />
          </Pressable>
        </Rad>
      </View>

      <View style={[st.panel, { paddingBottom: inn.bottom + 16 }]}>
        <Rad style={{ justifyContent: "space-between" }}>
          <View>
            <Txt style={{ color: "#C9D0CE", fontSize: 13 }}>{jobber ? "Teller nå …" : "Neste bilde om"}</Txt>
            <Display style={{ color: F.hvit, fontSize: 34 }}>{jobber ? "…" : `${Math.floor(igjen / 60)}:${String(igjen % 60).padStart(2, "0")}`}</Display>
          </View>
          <Pressable onPress={tell} disabled={!klar || jobber} style={({ pressed }) => [st.tellNa, pressed && { opacity: 0.7 }, (!klar || jobber) && { opacity: 0.5 }]}>
            <Ikon navn="kamera" size={20} />
            <Txt style={{ fontFamily: S.tekstHalvfet }}>Tell nå</Txt>
          </Pressable>
        </Rad>
        <Mono style={{ color: "#9AA3A6" }}>{navn} · hvert {intervall}. minutt · skjermen holdes våken</Mono>
        {logg.map((h, i) => (
          <Rad key={i} style={{ opacity: i === 0 ? 1 : 0.6 }}>
            <Mono style={{ color: "#C9D0CE", width: 42 }}>{klokke(h.tid)}</Mono>
            <Txt style={{ color: F.hvit, fontSize: 14, flex: 1 }} numberOfLines={1}>{h.tekst}</Txt>
          </Rad>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  mork: { flex: 1, backgroundColor: F.mork },
  topp: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: "rgba(17,21,23,0.55)" },
  prikk: { width: 10, height: 10, borderRadius: 5 },
  panel: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17,21,23,0.82)", padding: 20, gap: 10 },
  tellNa: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: F.gul, borderRadius: 10, borderWidth: 2, borderColor: F.tekst, paddingHorizontal: 16, height: 48 },
});
