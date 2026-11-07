import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Oversikt } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F } from "@/lib/tema";
import { datoLang, hilsen } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { LoggRad } from "@/components/LoggRad";
import { Display, Etikett, Feilboks, Knapp, LenkeKnapp, Rad, Seksjon, Txt } from "@/components/ui";

export default function Hjem() {
  const inn = useSafeAreaInsets();
  const { data, feil, laster, last } = useHent<Oversikt>("/api/oversikt");
  const avvik = data?.apneAvvik.length ?? 0;
  const ikkeTalt = data ? data.antallHyller - data.taltIdag : 0;
  const ting = avvik + (ikkeTalt > 0 ? 1 : 0);
  const kommIGang = !!data && data.antallHyller === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: F.bg }}
      contentContainerStyle={[st.innhold, { paddingTop: inn.top + 10 }]}
      refreshControl={<RefreshControl refreshing={laster && !!data} onRefresh={last} />}
    >
      <Rad style={{ justifyContent: "space-between" }}>
        <Rad gap={10}>
          <View style={st.logo}>
            {[0, 1, 2].map((i) => <View key={i} style={st.logoStrek} />)}
          </View>
          <Display style={{ fontSize: 34, letterSpacing: -1.4 }}>Hylla</Display>
        </Rad>
        <Pressable accessibilityLabel="Innstillinger" hitSlop={12} onPress={() => router.push("/innstillinger")}>
          <Ikon navn="tannhjul" size={24} />
        </Pressable>
      </Rad>
      <View style={st.strek} />

      <View style={st.hero}>
        <Etikett style={{ color: F.tekst }}>{`${data?.lager ?? "Lager"} / ${datoLang(new Date().toISOString())}`}</Etikett>
        <Display style={st.heroTekst}>
          {hilsen()}
          {"\n"}
          {!data ? "Henter lageret …" : kommIGang ? "La oss sette opp lageret." : ting === 0 ? "Alt ser bra ut i dag." : `${ting} ting trenger deg i dag.`}
        </Display>
        <View style={st.strekkode}>
          {Array.from({ length: 28 }).map((_, i) => <View key={i} style={{ width: i % 3 === 0 ? 3 : 1.5, height: 14, backgroundColor: F.tekst }} />)}
        </View>
      </View>

      {feil && <Feilboks melding={feil} igjen={last} />}

      {data && kommIGang && (
        <Seksjon tittel="Kom i gang">
          <Steg nr={1} tekst="Lag en hylle" ferdig={data.antallHyller > 0} onPress={() => router.push("/ny-hylle")} />
          <Steg nr={2} tekst="Velg produkt for kamerasonen" ferdig={false} aktiv={data.antallHyller > 0} onPress={() => router.push("/kameraer")} />
          <Steg nr={3} tekst="Skann varene" ferdig={false} aktiv={data.antallHyller > 0} onPress={() => router.navigate("/skann")} />
        </Seksjon>
      )}

      <Rad gap={8}>
        <Tall tall={data ? String(data.varerPaaLager) : "–"} tekst="varer på lager" />
                <Tall
          tall={String(avvik)}
          tekst="mulig svinn"
          rod={avvik > 0}
          onPress={() => (data?.apneAvvik[0] ? router.push({ pathname: "/avvik/[id]", params: { id: data.apneAvvik[0].id } }) : router.navigate("/logg"))}
        />
      </Rad>

      <Knapp tekst="Skann" ikon="skann" pil onPress={() => router.navigate("/skann")} />
      <Knapp tekst="Spør Hylla" undertekst="Hold inne og snakk" ikon="mikrofon" variant="mork" onPress={() => router.navigate("/spor")} />

      <Seksjon tittel="Siste hendelser" hoyre={<LenkeKnapp tekst="Se alle" onPress={() => router.navigate("/logg")} />}>
        {data?.siste.map((r) => <LoggRad key={r.id} r={r} />)}
        {data && data.siste.length === 0 && <Txt style={{ color: F.dempet }}>Ingen hendelser ennå.</Txt>}
      </Seksjon>
    </ScrollView>
  );
}

function Steg({ nr, tekst, ferdig, aktiv = true, onPress }: { nr: number; tekst: string; ferdig: boolean; aktiv?: boolean; onPress: () => void }) {
  const na = aktiv && !ferdig;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.steg, na && { borderColor: F.tekst, borderWidth: 2, backgroundColor: F.gullys }, pressed && { opacity: 0.7 }]}>
      <View style={[st.stegNr, ferdig && { backgroundColor: F.tekst }]}>
        {ferdig ? <Ikon navn="hake" size={16} farge={F.hvit} /> : <Txt style={{ fontSize: 14, fontWeight: "600" }}>{nr}</Txt>}
      </View>
      <Txt style={{ flex: 1, fontSize: 16, color: ferdig ? F.dempet : F.tekst, textDecorationLine: ferdig ? "line-through" : "none" }}>{tekst}</Txt>
      {!ferdig && <Ikon navn="pil" size={20} farge={na ? F.tekst : F.dempet} />}
    </Pressable>
  );
}

function Tall({ tall, tekst, rod, onPress }: { tall: string; tekst: string; rod?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.tall, rod && { backgroundColor: F.rodlys, borderColor: F.rodlys }, pressed && { opacity: 0.7 }]}>
      <Rad gap={6}>
        <Display style={{ fontSize: 30, color: rod ? F.rod : F.tekst }}>{tall}</Display>
        {rod && <Ikon navn="pilOpp" size={26} farge={F.rod} tykk={1.6} />}
      </Rad>
      <Txt style={{ fontSize: 13, color: rod ? F.rod : F.tekst }}>{tekst}</Txt>
    </Pressable>
  );
}

const st = StyleSheet.create({
  innhold: { paddingHorizontal: 16, gap: 14, paddingBottom: 32 },
  logo: { width: 22, height: 28, borderWidth: 2, borderColor: F.tekst, backgroundColor: F.gul, borderRadius: 3, justifyContent: "center", gap: 3, paddingHorizontal: 3 },
  logoStrek: { height: 2, backgroundColor: F.tekst },
  strek: { height: 2, backgroundColor: F.tekst, marginTop: -4 },
  hero: { backgroundColor: F.gul, borderWidth: 2, borderColor: F.tekst, borderRadius: 12, padding: 20, gap: 14, marginTop: 4 },
  heroTekst: { fontSize: 30, lineHeight: 33, letterSpacing: -1.2 },
  strekkode: { flexDirection: "row", gap: 2.5, marginTop: 6 },
  steg: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: F.hvit, borderWidth: 1, borderColor: F.kant, borderRadius: 12, padding: 14 },
  stegNr: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: F.tekst, alignItems: "center", justifyContent: "center" },
  tall: { flex: 1, backgroundColor: F.hvit, borderWidth: 1, borderColor: F.kant, borderRadius: 12, padding: 12, gap: 6, minHeight: 92, justifyContent: "space-between" },
});
