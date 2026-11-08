import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Oppgave, Utfall } from "@/lib/typer";
import { send } from "@/lib/api";
import { hentNavn } from "@/lib/navn";
import { useHent } from "@/lib/useHent";
import { useOppdater } from "@/lib/useOppdater";
import { F, S, lagStil } from "@/lib/tema";
import { klokke } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Display, Etikett, Feilboks, HylleFlis, Knapp, Kort, Laster, Mono, Rad, Skjerm, Swatch, Txt } from "@/components/ui";

const UTFALL: Record<Utfall, string> = { funnet: "funnet", svinn: "svinn", salg: "salg", falsk_alarm: "falsk alarm" };
const TYPE: Record<Oppgave["type"], string> = { pafyll: "Påfyll", sjekk: "Sjekk", avvik: "Avvik", pakk: "Pakking", annet: "Oppgave" };

/** Én oppgave: les hva som skal gjøres, ta den, og si fra når den er ferdig. */
export default function OppgaveDetalj() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, feil, last, setData } = useHent<{ oppgave: Oppgave }>(`/api/oppgaver/${encodeURIComponent(id ?? "")}`);
  const o = data?.oppgave;
  // Pakkeoppgaven oppdaterer seg når varene skannes ut på skanneskjermen.
  useOppdater(last, 4);
  const [sender, setSender] = useState(false);
  const [sendFeil, setSendFeil] = useState<string | null>(null);
  const [velgUtfall, setVelgUtfall] = useState(false);

  // Si fra at oppgaven er åpnet. For oppdrag fra dashbordet viser driftsleder da «Mottatt på skanneren».
  useEffect(() => {
    if (id) send(`/api/oppgaver/${encodeURIComponent(id)}`, { handling: "apnet", navn: hentNavn() }).catch(() => {});
  }, [id]);

  const handling = async (h: "ta" | "ferdig", utfall?: Utfall) => {
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

  const ferdigTrykk = () => (o?.valg?.length ? setVelgUtfall(true) : handling("ferdig"));
  const alleSkannet = (o?.plukket ?? 0) >= (o?.antall ?? 1);

  // Avvik: valgene vises med en gang, samme som i dashbordet. Det du velger, lukker avviket begge steder.
  const bunn = !o || o.status === "ferdig" ? undefined : o.valg?.length && (velgUtfall || o.type === "avvik") ? (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17, textAlign: "center" }}>Hva fant du?</Txt>
      {o.valg.map((v) => (
        <Knapp key={v.id} tekst={v.tekst} variant={v.id === "svinn" ? "mork" : v.id === "falsk_alarm" ? "hvit" : "gul"} laster={sender} onPress={() => handling("ferdig", v.id)} />
      ))}
      {o.status === "ny" && (
        <Pressable onPress={() => handling("ta")} style={{ alignSelf: "center", padding: 6 }} hitSlop={10}>
          <Txt style={{ textDecorationLine: "underline" }}>Jeg tar den, sjekker først</Txt>
        </Pressable>
      )}
    </View>
  ) : o.status === "ny" ? (
    <Knapp tekst="Jeg tar den" ikon="pilHoyre" laster={sender} onPress={() => handling("ta")} />
  ) : o.type === "pakk" ? (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17, textAlign: "center" }}>
        {alleSkannet ? "Alt er skannet ut. Trykk Ferdig." : `Skannet ut: ${o.plukket ?? 0} av ${o.antall ?? 1}`}
      </Txt>
      {!alleSkannet && <Knapp tekst="Skann varen ut" ikon="skann" onPress={() => router.push("/skann")} />}
      <Knapp tekst="Ferdig" ikon="hake" variant={alleSkannet ? "gul" : "hvit"} deaktivert={!alleSkannet} laster={sender} onPress={() => handling("ferdig")} />
    </View>
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
      ? [F.gronnlys, `Ferdig${o.ferdigTid ? ` ${klokke(o.ferdigTid)}` : ""}${o.utfall ? ` · ${UTFALL[o.utfall]}` : ""}`]
      : o.status === "pagar"
        ? [F.gullys, `${o.tattAv ?? "Noen"} jobber med den`]
        : [F.graa, "Ingen har tatt den ennå"];
  return (
    <View style={[st.status, { backgroundColor: bg }]}>
      <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 15 }}>{tekst}</Txt>
    </View>
  );
}

const st = lagStil(() => ({
  merke: { backgroundColor: F.rod, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  status: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: F.kant, alignSelf: "flex-start" },
}));
