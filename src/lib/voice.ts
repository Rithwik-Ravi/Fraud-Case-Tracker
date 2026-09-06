/**
 * Voice & Audio Synthesis Utility for CasePilot.
 * Provides natural text cleaning, multilingual Indian language heuristics,
 * natural neural voice ranking, and browser speech synthesis.
 */

export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Remove checklist / table references that sound awkward aloud
  text = text.replace(/Case Intake Checklist[\s\S]*$/i, "");
  text = text.replace(/•\s*\*\*([^*]+)\*\*:\s*/g, "$1: ");
  text = text.replace(/\d+\.\s*\*\*([^*]+)\*\*:\s*/g, "$1: ");

  // 2. Format UTR numbers (e.g. 381920194829 -> 3 8 1 9 2 0 1 9 4 8 2 9) so they are read digit by digit
  text = text.replace(/\b(\d{12})\b/g, (match) => match.split("").join(" "));

  // 3. Format currency (e.g. ₹35,000 -> 35,000 rupees)
  text = text.replace(/₹\s*([\d,]+)/g, "$1 rupees");

  // 4. Format UPI handles (e.g. fraud.node@axisbank -> fraud dot node at axis bank)
  text = text.replace(/([a-zA-Z0-9.\-_]+)@([a-zA-Z0-9.\-_]+)/g, "$1 at $2");

  // 5. Remove markdown syntax
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/•/g, ". ");

  // 6. Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Detects whether the text is predominantly Hindi / Devanagari script, Hinglish, or English.
 */
export function detectLanguage(text: string): "hi-IN" | "en-IN" {
  // Check for Devanagari Unicode range
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi-IN";
  }

  // Check for common Hindi / Hinglish phonetics
  const lower = text.toLowerCase();
  const hindiWords = [
    "kisi", "vyakti", "call", "kiya", "paisa", "rupaye", "chura", "liya", "mera", "meri",
    "karo", "kijiye", "bheja", "aaya", "otp", "dhokha", "shikayat", "aaj", "kal", "hai", "hain"
  ];
  let hindiHits = 0;
  for (const w of hindiWords) {
    if (new RegExp(`\\b${w}\\b`).test(lower)) hindiHits++;
  }

  if (hindiHits >= 2) {
    return "hi-IN";
  }

  return "en-IN";
}

/**
 * Selects the highest-fidelity natural neural voice available on the citizen's device.
 */
export function findBestVoice(
  voices: SpeechSynthesisVoice[],
  targetLocale: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const langCode = targetLocale.toLowerCase().split("-")[0]; // e.g. "hi" or "en"
  const fullLocale = targetLocale.toLowerCase().replace("_", "-");

  // Filter voices matching the language
  const matching = voices.filter((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang === fullLocale || vLang.startsWith(langCode);
  });

  if (matching.length === 0) {
    // Fallback to any Indian English or default voice
    return voices.find((v) => v.lang.includes("IN") || v.lang.startsWith("en")) || voices[0] || null;
  }

  // Rank matching voices: prioritize Natural / Neural / Online female and warm voices
  const neuralVoice = matching.find((v) => {
    const name = v.name.toLowerCase();
    return (
      (name.includes("natural") || name.includes("neural") || name.includes("online")) &&
      (name.includes("neerja") || name.includes("swara") || name.includes("prabhat") || name.includes("google"))
    );
  });
  if (neuralVoice) return neuralVoice;

  const anyNatural = matching.find((v) => {
    const name = v.name.toLowerCase();
    return name.includes("natural") || name.includes("neural") || name.includes("google");
  });
  if (anyNatural) return anyNatural;

  // Indian accent voice
  const indianAccent = matching.find((v) => v.lang.toLowerCase().includes("in"));
  if (indianAccent) return indianAccent;

  return matching[0];
}

/**
 * Splits text into conversational sentence chunks for fluid playback without browser limits.
 */
export function chunkSpeechSentences(text: string, maxLen = 160): string[] {
  const clean = cleanTextForSpeech(text);
  if (!clean) return [];

  const sentences = clean.match(/[^.!?।\n]+[.!?।\n]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let cur = "";

  for (const s of sentences) {
    if (cur && cur.length + s.length > maxLen) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

export class SpeechController {
  private static currentUtteranceIndex = 0;
  private static activeChunks: string[] = [];
  private static onStopCallback: (() => void) | null = null;
  private static activeId: string | null = null;

  public static getActiveId(): string | null {
    return this.activeId;
  }

  public static stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.activeChunks = [];
    this.activeId = null;
    if (this.onStopCallback) {
      this.onStopCallback();
      this.onStopCallback = null;
    }
  }

  public static speak(
    text: string,
    options?: {
      id?: string;
      onStart?: () => void;
      onEnd?: () => void;
      locale?: string;
    }
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    const synth = window.speechSynthesis;
    this.stop();

    const targetLocale = options?.locale || detectLanguage(text);
    const voices = synth.getVoices();
    const voice = findBestVoice(voices, targetLocale);

    const chunks = chunkSpeechSentences(text);
    if (chunks.length === 0) return false;

    this.activeChunks = chunks;
    this.activeId = options?.id || null;
    this.currentUtteranceIndex = 0;
    this.onStopCallback = options?.onEnd || null;

    if (options?.onStart) options.onStart();

    const playNext = (index: number) => {
      if (index >= chunks.length) {
        this.activeId = null;
        if (options?.onEnd) options.onEnd();
        this.onStopCallback = null;
        return;
      }

      const chunk = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = targetLocale;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.93; // Calm, reassuring pace for victims
      utterance.pitch = 1.0;

      utterance.onend = () => {
        playNext(index + 1);
      };

      utterance.onerror = (e) => {
        console.warn("[SpeechController] playback error:", e);
        this.activeId = null;
        if (options?.onEnd) options.onEnd();
        this.onStopCallback = null;
      };

      synth.speak(utterance);
    };

    playNext(0);
    return true;
  }
}
