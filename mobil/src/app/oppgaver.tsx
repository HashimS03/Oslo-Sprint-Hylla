import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import type { Oppgave, OppgaverSvar } from "@/lib/typer";
import { useNavn } from "@/lib/navn";
import { useHent } from "@/lib/useHent";
import { useOppdater } from "@/lib/useOppdater";
import { F, S, lagStil } from "@/lib/tema";
import { klokke } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Display, Feilboks, Laster, Mono, Rad, Skjerm, Txt } from "@/components/ui";

/** Oppgaver fra driftsleder. Mine først, så ledige, så de som er ferdige. */
export default function Oppgaver() {
  const { data, feil, laster, last } = useHent<OppgaverSvar>("/api/oppgaver");
  const { navn } = useNavn();
  useOppdater(last);

  const alle = data?.oppgaver ?? [];
  const mine = alle.filter((o) => o.status === "pagar" && o.tattAv === navn);
  const ledige = alle.filter((o) => o.status === "ny");
  const andres = alle.filter((o) => o.status === "pagar" && o.tattAv !== navn);
  const ferdige = alle.filter((o) => o.status === "ferdig").slice(0, 10);

  return (
    <Skjerm tittel="Oppgaver" rull={false}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={laster && !!data} onRefresh={last} />}
      >
        {feil && !data && <Feilboks melding={feil} igjen={last} />}
        {!data && !feil && <Laster />}
        {data && alle.filter((o) => o.status !== "ferdig").length === 0 && (
          <View style={st.tom}>
            <Ikon navn="hake" size={48} />
            <Display style={{ fontSize: 24 }}>Ingen oppgaver nå</Display>
            <Txt style={{ color: F.dempet, fontSize: 16, textAlign: "center" }}>Nye oppgaver fra driftsleder dukker opp her.</Txt>
          </View>
        )}
        <Gruppe tittel="Mine" liste={mine} />
        <Gruppe tittel="Ledige" liste={ledige} />
        <Gruppe tittel="Andre jobber med" liste={andres} />
        <Gruppe tittel="Ferdige" liste={ferdige} />
      </ScrollView>
    </Skjerm>
  );
}

function Gruppe({ tittel, liste }: { tittel: string; liste: Oppgave[] }) {
  if (liste.length === 0) return null;
  return (
    <View style={{ gap: 10, marginTop: 6 }}>
      <Display style={{ fontSize: 19 }}>{tittel} ({liste.length})</Display>
      {liste.map((o) => <OppgaveKort key={o.id} o={o} />)}
    </View>
  );
}

function OppgaveKort({ o }: { o: Oppgave }) {
  const ferdig = o.status === "ferdig";
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/oppgave/[id]", params: { id: o.id } })}
      style={({ pressed }) => [st.kort, ferdig && st.ferdig, o.prioritet === "hoy" && !ferdig && st.hoy, pressed && { opacity: 0.7 }]}
    >
      <View style={[st.ikon, { backgroundColor: ferdig ? F.graa : o.type === "avvik" ? F.rodlys : F.gronnlys }]}>
        <Ikon navn={ferdig ? "hake" : o.type === "pafyll" ? "varer" : o.type === "sjekk" ? "sok" : o.type === "avvik" ? "advarsel" : "logg"} size={24} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Rad gap={6}>
          {o.prioritet === "hoy" && !ferdig && (
            <View style={st.merke}><Mono style={{ color: F.hvit, fontSize: 11 }}>VIKTIG</Mono></View>
          )}
          <Txt style={[st.tittel, ferdig && { textDecorationLine: "line-through", color: F.dempet }]} numberOfLines={2}>{o.tittel}</Txt>
        </Rad>
        <Txt style={{ color: F.dempet, fontSize: 14 }} numberOfLines={1}>
          {[o.hylleNavn, o.vareNavn, o.status === "pagar" && o.tattAv ? `${o.tattAv} tok den` : null, ferdig && o.ferdigTid ? `ferdig ${klokke(o.ferdigTid)}` : null]
            .filter(Boolean).join(" · ")}
        </Txt>
      </View>
      <Ikon navn="pil" size={20} farge={F.dempet} />
    </Pressable>
  );
}

const st = lagStil(() => ({
  tom: { alignItems: "center", gap: 10, paddingVertical: 40 },
  kort: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: F.kort, borderWidth: 1, borderColor: F.kant,
    borderRadius: 14, padding: 14, minHeight: 76,
  },
  hoy: { borderColor: F.rod, borderWidth: 2.5 },
  ferdig: { opacity: 0.6, borderColor: F.kant },
  ikon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: F.tekst },
  tittel: { fontFamily: S.tekstHalvfet, fontSize: 17, flexShrink: 1 },
  merke: { backgroundColor: F.rod, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
}));
