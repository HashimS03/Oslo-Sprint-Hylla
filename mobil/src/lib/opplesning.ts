import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";

// Felles opplesning for Spør Hylla og telleskjermen.
// Spilleren ligger utenfor skjermene, så lyden fortsetter når appen bytter skjerm etter lagring.

let spiller: AudioPlayer | null = null;

/** Stopper det som leses opp nå. */
export function stoppOpplesning() {
  Speech.stop();
  spiller?.remove();
  spiller = null;
}

/** Spiller ElevenLabs-lyden hvis vi fikk den (mp3 som data-URL), ellers leser telefonen opp selv. */
export function lesHoyt(tekst: string, lyd?: string) {
  stoppOpplesning();
  // Spill av selv om telefonen står på lydløs, som i Spør Hylla.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  if (lyd?.startsWith("data:") && Platform.OS === "web") {
    spiller = createAudioPlayer(lyd);
    spiller.play();
    return;
  }
  if (lyd?.startsWith("data:")) {
    try {
      const fil = new File(Paths.cache, `hylla-${Date.now()}.mp3`);
      fil.writeSync(lyd.slice(lyd.indexOf(",") + 1), { encoding: "base64" });
      spiller = createAudioPlayer(fil.uri);
      spiller.play();
      return;
    } catch {
      /* faller tilbake til telefonens stemme */
    }
  }
  Speech.speak(tekst, { language: "nb-NO" });
}
