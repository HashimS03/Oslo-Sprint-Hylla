import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { F, S } from "@/lib/tema";
import { Ikon, type IkonNavn } from "./Ikon";

// ---------- Tekst ----------

type T = TextProps & { style?: StyleProp<TextStyle>; children?: ReactNode };

export const Txt = ({ style, ...p }: T) => <Text {...p} style={[st.tekst, style]} />;
export const Display = ({ style, ...p }: T) => <Text {...p} style={[st.display, style]} />;
export const Mono = ({ style, ...p }: T) => <Text {...p} style={[st.mono, style]} />;
export const Etikett = ({ style, children, ...p }: T) => (
  <Text {...p} style={[st.etikett, style]}>
    {typeof children === "string" ? children.toUpperCase() : children}
  </Text>
);

// ---------- Skjerm ----------

/**
 * Felles ramme: overskrift med tilbakepil og strek, innhold som ruller, og et valgfritt fast felt nederst.
 * `fane` er utgått (appen har ingen faner lenger) og blir ignorert. Den finnes bare så eldre skjermer fortsatt kompilerer.
 */
export function Skjerm({
  tittel, tilbake = true, hoyre, children, bunn, rull = true, innholdStil,
}: {
  tittel?: string; tilbake?: boolean; hoyre?: ReactNode; children: ReactNode; bunn?: ReactNode; fane?: string;
  rull?: boolean; innholdStil?: StyleProp<ViewStyle>;
}) {
  const inn = useSafeAreaInsets();
  return (
    <View style={[st.skjerm, { paddingTop: inn.top }]}>
      {tittel !== undefined && (
        <View style={st.topp}>
          <View style={st.toppRad}>
            {tilbake && (
              <Pressable accessibilityLabel="Tilbake" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={st.tilbake}>
                <Ikon navn="tilbake" size={24} />
              </Pressable>
            )}
            <Display style={st.tittel} numberOfLines={1}>{tittel}</Display>
            <View style={{ flex: 1 }} />
            {hoyre}
          </View>
          <View style={st.strek} />
        </View>
      )}
      {rull ? (
        <ScrollView contentContainerStyle={[st.innhold, innholdStil]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, innholdStil]}>{children}</View>
      )}
      {bunn && <View style={[st.bunn, { paddingBottom: Math.max(inn.bottom, 12) }]}>{bunn}</View>}
    </View>
  );
}

// ---------- Byggeklosser ----------

export function Kort({ children, style, onPress, farge }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; farge?: string }) {
  const innhold = <View style={[st.kort, farge ? { backgroundColor: farge } : null, style]}>{children}</View>;
  if (!onPress) return innhold;
  return <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>{innhold}</Pressable>;
}

