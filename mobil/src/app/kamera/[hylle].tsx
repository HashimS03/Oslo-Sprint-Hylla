import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import * as Battery from "expo-battery";
import * as Device from "expo-device";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Forslag } from "@/lib/typer";
import { send } from "@/lib/api";
import { tilJpeg } from "@/lib/bilde";
import { F, S } from "@/lib/tema";
import { fortegn, klokke } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Display, Knapp, Mono, Rad, Txt } from "@/components/ui";

type Hendelse = { tid: string; tekst: string; endring?: number; ny?: boolean };
type Status = "starter" | "bevegelse" | "stille" | "uendret" | "teller" | "pause" | "feil";
type RammeSvar = { status: Status | "talt"; bevegelse: number; endring: number; forslag?: Forslag; feil?: string };

const STATUS_TEKST: Record<Status, string> = {
  starter: "Starter …",
  bevegelse: "Ser bevegelse",
  stille: "Venter på ro",
  uendret: "Alt som før",
  teller: "Teller …",
  pause: "Kort pause",
  feil: "Feil",
};

/**
 * Kameratelefonen («RFID-kameraet»): står på stativ foran bordet eller hylla, holder skjermen våken
 * og sender et bilde til /api/kamera/ramme hvert sekund. Backend teller bare når noe er flyttet og bildet har roet seg,
 * og lagrer endringene i loggen med en gang.
 */
export default function KameraStasjon() {
  useKeepAwake();
  const inn = useSafeAreaInsets();
  const { hylle } = useLocalSearchParams<{ hylle: string }>();
  const [tillatelse, spor] = useCameraPermissions();
  const kamera = useRef<CameraView>(null);
  const [klar, setKlar] = useState(false);
  const [status, setStatus] = useState<Status>("starter");
  const [mal, setMal] = useState({ bevegelse: 0, endring: 0 });
  const [logg, setLogg] = useState<Hendelse[]>([]);
  const tving = useRef(false);
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

  // Meld fra at kameraet lever.
  useEffect(() => {
    pling();
    const t = setInterval(pling, 60_000);
    return () => clearInterval(t);
  }, [pling]);

  const leggTilLogg = useCallback((h: Hendelse) => setLogg((l) => [h, ...l].slice(0, 6)), []);

  // Én runde: ta bilde, send det, og vis hva backend gjorde.
  const runde = useCallback(async () => {
    if (!kamera.current) return;
    const b = await kamera.current.takePictureAsync({ quality: 0.5, shutterSound: false, skipProcessing: true });
    const [bilde, liten] = await Promise.all([tilJpeg(b.uri, 1024, 0.65), tilJpeg(b.uri, 320, 0.5)]);
    const tvang = tving.current;
    tving.current = false;
    const res = await send<RammeSvar>("/api/kamera/ramme", { kameraId, hylle, bilde, liten, tving: tvang });
    setStatus(res.status === "talt" ? "uendret" : res.status);
    setMal({ bevegelse: res.bevegelse, endring: res.endring });
    if (res.status === "talt" && res.forslag) {
      const endringer = res.forslag.endringer.filter((e) => e.deler.length > 0);
      const svinn = endringer.some((e) => e.deler.some((d) => d.type === "mulig_svinn"));
      leggTilLogg({
        tid: new Date().toISOString(),
        tekst: endringer.length === 0 ? "Talt, ingen endring" : `${endringer.map((e) => `${e.navn} ${fortegn(e.na - e.forrige)}`).join(", ")}${svinn ? " · mulig svinn" : ""}`,
        endring: endringer.reduce((sum, e) => sum + e.na - e.forrige, 0),
      });
      if (res.forslag.ukjente.length > 0) {
        leggTilLogg({ tid: new Date().toISOString(), tekst: `Ny vare? ${res.forslag.ukjente.join(", ")}`, ny: true });
      }
    } else if (res.status === "feil") {
      leggTilLogg({ tid: new Date().toISOString(), tekst: res.feil ?? "Tellingen feilet" });
    }
  }, [kameraId, hylle, leggTilLogg]);

  // Kjører rundene etter hverandre så lenge skjermen er åpen.
  useEffect(() => {
    if (!klar) return;
    let stopp = false;
    (async () => {
      while (!stopp) {
        try {
          await runde();
        } catch (e) {
          setStatus("feil");
          leggTilLogg({ tid: new Date().toISOString(), tekst: e instanceof Error ? e.message : "Fikk ikke kontakt med backend" });
          await new Promise((r) => setTimeout(r, 4000));
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    })();
    return () => { stopp = true; };
  }, [klar, runde, leggTilLogg]);

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
          <View style={{ flex: 1 }}>
            <Txt style={{ color: "#C9D0CE", fontSize: 13 }}>Kameraet følger med</Txt>
            <Display style={{ color: F.hvit, fontSize: 30 }}>{STATUS_TEKST[status]}</Display>
          </View>
          <Pressable onPress={() => { tving.current = true; }} disabled={!klar || status === "teller"} style={({ pressed }) => [st.tellNa, pressed && { opacity: 0.7 }, (!klar || status === "teller") && { opacity: 0.5 }]}>
            <Ikon navn="kamera" size={20} />
            <Txt style={{ fontFamily: S.tekstHalvfet }}>Tell nå</Txt>
          </Pressable>
        </Rad>
        <Mono style={{ color: "#9AA3A6" }}>
          {navn} · bevegelse {Math.round(mal.bevegelse * 100)} % · endring {Math.round(mal.endring * 100)} %
        </Mono>
        {logg.map((h, i) => (
          <Rad key={i} style={{ opacity: i === 0 ? 1 : 0.6 }}>
            <Mono style={{ color: "#C9D0CE", width: 42 }}>{klokke(h.tid)}</Mono>
            <Txt style={{ color: h.ny ? F.gul : F.hvit, fontSize: 14, flex: 1 }} numberOfLines={1}>{h.tekst}</Txt>
            {h.ny && (
              <Pressable hitSlop={8} onPress={() => router.push("/ny-vare")}>
                <Txt style={{ color: F.gul, fontFamily: S.tekstHalvfet, fontSize: 14 }}>Legg til</Txt>
              </Pressable>
            )}
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
