/**
 * Voice & Audio Synthesis Utility for CasePilot.
 * Modeled after the "Grace" persona from ElevenLabs:
 * Warm, gentle, empathetic, soothing natural conversational female tone.
 *
 * Provides:
 * 1. ElevenLabs API integration (/api/tts) with Voice ID "oWAx60SgOHbt37ZaSlIh" (Grace)
 * 2. Natural local neural voice ranking and acoustic tuning matching Grace
 * 3. Humanized speech cleaning (acronym spelling, UTR spacing, currency, conversational transitions)
 */

export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Remove table summaries or checklists that are already visually represented
  text = text.replace(/Case Intake Checklist[\s\S]*$/i, "");
  text = text.replace(/^#+\s+/gm, "");

  // 2. Format UTR numbers (e.g. 381920194829 -> 3 8 1 9 2 0 1 9 4 8 2 9) so they are read digit-by-digit
  text = text.replace(/\b(\d{12})\b/g, (match) => match.split("").join(" "));

  // 3. Format currency (e.g. ₹35,000 -> 35,000 rupees)
  text = text.replace(/₹\s*([\d,]+)/g, "$1 rupees");

  // 4. Format UPI handles (e.g. fraud.node@axisbank -> fraud dot node at axis bank)
  text = text.replace(/([a-zA-Z0-9.\-_]+)@([a-zA-Z0-9.\-_]+)/g, "$1 at $2");

  // 5. Conversationalize statutory requirements with gentle pacing
  text = text.replace(/^\s*\d+\.\s*\*\*([^*]+)\*\*:\s*/gm, "Next, for $1, ");
  text = text.replace(/^\s*•\s*\*\*([^*]+)\*\*:\s*/gm, "Also, for $1, ");

  // 6. Clean markdown symbols
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/•/g, ". ");

  // 7. Spell out Indian cybersecurity & banking acronyms clearly
  text = text.replace(/\bFIR\b/g, "F I R");
  text = text.replace(/\bBNSS\b/g, "B N S S");
  text = text.replace(/\bNPCI\b/g, "N P C I");
  text = text.replace(/\bOTP\b/g, "O T P");
  text = text.replace(/\bAPK\b/g, "A P K");
  text = text.replace(/\bUPI\b/g, "U P I");
  text = text.replace(/\bUTR\b/g, "U T R");

  // 8. Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Detects whether the text is predominantly Hindi / Devanagari script, Hinglish, or English.
 */
export function detectLanguage(text: string): "hi-IN" | "en-IN" {
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi-IN";
  }

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

// Voice preference priority list specifically targeting the gentle, warm "Grace" persona
const GRACE_PERSONA_VOICES = [
  "grace",
  "jenny online (natural)",
  "jenny",
  "aria online (natural)",
  "aria",
  "neerja online (natural)",
  "neerja",
  "swara online (natural)",
  "swara",
  "google uk english female",
  "google us english",
  "google हिन्दी",
  "samantha",
  "victoria",
  "karen",
  "zira",
];

const MALE_DISQUALIFIERS = [
  "david", "mark", "george", "guy", "prabhat", "ravi", "stefan", "male", "microsoft david"
];

/**
 * Selects the highest-fidelity natural neural voice available matching the Grace persona.
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

  const candidates = matching.length > 0 ? matching : voices;

  // 1. Check for specific Grace or warm female neural voices
  for (const preferred of GRACE_PERSONA_VOICES) {
    const match = candidates.find((v) => {
      const name = v.name.toLowerCase();
      return name.includes(preferred) && !MALE_DISQUALIFIERS.some((d) => name.includes(d));
    });
    if (match) return match;
  }

  // 2. Look for any natural/neural female voice
  const anyNaturalFemale = candidates.find((v) => {
    const name = v.name.toLowerCase();
    const isNatural = name.includes("natural") || name.includes("neural") || name.includes("online");
    const isFemale = name.includes("female") || !MALE_DISQUALIFIERS.some((d) => name.includes(d));
    return isNatural && isFemale;
  });
  if (anyNaturalFemale) return anyNaturalFemale;

  // 3. Fallback to any non-male voice matching locale
  const nonMale = candidates.find((v) => {
    const name = v.name.toLowerCase();
    return !MALE_DISQUALIFIERS.some((d) => name.includes(d));
  });
  if (nonMale) return nonMale;

  return candidates[0] || null;
}

/**
 * Splits text into conversational sentence chunks for fluid playback with human-like breathing intervals.
 */
