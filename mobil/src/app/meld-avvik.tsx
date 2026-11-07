import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import type { AvvikGrunn, SkannVare } from "@/lib/typer";
import { send } from "@/lib/api";
import { hentNavn } from "@/lib/navn";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { Ikon, type IkonNavn } from "@/components/Ikon";
import { Display, Feilboks, Knapp, Laster, Rad, Skjerm, Swatch, Txt } from "@/components/ui";

const GRUNNER: { id: AvvikGrunn; tekst: string; ikon: IkonNavn }[] = [
  { id: "mangler", tekst: "Mangler", ikon: "sok" },
  { id: "skadet", tekst: "Skadet", ikon: "advarsel" },
  { id: "feil_plass", tekst: "Feil plass", ikon: "varer" },
  { id: "annet", tekst: "Annet", ikon: "logg" },
];

/**
 * Meld avvik på en vare. Meldingen går til dashbordet (driftsleder), ikke til appen.
 * Beholdningen endres bare ved «Mangler» og «Skadet», og da som en ny hendelse.
 */
export default function MeldAvvik() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { data, feil, last } = useHent<{ vare: SkannVare }>(`/api/skann/${encodeURIComponent(sku ?? "")}`);
  const v = data?.vare;
  const hylle = v?.hyller[0];
  const forventet = hylle?.antall ?? v?.antall ?? 0;

  const [grunn, setGrunn] = useState<AvvikGrunn | null>(null);
  const [antall, setAntall] = useState(0);
  const [notat, setNotat] = useState("");
  const [sender, setSender] = useState(false);
  const [sendFeil, setSendFeil] = useState<string | null>(null);
  const [sendt, setSendt] = useState(false);

  // Start-tallet: ved «Mangler» ett færre enn systemet tror, ved «Skadet» én.
  const velgGrunn = (g: AvvikGrunn) => {
    setGrunn(g);
    setSendFeil(null);
    if (g === "mangler") setAntall(Math.max(0, forventet - 1));
    if (g === "skadet") setAntall(1);
  };

  const trengerAntall = grunn === "mangler" || grunn === "skadet";
  const kanSende =
    !!grunn && !sender &&
    (grunn !== "mangler" || antall < forventet) &&
    (grunn !== "skadet" || antall >= 1) &&
    (grunn !== "annet" || notat.trim().length > 0);

  const sendInn = async () => {
    if (!v || !grunn) return;
    setSender(true);
    setSendFeil(null);
    try {
      await send("/api/meld-avvik", {
        sku: v.sku, hylle: hylle?.id, grunn, antall: trengerAntall ? antall : undefined,
        notat: notat.trim() || undefined, meldtAv: hentNavn() ?? undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSendt(true);
    } catch (e) {
      setSendFeil(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setSender(false);
    }
  };

  if (sendt) {
    return (
      <Skjerm tittel="Meld avvik" bunn={<Knapp tekst="Ferdig" onPress={() => router.back()} />}>
        <View style={st.ferdig}>
          <View style={st.hake}>
            <Ikon navn="hake" size={56} tykk={3} />
          </View>
          <Display style={{ fontSize: 28, textAlign: "center" }}>Sendt til driftsleder</Display>
          <Txt style={{ color: F.dempet, fontSize: 16, textAlign: "center", lineHeight: 22 }}>
            Takk! Driftsleder ser meldingen i dashbordet og bestemmer hva som skal skje.
          </Txt>
        </View>
      </Skjerm>
    );
  }

  return (
    <Skjerm
      tittel="Meld avvik"
      bunn={grunn && <Knapp tekst={sender ? "Sender …" : "Send"} ikon="pilHoyre" laster={sender} deaktivert={!kanSende} onPress={sendInn} />}
    >
      {feil && !v && <Feilboks melding={feil} igjen={last} />}
      {!v && !feil && <Laster />}
      {v && (
        <>
          <Rad gap={12}>
            <Swatch farge={v.swatch} size={44} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 18 }}>{v.navn}</Txt>
              <Txt style={{ color: F.dempet }}>{hylle ? `${hylle.navn} · ${forventet} i systemet` : `${forventet} i systemet`}</Txt>
            </View>
          </Rad>

          <Display style={{ fontSize: 22, marginTop: 6 }}>Hva er galt?</Display>
          <View style={st.grunner}>
            {GRUNNER.map((g) => {
              const valgt = grunn === g.id;
              return (
                <Pressable
                  key={g.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: valgt }}
                  onPress={() => velgGrunn(g.id)}
                  style={[st.grunn, valgt && { backgroundColor: F.gul, borderWidth: 3 }]}
                >
                  <Ikon navn={g.ikon} size={30} />
                  <Txt style={{ fontFamily: S.tekstFet, fontSize: 17 }}>{g.tekst}</Txt>
                </Pressable>
              );
            })}
          </View>

          {trengerAntall && (
            <View style={{ gap: 10, marginTop: 4 }}>
              <Display style={{ fontSize: 20 }}>{grunn === "mangler" ? "Hvor mange ser du?" : "Hvor mange er skadet?"}</Display>
              <Rad gap={14} style={{ justifyContent: "center" }}>
                <Pressable accessibilityLabel="En mindre" onPress={() => setAntall((a) => Math.max(0, a - 1))} style={st.pluss}>
                  <Txt style={st.plussTekst}>–</Txt>
                </Pressable>
                <Display style={{ fontSize: 54, minWidth: 90, textAlign: "center" }}>{antall}</Display>
                <Pressable accessibilityLabel="En mer" onPress={() => setAntall((a) => a + 1)} style={st.pluss}>
                  <Txt style={st.plussTekst}>+</Txt>
                </Pressable>
              </Rad>
              {grunn === "mangler" && (
                <Txt style={{ color: antall >= forventet ? F.rod : F.dempet, textAlign: "center", fontSize: 15 }}>
                  {antall >= forventet ? `Systemet sier ${forventet}. Da mangler det ingenting.` : `Det mangler ${forventet - antall}.`}
                </Txt>
              )}
            </View>
          )}

          {grunn && (
            <TextInput
              value={notat}
              onChangeText={setNotat}
              placeholder={grunn === "annet" ? "Skriv kort hva som er galt" : "Notat (valgfritt)"}
              placeholderTextColor={F.dempet}
              multiline
              maxLength={500}
              style={st.notat}
            />
          )}
          {sendFeil && <Feilboks melding={sendFeil} />}
        </>
      )}
    </Skjerm>
  );
}

const st = StyleSheet.create({
  grunner: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  grunn: {
    width: "48%", height: 100, borderRadius: 14, borderWidth: 2, borderColor: F.tekst, backgroundColor: F.hvit,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  pluss: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: F.tekst, backgroundColor: F.hvit, alignItems: "center", justifyContent: "center" },
  plussTekst: { fontFamily: S.tekstFet, fontSize: 30, lineHeight: 34 },
  notat: {
    minHeight: 80, borderWidth: 1.5, borderColor: F.kant, borderRadius: 12, backgroundColor: F.hvit, padding: 12,
    fontFamily: S.tekst, fontSize: 16, color: F.tekst, textAlignVertical: "top",
  },
  ferdig: { alignItems: "center", gap: 16, paddingTop: 48 },
  hake: { width: 110, height: 110, borderRadius: 55, backgroundColor: F.gronnlys, borderWidth: 2, borderColor: F.tekst, alignItems: "center", justifyContent: "center" },
});
