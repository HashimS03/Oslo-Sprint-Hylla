// Opplesning i nettleseren. Brukes av Spør Hylla og etter en lagret telling.

function norskStemme(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("nb") || v.lang.startsWith("no"));
}

/** Leser teksten høyt med nettleserens egen tale. */
export function les(tekst: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(tekst);
  u.lang = "nb-NO";
  const stemme = norskStemme();
  if (stemme) u.voice = stemme;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/**
 * Lar oss spille lyd etter et nettverkskall. Mobilnettlesere (særlig Safari) tillater bare lyd
 * som starter i et trykk, så dette må kalles direkte i klikk-handleren, før `await`.
 */
export function klargjorLyd(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  }
  const lyd = new Audio();
  // En kort, stille lyd «låser opp» elementet mens vi fortsatt er i trykket.
  lyd.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  lyd.play().catch(() => undefined);
  return lyd;
}

/** Spiller ElevenLabs-lyd hvis vi har den, ellers leser nettleseren teksten. */
export function siHoyt(tekst: string, mp3?: string, lyd?: HTMLAudioElement | null) {
  if (mp3 && lyd) {
    lyd.src = mp3;
    lyd.play().catch(() => les(tekst));
    return;
  }
  les(tekst);
}
