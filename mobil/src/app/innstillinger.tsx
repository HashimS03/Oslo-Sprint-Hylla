import { useState, type ReactNode } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import type { Innstillinger as Inn, InnstillingerSvar } from "@/lib/typer";
import { apiUrl, send } from "@/lib/api";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { Etikett, Feilboks, LenkeKnapp, Mono, Rad, Skjerm, Txt } from "@/components/ui";

export default function Innstillinger() {
  const { data, feil, last, setData } = useHent<InnstillingerSvar>("/api/innstillinger");
  const [nullstiller, setNullstiller] = useState(false);
  const inn = data?.innstillinger;

  const endre = async (e: Partial<Inn>) => {
    if (!data) return;
    setData({ ...data, innstillinger: { ...data.innstillinger, ...e } });
    try {
      await send("/api/innstillinger", e);
    } catch {
      last();
    }
  };

  const nullstill = () =>
    Alert.alert("Nullstille demoen?", "All data går tilbake til demomanuset.", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Nullstill", style: "destructive", onPress: async () => {
          setNullstiller(true);
          await send("/api/demo/nullstill", {}).catch(() => {});
          setNullstiller(false);
          last();
        },
      },
    ]);

  return (
    <Skjerm tittel="Innstillinger" fane="index">
      {feil && <Feilboks melding={feil} igjen={last} />}
      <Etikett>Lager</Etikett>
      <Gruppe>
        <Linje tittel="Lager" fet hoyre={<Txt>{inn?.lager ?? "–"}</Txt>} />
        <Linje tittel="Reoler og hyller" hoyre={<Txt style={{ color: F.dempet }}>{data ? `${data.reoler} reoler · ${data.hyller} hyller` : "–"}</Txt>} />
        <Linje
          tittel="Terskel for svinnvarsel"
          siste
          hoyre={inn && <Stepper verdi={inn.svinnTerskel} min={1} max={10} enhet="stk" endre={(v) => endre({ svinnTerskel: v })} />}
        />
      </Gruppe>

      <Etikett>Stemme</Etikett>
      <Gruppe>
        <Linje tittel="Språk" hoyre={<Txt>Norsk bokmål</Txt>} />
        <Linje
          tittel="Stemme"
          hoyre={
            <Rad gap={14}>
              <Txt style={{ color: F.dempet }}>{data?.stemme ?? "–"}</Txt>
              <LenkeKnapp tekst="Hør" onPress={() => Speech.speak("Du har tre brusbokser på Bord 1.", { language: "nb-NO" })} />
            </Rad>
          }
        />
        <Linje tittel="Svar høyt" hoyre={inn && <Avkryss pa={inn.svarHoyt} endre={(v) => endre({ svarHoyt: v })} />} />
        <Linje tittel="Spør når telleren er usikker" siste hoyre={inn && <Avkryss pa={inn.sporNaarUsikker} endre={(v) => endre({ sporNaarUsikker: v })} />} />
      </Gruppe>

      <Etikett>Kamera</Etikett>
      <Gruppe>
        <Linje tittel="Kameratelefoner" onPress={() => router.push("/kameraer")} hoyre={<Ikon navn="pil" size={20} />} />
        <Linje
          tittel="Bilde hvert"
          siste
          hoyre={inn && <Stepper verdi={inn.kameraIntervallMin} min={1} max={60} enhet="min" endre={(v) => endre({ kameraIntervallMin: v })} />}
        />
      </Gruppe>

      <Etikett>System</Etikett>
      <Gruppe>
        <Linje tittel="Teller" hoyre={<Mono>{data?.teller ?? "–"}</Mono>} />
        <Linje tittel="Lagring" hoyre={<Mono>{data?.lagring ?? "–"}</Mono>} />
        <Linje tittel="Server" siste hoyre={<Mono numberOfLines={1} style={{ maxWidth: 190 }}>{apiUrl().replace(/^https?:\/\//, "")}</Mono>} />
      </Gruppe>

      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <LenkeKnapp tekst={nullstiller ? "Nullstiller …" : "Nullstill demoen"} style={{ color: F.rod }} onPress={nullstill} />
      </View>
    </Skjerm>
  );
}

function Gruppe({ children }: { children: ReactNode }) {
  return <View style={st.gruppe}>{children}</View>;
}

function Linje({ tittel, hoyre, fet, siste, onPress }: { tittel: string; hoyre?: ReactNode; fet?: boolean; siste?: boolean; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[st.linje, !siste && st.skille]}>
      <Txt style={{ flex: 1, fontFamily: fet ? S.tekstHalvfet : S.tekst }}>{tittel}</Txt>
      {hoyre}
    </Pressable>
  );
}

function Avkryss({ pa, endre }: { pa: boolean; endre: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: pa }} hitSlop={10} onPress={() => endre(!pa)} style={[st.boks, pa && { backgroundColor: F.gul }]}>
      {pa && <Ikon navn="hake" size={20} tykk={2.6} />}
    </Pressable>
  );
}

function Stepper({ verdi, min, max, enhet, endre }: { verdi: number; min: number; max: number; enhet: string; endre: (v: number) => void }) {
  return (
    <Rad gap={0} style={st.stepper}>
      <Pressable hitSlop={6} onPress={() => endre(Math.max(min, verdi - 1))} style={st.stepKnapp}><Txt style={{ fontSize: 18 }}>−</Txt></Pressable>
      <Txt style={{ minWidth: 54, textAlign: "center", fontSize: 14 }}>{verdi} {enhet}</Txt>
      <Pressable hitSlop={6} onPress={() => endre(Math.min(max, verdi + 1))} style={st.stepKnapp}><Txt style={{ fontSize: 18 }}>+</Txt></Pressable>
    </Rad>
  );
}

const st = StyleSheet.create({
  gruppe: { backgroundColor: F.hvit, borderWidth: 1.5, borderColor: F.tekst, borderRadius: 12, paddingHorizontal: 16, marginBottom: 6 },
  linje: { flexDirection: "row", alignItems: "center", minHeight: 58, gap: 12 },
  skille: { borderBottomWidth: 1, borderBottomColor: F.kant },
  boks: { width: 28, height: 28, borderRadius: 4, borderWidth: 1.5, borderColor: F.tekst, alignItems: "center", justifyContent: "center" },
  stepper: { borderWidth: 1, borderColor: F.kant, borderRadius: 8, backgroundColor: F.graa },
  stepKnapp: { width: 34, height: 36, alignItems: "center", justifyContent: "center" },
});
