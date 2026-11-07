import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from "react-native";
import {
  createAudioPlayer, requestRecordingPermissionsAsync, RecordingPresets, setAudioModeAsync, useAudioRecorder, type AudioPlayer,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import type { Kort, SporSvar } from "@/lib/typer";
import { ApiFeil, send, sendSkjema } from "@/lib/api";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { KortVisning } from "@/components/KortVisning";
import { Etikett, Rad, Skjerm, Txt } from "@/components/ui";

type Melding = { id: number; rolle: "bruker" | "hylla"; tekst: string; kort?: Kort[]; lyd?: string };

const FORSLAG = ["Hvor mange kaffekopper har vi igjen?", "Hva er mulig svinn i dag?", "Når kom PO-3001?"];

let nesteId = 1;
const klokkeMs = () => Date.now();

export default function SporHylla() {
  const [meldinger, setMeldinger] = useState<Melding[]>([]);
  const [tenker, setTenker] = useState(false);
  const [lytter, setLytter] = useState(false);
  const [tekst, setTekst] = useState("");
  const rull = useRef<ScrollViewInstance>(null);
  const opptaker = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const startTid = useRef(0);
  const spiller = useRef<AudioPlayer | null>(null);

  const historikk = () => meldinger.filter((m) => m.tekst).slice(-10).map((m) => ({ rolle: m.rolle, tekst: m.tekst }));
  const leggTil = (m: Omit<Melding, "id">) => setMeldinger((ms) => [...ms, { ...m, id: nesteId++ }]);

  /** Spiller ElevenLabs-lyden hvis vi fikk den, ellers leser telefonen opp selv. */
  const lesHoyt = (svar: string, lyd?: string) => {
    Speech.stop();
    spiller.current?.remove();
    spiller.current = null;
    if (lyd?.startsWith("data:") && Platform.OS === "web") {
      const p = createAudioPlayer(lyd);
      spiller.current = p;
      p.play();
      return;
    }
    if (lyd?.startsWith("data:")) {
      try {
        const fil = new File(Paths.cache, `hylla-${klokkeMs()}.mp3`);
        fil.writeSync(lyd.slice(lyd.indexOf(",") + 1), { encoding: "base64" });
        const p = createAudioPlayer(fil.uri);
        spiller.current = p;
        p.play();
        return;
      } catch {
        /* faller tilbake til telefonens stemme */
      }
    }
    Speech.speak(svar, { language: "nb-NO" });
  };

  const sporTekst = async (sporsmal: string) => {
    if (!sporsmal.trim() || tenker) return;
    const h = [...historikk(), { rolle: "bruker" as const, tekst: sporsmal }];
    leggTil({ rolle: "bruker", tekst: sporsmal });
    setTenker(true);
    try {
      const svar = await send<SporSvar>("/api/spor", { historikk: h });
      leggTil({ rolle: "hylla", tekst: svar.svar, kort: svar.kort });
    } catch (e) {
      leggTil({ rolle: "hylla", tekst: e instanceof Error ? e.message : "Noe gikk galt." });
    } finally {
      setTenker(false);
    }
  };

  const startOpptak = async () => {
    if (lytter || tenker) return;
    const tillatelse = await requestRecordingPermissionsAsync();
    if (!tillatelse.granted) {
      leggTil({ rolle: "hylla", tekst: "Jeg trenger tilgang til mikrofonen for å høre deg. Du kan også skrive spørsmålet." });
      return;
    }
    Speech.stop();
    spiller.current?.pause();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await opptaker.prepareToRecordAsync();
    opptaker.record();
    startTid.current = klokkeMs();
    setLytter(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const stoppOpptak = async () => {
    if (!lytter) return;
    setLytter(false);
    await opptaker.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = opptaker.uri;
    if (!uri || klokkeMs() - startTid.current < 500) return;

    setTenker(true);
    const skjema = new FormData();
    if (Platform.OS === "web") {
      // I nettleseren er opptaket en blob:-URL, så vi henter selve lyden og sender den.
      const blob = await (await fetch(uri)).blob();
      skjema.append("lyd", blob, blob.type.includes("mp4") ? "sporsmal.m4a" : "sporsmal.webm");
    } else {
      // På telefonen laster React Native opp filen fra uri-en.
      skjema.append("lyd", { uri, name: "sporsmal.m4a", type: "audio/m4a" } as unknown as Blob);
    }
    skjema.append("historikk", JSON.stringify(historikk()));
    try {
      const svar = await sendSkjema<SporSvar>("/api/stemme/sporsmal", skjema);
      if (svar.sporsmal) leggTil({ rolle: "bruker", tekst: svar.sporsmal });
      leggTil({ rolle: "hylla", tekst: svar.svar, kort: svar.kort, lyd: svar.lyd });
      lesHoyt(svar.svar, svar.lyd);
    } catch (e) {
      const trengerTekst = e instanceof ApiFeil && (e.data as { trengerTekst?: boolean })?.trengerTekst;
      leggTil({
        rolle: "hylla",
        tekst: trengerTekst ? "Stemmen er ikke satt opp på serveren ennå (ELEVENLABS_API_KEY). Skriv spørsmålet i feltet under, så svarer jeg." : e instanceof Error ? e.message : "Noe gikk galt.",
      });
    } finally {
      setTenker(false);
    }
  };

  return (
    <Skjerm tittel="Spør Hylla" tilbake={false} rull={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={rull} contentContainerStyle={st.liste} onContentSizeChange={() => rull.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled">
          {meldinger.length === 0 && (
            <Txt style={{ color: F.dempet, fontSize: 15, marginBottom: 4 }}>Spør om beholdning, innkjøp, plukk eller svinn. Hylla svarer høyt og viser tallene her.</Txt>
          )}
          {meldinger.map((m) =>
            m.rolle === "bruker" ? (
              <View key={m.id} style={st.bruker}>
                <Txt style={{ color: F.hvit, fontSize: 15, lineHeight: 21 }}>{m.tekst}</Txt>
              </View>
            ) : (
              <View key={m.id} style={{ gap: 10 }}>
                <Rad gap={6}>
                  <Etikett>Hylla</Etikett>
                  <Pressable accessibilityLabel="Les høyt" hitSlop={10} onPress={() => lesHoyt(m.tekst, m.lyd)}>
                    <Ikon navn="hoyttaler" size={18} farge={F.dempet} />
                  </Pressable>
                </Rad>
                {!!m.tekst && (
                  <View style={st.svar}>
                    <Txt style={{ fontSize: 16, lineHeight: 23 }}>{m.tekst}</Txt>
                  </View>
                )}
                {m.kort?.map((k, i) => <KortVisning key={i} kort={k} />)}
              </View>
            ),
          )}
          {tenker && (
            <Rad style={st.svar}>
              <ActivityIndicator color={F.tekst} size="small" />
              <Txt style={{ color: F.dempet }}>Slår opp …</Txt>
            </Rad>
          )}
          <View style={st.forslag}>
            {FORSLAG.map((f) => (
              <Pressable key={f} onPress={() => sporTekst(f)} style={({ pressed }) => [st.forslagKnapp, pressed && { opacity: 0.6 }]}>
                <Txt style={{ fontSize: 13 }} numberOfLines={1}>{f}</Txt>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={st.mikDel}>
          <Rad gap={4} style={{ height: 16, opacity: lytter ? 1 : 0.35 }}>
            {[6, 10, 14, 8, 16, 12, 6, 10, 14, 8, 12, 6, 10].map((h, i) => (
              <View key={i} style={{ width: 3, height: lytter ? h : 3, borderRadius: 2, backgroundColor: lytter ? F.gul : F.tekst }} />
            ))}
          </Rad>
          <Pressable
            accessibilityLabel="Hold inne og snakk"
            onPressIn={startOpptak}
            onPressOut={stoppOpptak}
            style={[st.mik, lytter && { transform: [{ scale: 1.1 }] }]}
          >
            <Ikon navn="mikrofon" size={30} />
          </Pressable>
          <Txt style={{ color: F.dempet, fontSize: 15 }}>{lytter ? "Lytter … slipp når du er ferdig" : tenker ? "Slår opp …" : "Hold inne og snakk"}</Txt>
          <Rad style={st.felt}>
            <TextInput
              value={tekst}
              onChangeText={setTekst}
              placeholder="Eller skriv spørsmålet …"
              placeholderTextColor={F.dempet}
              style={st.input}
              returnKeyType="send"
              onSubmitEditing={() => {
                sporTekst(tekst);
                setTekst("");
              }}
            />
            <Pressable
              accessibilityLabel="Send"
              onPress={() => {
                sporTekst(tekst);
                setTekst("");
              }}
              style={st.send}
            >
              <Ikon navn="pil" size={18} farge={F.hvit} />
            </Pressable>
          </Rad>
        </View>
      </KeyboardAvoidingView>
    </Skjerm>
  );
}

const st = StyleSheet.create({
  liste: { padding: 16, gap: 14 },
  bruker: { alignSelf: "flex-end", maxWidth: "88%", backgroundColor: F.tekst, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  svar: { backgroundColor: F.hvit, borderWidth: 1.5, borderColor: F.tekst, borderRadius: 10, padding: 16, gap: 10 },
  forslag: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  forslagKnapp: { borderWidth: 1, borderColor: F.kant, backgroundColor: F.hvit, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%" },
  mikDel: { alignItems: "center", gap: 10, paddingTop: 6, paddingBottom: 10, paddingHorizontal: 16 },
  mik: { width: 72, height: 72, borderRadius: 36, backgroundColor: F.gul, borderWidth: 2, borderColor: F.tekst, alignItems: "center", justifyContent: "center" },
  felt: { alignSelf: "stretch", gap: 8 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: F.kant, borderRadius: 10, backgroundColor: F.hvit, paddingHorizontal: 12, fontFamily: S.tekst, fontSize: 15, color: F.tekst },
  send: { width: 44, height: 44, borderRadius: 10, backgroundColor: F.tekst, alignItems: "center", justifyContent: "center" },
});