export function Knapp({
  tekst, undertekst, onPress, variant = "gul", ikon, pil, laster, deaktivert, style,
}: {
  tekst: string; undertekst?: string; onPress?: () => void; variant?: "gul" | "mork" | "hvit"; ikon?: IkonNavn; pil?: boolean;
  laster?: boolean; deaktivert?: boolean; style?: StyleProp<ViewStyle>;
}) {
  // Samme knapper som i dashboardet: gul med mørk kant (.knapp-gul), lys (som «Filtrer») og kort-farget.
  const farge = variant === "gul" ? F.blekk : variant === "mork" ? F.bg : F.tekst;
  const bg = variant === "gul" ? F.gul : variant === "mork" ? F.tekst : F.kort;
  const kant = variant === "gul" ? F.blekk : variant === "mork" ? F.tekst : F.kant;
  return (
    <Pressable onPress={onPress} disabled={deaktivert || laster} style={[{ opacity: deaktivert ? 0.5 : 1 }, style]}>
      {({ pressed }) => (
        <View>
          <View style={[st.knapp, { backgroundColor: bg, borderColor: kant, borderWidth: variant === "gul" ? 2.5 : 1 }, pressed && { opacity: 0.75 }, undertekst && { height: 64 }]}>
            {laster ? <ActivityIndicator color={farge} /> : ikon && <Ikon navn={ikon} size={22} farge={farge} />}
            <View style={{ flex: 1, alignItems: ikon || pil ? "flex-start" : "center" }}>
              <Txt style={[st.knappTekst, { color: farge }]}>{tekst}</Txt>
              {undertekst && <Txt style={{ color: farge, fontSize: 13, opacity: 0.85 }}>{undertekst}</Txt>}
            </View>
            {pil && <Ikon navn="pilHoyre" size={22} farge={farge} />}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function LenkeKnapp({ tekst, onPress, style }: { tekst: string; onPress: () => void; style?: StyleProp<TextStyle> }) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Txt style={[{ textDecorationLine: "underline", fontSize: 15, fontFamily: S.tekstMedium }, style]}>{tekst}</Txt>
    </Pressable>
  );
}

const CHIP: Record<string, { bg: string; farge: string; tekst?: string }> = {
  ok: { bg: F.gronnlys, farge: F.gronn },
  avvik: { bg: F.rodlys, farge: F.rod },
  ikke_talt: { bg: F.graa, farge: F.dempet, tekst: "ikke talt" },
  mottak: { bg: F.gronnlys, farge: F.gronn, tekst: "MOTTAK" },
  mottatt: { bg: F.gronnlys, farge: F.gronn, tekst: "MOTTATT" },
  restordre: { bg: F.gullys, farge: F.gul, tekst: "RESTORDRE" },
  plukk: { bg: F.graa, farge: F.dempet, tekst: "PLUKK" },
  mulig_svinn: { bg: F.rodlys, farge: F.rod, tekst: "MULIG SVINN" },
  svinn: { bg: F.rodlys, farge: F.rod, tekst: "SVINN" },
  funnet: { bg: F.gronnlys, farge: F.gronn, tekst: "FUNNET" },
  korrigering: { bg: F.graa, farge: F.dempet, tekst: "KORRIGERING" },
  aktiv: { bg: F.gronnlys, farge: F.gronn },
  offline: { bg: F.rodlys, farge: F.rod },
  hylle: { bg: F.graa, farge: F.tekst },
};

export function Chip({ status, tekst }: { status: string; tekst?: string }) {
  const c = CHIP[status] ?? CHIP.ikke_talt;
  return (
    <View style={[st.chip, { backgroundColor: c.bg }]}>
      <Mono style={{ color: c.farge, fontSize: 11 }}>{tekst ?? c.tekst ?? status}</Mono>
    </View>
  );
}

/** Hyllelappen: gul flis med hylle-ID. */
export function HylleFlis({ id, size = 56 }: { id: string; size?: number }) {
  return (
    <View style={[st.flis, { width: size, height: size }]}>
      <Display style={{ fontSize: size * 0.42 }}>{id}</Display>
    </View>
  );
}

export function Swatch({ farge, size = 44 }: { farge: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: 8, backgroundColor: farge, borderWidth: 1, borderColor: F.kant }} />;
}

export function Rad({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Seksjon({ tittel, hoyre, children }: { tittel: string; hoyre?: ReactNode; children?: ReactNode }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <Rad style={{ justifyContent: "space-between" }}>
        <Display style={{ fontSize: 19, letterSpacing: -0.3 }}>{tittel}</Display>
        {hoyre}
      </Rad>
      {children}
    </View>
  );
}

export function Feilboks({ melding, igjen }: { melding: string; igjen?: () => void }) {
  return (
    <Kort farge={F.rodlys} style={{ borderColor: F.rodkant, gap: 8 }}>
      <Txt style={{ fontFamily: S.tekstHalvfet, color: F.rod }}>Noe gikk galt</Txt>
      <Txt style={{ color: F.tekst }}>{melding}</Txt>
      {igjen && <LenkeKnapp tekst="Prøv igjen" onPress={igjen} />}
    </Kort>
  );
}

export function Laster() {
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <ActivityIndicator color={F.tekst} />
    </View>
  );
}

export const st = StyleSheet.create({
  tekst: { fontFamily: S.tekst, fontSize: 15, color: F.tekst },
  display: { fontFamily: S.display, color: F.tekst, letterSpacing: -0.8 },
  mono: { fontFamily: S.mono, color: F.tekst, fontSize: 12 },
  etikett: { fontFamily: S.mono, fontSize: 11, letterSpacing: 0.7, color: F.dempet },
  skjerm: { flex: 1, backgroundColor: F.bg },
  topp: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: F.bg },
  toppRad: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 44 },
  tilbake: { width: 32, height: 32, justifyContent: "center" },
  tittel: { fontSize: 26 },
  strek: { height: 1, backgroundColor: F.kant, marginTop: 10, marginHorizontal: -16 },
  innhold: { padding: 16, gap: 12, paddingBottom: 32 },
  bunn: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: F.bg, gap: 8 },
  kort: { backgroundColor: F.kort, borderWidth: 1, borderColor: F.kant, borderRadius: 14, padding: 16 },
  knapp: {
    height: 56, borderRadius: 14, borderWidth: 1, borderColor: F.kant, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12,
  },
  knappTekst: { fontFamily: S.tekstHalvfet, fontSize: 16 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  flis: { backgroundColor: F.gullys, borderWidth: 1, borderColor: F.gulkant, borderRadius: 6, alignItems: "center", justifyContent: "center" },
});
