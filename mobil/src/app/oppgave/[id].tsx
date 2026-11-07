import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Oppgave } from "@/lib/typer";
import { send } from "@/lib/api";
import { hentNavn } from "@/lib/navn";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { klokke } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Display, Etikett, Feilboks, HylleFlis, Knapp, Kort, Laster, Mono, Rad, Skjerm, Swatch, Txt } from "@/components/ui";

const TYPE: Record<Oppgave["type"], string> = { pafyll: "Påfyll", sjekk: "Sjekk", avvik: "Avvik", annet: "Oppgave" };

/** Én oppgave: les hva som skal gjøres, ta den, og si fra når den er ferdig. */
export default function OppgaveDetalj() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, feil, last, setData } = useHent<{ oppgave: Oppgave }>(`/api/oppgaver/${encodeURIComponent(id ?? "")}`);
  const o = data?.oppgave;
  const [sender, setSender] = useState(false);
  const [sendFeil, setSendFeil] = useState<string | null>(null);
  const [velgUtfall, setVelgUtfall] = useState(false);

  // Si fra at oppgaven er åpnet. For oppdrag fra dashbordet viser driftsleder da «Mottatt på skanneren».
  useEffect(() => {
    if (id) send(`/api/oppgaver/${encodeURIComponent(id)}`, { handling: "apnet", navn: hentNavn() }).catch(() => {});
  }, [id]);

  const handling = async (h: "ta" | "ferdig", utfall?: "funnet" | "svinn") => {
    setSender(true);
    setSendFeil(null);
    try {
      const svar = await send<{ oppgave: Oppgave }>(`/api/oppgaver/${encodeURIComponent(id ?? "")}`, { handling: h, navn: hentNavn(), utfall });
      setData(svar);
      setVelgUtfall(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (h === "ferdig") router.back();
    } catch (e) {
      setSendFeil(e instanceof Error ? e.message : "Noe gikk galt");
      last();
    } finally {
      setSender(false);
    }
  };

  const ferdigTrykk = () => (o?.avvikId ? setVelgUtfall(true) : handling("ferdig"));

  const bunn = !o || o.status === "ferdig" ? undefined : velgUtfall ? (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17, textAlign: "center" }}>Fant du varen?</Txt>
      <Rad gap={10}>
        <Knapp style={{ flex: 1 }} tekst="Ja, funnet" ikon="hake" laster={sender} onPress={() => handling("ferdig", "funnet")} />
        <Knapp style={{ flex: 1 }} tekst="Nei, svinn" variant="mork" laster={sender} onPress={() => handling("ferdig", "svinn")} />
      </Rad>
      <Pressable onPress={() => setVelgUtfall(false)} style={{ alignSelf: "center", padding: 6 }} hitSlop={10}>
        <Txt style={{ textDecorationLine: "underline" }}>Avbryt</Txt>
      </Pressable>
    </View>
  ) : o.status === "ny" ? (
    <Knapp tekst="Jeg tar den" ikon="pilHoyre" laster={sender} onPress={() => handling("ta")} />
  ) : (
    <Knapp tekst="Ferdig" ikon="hake" laster={sender} onPress={ferdigTrykk} />
  );

  return (
    <Skjerm tittel="Oppgave" bunn={bunn}>
      {feil && !o && <Feilboks melding={feil} igjen={last} />}
      {!o && !feil && <Laster />}
      {o && (
        <>
          <Rad gap={8}>
            <Etikett>{TYPE[o.type]}</Etikett>
            {o.prioritet === "hoy" && o.status !== "ferdig" && (
              <View style={st.merke}><Mono style={{ color: F.hvit, fontSize: 11 }}>VIKTIG</Mono></View>
            )}
          </Rad>
          <Display style={{ fontSize: 30 }}>{o.tittel}</Display>
          {!!o.beskrivelse && <Txt style={{ fontSize: 17, lineHeight: 24 }}>{o.beskrivelse}</Txt>}

          <Status o={o} />

          {o.hylle && (
            <Kort>
              <Rad gap={14}>
                <HylleFlis id={o.hylle} size={52} />
                <View style={{ flex: 1 }}>
                  <Etikett>Hvor</Etikett>
                  <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>{o.hylleNavn ?? o.hylle}</Txt>
                </View>
              </Rad>
            </Kort>
          )}
          {o.sku && (
            <Pressable onPress={() => router.push({ pathname: "/vare/[sku]", params: { sku: o.sku! } })}>
              <Kort>
                <Rad gap={14}>
                  <Swatch farge={o.swatch ?? F.graa} size={52} />
                  <View style={{ flex: 1 }}>
                    <Etikett>Vare</Etikett>
                    <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>{o.vareNavn ?? o.sku}</Txt>
                  </View>
                  <Ikon navn="pil" size={20} />
                </Rad>
              </Kort>
            </Pressable>
          )}
          {sendFeil && <Feilboks melding={sendFeil} />}
          <Txt style={{ color: F.dempet, fontSize: 13 }}>
            Laget {klokke(o.opprettet)} av {o.opprettetAv === "takkamera" ? "takkameraet" : o.opprettetAv === "ansatt" ? "en ansatt" : "driftsleder"}
          </Txt>
        </>
      )}
    </Skjerm>
  );
}

function Status({ o }: { o: Oppgave }) {
  const [bg, tekst] =
    o.status === "ferdig"
      ? [F.gronnlys, `Ferdig${o.ferdigTid ? ` ${klokke(o.ferdigTid)}` : ""}${o.utfall ? ` · ${o.utfall === "funnet" ? "funnet" : "svinn"}` : ""}`]
      : o.status === "pagar"
        ? [F.gullys, `${o.tattAv ?? "Noen"} jobber med den`]
        : [F.graa, "Ingen har tatt den ennå"];
  return (
    <View style={[st.status, { backgroundColor: bg }]}>
      <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 15 }}>{tekst}</Txt>
    </View>
  );
}

const st = StyleSheet.create({
  merke: { backgroundColor: F.rod, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  status: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: F.kant, alignSelf: "flex-start" },
});