export function chunkSpeechSentences(text: string, maxLen = 170): string[] {
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
  private static activeAudio: HTMLAudioElement | null = null;
  private static currentUtteranceIndex = 0;
  private static activeChunks: string[] = [];
  private static onStopCallback: (() => void) | null = null;
  private static activeId: string | null = null;
  private static elevenLabsAvailable: boolean | null = null;

  public static getActiveId(): string | null {
    return this.activeId;
  }

  public static isPlaying(): boolean {
    return Boolean(this.activeId);
  }

  public static stop() {
    // 1. Stop HTML5 audio if streaming from ElevenLabs
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio = null;
    }

    // 2. Stop Web Speech Synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.activeChunks = [];
    const prevId = this.activeId;
    this.activeId = null;

    if (this.onStopCallback) {
      this.onStopCallback();
      this.onStopCallback = null;
    }
  }

  /**
   * Speaks text using the "Grace" persona.
   * Checks ElevenLabs API first (/api/tts); if unavailable or unconfigured,
   * uses local browser neural speech synthesis acoustically tuned for Grace.
   */
  public static async speak(
    text: string,
    options?: {
      id?: string;
      onStart?: () => void;
      onEnd?: () => void;
      locale?: string;
    }
  ): Promise<boolean> {
    if (typeof window === "undefined") return false;

    this.stop();

    const clean = cleanTextForSpeech(text);
    if (!clean) return false;

    this.activeId = options?.id || `speech-${Date.now()}`;
    this.onStopCallback = options?.onEnd || null;

    if (options?.onStart) options.onStart();

    // Try ElevenLabs backend if not previously marked unavailable
    if (this.elevenLabsAvailable !== false) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, voiceId: "oWAx60SgOHbt37ZaSlIh" }),
        });

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("audio")) {
          this.elevenLabsAvailable = true;
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.activeAudio = null;
            this.activeId = null;
            if (options?.onEnd) options.onEnd();
            this.onStopCallback = null;
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            this.activeAudio = null;
            // Fallback to local Grace synthesis on audio error
            this.speakWithBrowserGrace(clean, options);
          };

          await audio.play();
          return true;
        } else {
          // No API key configured or fallback signaled
          this.elevenLabsAvailable = false;
        }
      } catch {
        this.elevenLabsAvailable = false;
      }
    }

    // Seamless Grace persona local synthesis
    return this.speakWithBrowserGrace(clean, options);
  }

  /**
   * Browser Web Speech Synthesis tuned specifically to the Grace persona:
   * - Pitch: 1.05 (Warm, soft feminine pitch)
   * - Rate: 0.89 (Gentle, unhurried, reassuring cadence)
   */
  private static speakWithBrowserGrace(
    cleanedText: string,
    options?: {
      id?: string;
      onStart?: () => void;
      onEnd?: () => void;
      locale?: string;
    }
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.activeId = null;
      if (options?.onEnd) options.onEnd();
      return false;
    }

    const synth = window.speechSynthesis;
    const targetLocale = options?.locale || detectLanguage(cleanedText);
    const voices = synth.getVoices();
    const voice = findBestVoice(voices, targetLocale);

    const chunks = chunkSpeechSentences(cleanedText);
    if (chunks.length === 0) {
      this.activeId = null;
      if (options?.onEnd) options.onEnd();
      return false;
    }

    this.activeChunks = chunks;
    this.currentUtteranceIndex = 0;

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

      // Grace Persona Acoustic Modeling:
      // Rate: 0.89 gives Grace's signature calm, empathetic, unhurried rhythm
      // Pitch: 1.05 gives Grace's gentle, comforting, natural feminine pitch
      utterance.rate = 0.89;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      utterance.onend = () => {
        // Subtle micro-pause between sentences to emulate human breathing
        setTimeout(() => playNext(index + 1), 60);
      };

      utterance.onerror = (e) => {
        console.warn("[SpeechController:Grace] speech synthesis error:", e);
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
