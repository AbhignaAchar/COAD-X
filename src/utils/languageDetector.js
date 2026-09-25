/**
 * COAD-X Multilingual Language Configuration & Speech Interface
 * Supports English, Hindi (हिन्दी), and Kannada (ಕನ್ನಡ)
 */

export const LANGUAGE_CONFIG = {
  en: {
    name: "English",
    nativeLabel: "English",
    code: "en",
    speechRecognition: "en-IN",
    responseInstruction:
      "Answer the investigator's question entirely in English. Do not switch languages unless explicitly requested.",
    speechLanguage: "en-IN",
    speechLang: "en-IN"
  },

  hi: {
    name: "Hindi",
    nativeLabel: "हिन्दी",
    code: "hi",
    speechRecognition: "hi-IN",
    responseInstruction:
      "उत्तर पूरी तरह हिंदी में दें। देवनागरी लिपि का उपयोग करें। अंग्रेज़ी में उत्तर न दें, जब तक उपयोगकर्ता स्पष्ट रूप से अंग्रेज़ी में उत्तर देने के लिए न कहे।",
    speechLanguage: "hi-IN",
    speechLang: "hi-IN"
  },

  kn: {
    name: "Kannada",
    nativeLabel: "ಕನ್ನಡ",
    code: "kn",
    speechRecognition: "kn-IN",
    responseInstruction:
      "ತನಿಖಾಧಿಕಾರಿಯ ಪ್ರಶ್ನೆಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ಕನ್ನಡ ಲಿಪಿಯನ್ನು ಬಳಸಿ. ಬಳಕೆದಾರರು ಸ್ಪಷ್ಟವಾಗಿ ಇಂಗ್ಲಿಷ್ನಲ್ಲಿ ಉತ್ತರಿಸಲು ಕೇಳದ ಹೊರತು ಇಂಗ್ಲಿಷ್ಗೆ ಬದಲಾಯಿಸಬೇಡಿ.",
    speechLanguage: "kn-IN",
    speechLang: "kn-IN"
  }
};

// Backward-compatible alias
export const SUPPORTED_LANGUAGES = LANGUAGE_CONFIG;

/**
 * Automatically detects whether text contains Kannada, Devanagari (Hindi), or Latin (English)
 */
export function detectLanguageFromTranscript(text) {
  if (!text || typeof text !== 'string') {
    return LANGUAGE_CONFIG.en;
  }

  let kannadaChars = 0;
  let devanagariChars = 0;
  let latinChars = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Kannada Unicode Range: 0x0C80 - 0x0CFF
    if (code >= 0x0C80 && code <= 0x0CFF) {
      kannadaChars++;
    }
    // Devanagari Unicode Range (Hindi): 0x0900 - 0x097F
    else if (code >= 0x0900 && code <= 0x097F) {
      devanagariChars++;
    }
    // Latin characters
    else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinChars++;
    }
  }

  // Pure script determination
  if (kannadaChars > 0 && kannadaChars >= devanagariChars) {
    return LANGUAGE_CONFIG.kn;
  }
  if (devanagariChars > 0) {
    return LANGUAGE_CONFIG.hi;
  }

  // Secondary check for romanized transliteration keywords
  const lower = text.toLowerCase();
  const kannadaTerms = ['eshtu', 'yavudu', 'hege', 'yenu', 'sthithi', 'sakshya', 'thilisiri', 'tereyiri', 'madi', 'kannada', 'prakaranadalli'];
  const hindiTerms = ['kitni', 'kitne', 'kaunsi', 'kaise', 'kya', 'stithi', 'saboot', 'bataiye', 'kholo', 'dikhao', 'karein', 'hindi'];

  const hasKnTerm = kannadaTerms.some(term => lower.includes(term));
  const hasHiTerm = hindiTerms.some(term => lower.includes(term));

  if (hasKnTerm && !hasHiTerm) {
    return LANGUAGE_CONFIG.kn;
  }
  if (hasHiTerm && !hasKnTerm) {
    return LANGUAGE_CONFIG.hi;
  }

  // Default to English
  return LANGUAGE_CONFIG.en;
}

/**
 * Validates that an AI response is primarily in the expected script / language
 * Allows technical identifiers: COAD-X, SHA-256, EV-00231, F18, percentages, hashes
 */
export function validateResponseLanguage(text, targetLangCode) {
  if (!text || typeof text !== 'string') return true;

  // Strip technical terms, hashes, numbers, markdown, punctuation
  const stripped = text
    .replace(/COAD-X|SHA-256|SHA256|MD5|JPEG|PNG|WEBP|PDF|DOCX|DOC|TXT|CSV|JSON|XML|LOG|HEX|DoD|Gutmann|NIST/gi, '')
    .replace(/[0-9A-Fa-f]{16,64}/g, '')
    .replace(/[0-9%#*`_~()[\]{}:;.,\-+/\\|<>="'`]/g, '')
    .trim();

  if (stripped.length < 8) return true; // too short to judge reliably

  let devanagariCount = 0;
  let kannadaCount = 0;
  let latinCount = 0;

  for (let i = 0; i < stripped.length; i++) {
    const code = stripped.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097F) {
      devanagariCount++;
    } else if (code >= 0x0C80 && code <= 0x0CFF) {
      kannadaCount++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinCount++;
    }
  }

  if (targetLangCode === 'hi') {
    // Should have substantial Devanagari characters
    return devanagariCount >= 8 || devanagariCount > latinCount * 0.3;
  }

  if (targetLangCode === 'kn') {
    // Should have substantial Kannada characters
    return kannadaCount >= 8 || kannadaCount > latinCount * 0.3;
  }

  if (targetLangCode === 'en') {
    // Should be primarily Latin
    return latinCount >= devanagariCount && latinCount >= kannadaCount;
  }

  return true;
}

/**
 * Text-to-Speech synthesis adhering strictly to the selected language
 */
export function speakResponse(text, langCode, onStart, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    // Clean markdown formatting, symbols, links for speech synthesis
    const speechCleaned = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(speechCleaned);
    const voices = window.speechSynthesis.getVoices() || [];

    const cfg = LANGUAGE_CONFIG[langCode] || LANGUAGE_CONFIG.en;
    const targetLang = cfg.speechLanguage || 'en-IN';

    utterance.lang = targetLang;

    // Look for matching voice
    const voice = voices.find(v => v.lang === targetLang) ||
                  voices.find(v => v.lang.toLowerCase().startsWith(langCode));

    if (voice) {
      utterance.voice = voice;
    } else {
      console.log(`[COAD-X Voice] Regional voice for ${targetLang} not installed on OS, falling back.`);
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      console.log(`[COAD-X Voice] Audio playback started (${targetLang})`);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}
