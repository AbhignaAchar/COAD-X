import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Securely read GEMINI_API_KEY from .env or src/.env in server environment
function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'src', '.env')
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY\s*=\s*(.+)/);
        if (match && match[1].trim()) {
          const key = match[1].trim();
          process.env.GEMINI_API_KEY = key; // populate process.env
          return key;
        }
      } catch (err) {
        console.warn('[COAD-X] Error reading .env file:', err.message);
      }
    }
  }
  return null;
}

const GEMINI_SYSTEM_INSTRUCTION = `You are the official COAD-X Cyber Forensic Intelligence Assistant.
You assist investigators and analysts in understanding digital evidence recovery, byte scanning, and fragmented file reconstruction.
Answer the user's current question using the live COAD-X context supplied with the request.
Never invent evidence, files, classifications, integrity results, reconstruction results, statistics, or investigation findings.
Clearly distinguish between:
- RECOVERED (confirmed physical bytes and verified hashes)
- INFERRED (algorithmic reassembly and sector alignment)
- PREDICTED (type heuristics and classification signatures)
- UNKNOWN / MISSING (missing blocks, gaps, unverified headers)
If the requested information is not present in the supplied live context, explicitly say that it is unavailable.
Support English, Hindi, and Kannada.
Always answer in the same language as the user's current question unless the user explicitly requests another language:
- If responseLanguage is 'en', answer in clear, professional English.
- If responseLanguage is 'hi', answer in natural Hindi using Devanagari script.
- If responseLanguage is 'kn', answer in natural Kannada using Kannada script.
Do not automatically translate Hindi or Kannada questions into English.
Technical forensic terminology (such as SHA-256, Magic Bytes, Hex, DoD 5220.22-M) may remain in English where appropriate for clarity.
Keep voice responses concise, conversational, and direct for audio playback.`;

const LANGUAGE_CONFIG = {
  en: {
    name: "English",
    code: "en",
    speechRecognition: "en-IN",
    responseInstruction:
      "Answer the investigator's question entirely in English. Do not switch languages unless explicitly requested.",
    speechLanguage: "en-IN"
  },
  hi: {
    name: "Hindi",
    code: "hi",
    speechRecognition: "hi-IN",
    responseInstruction:
      "उत्तर पूरी तरह हिंदी में दें। देवनागरी लिपि का उपयोग करें। अंग्रेज़ी में उत्तर न दें, जब तक उपयोगकर्ता स्पष्ट रूप से अंग्रेज़ी में उत्तर देने के लिए न कहे।",
    speechLanguage: "hi-IN"
  },
  kn: {
    name: "Kannada",
    code: "kn",
    speechRecognition: "kn-IN",
    responseInstruction:
      "ತನಿಖಾಧಿಕಾರಿಯ ಪ್ರಶ್ನೆಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ಕನ್ನಡ ಲಿಪಿಯನ್ನು ಬಳಸಿ. ಬಳಕೆದಾರರು ಸ್ಪಷ್ಟವಾಗಿ ಇಂಗ್ಲಿಷ್ನಲ್ಲಿ ಉತ್ತರಿಸಲು ಕೇಳದ ಹೊರತು ಇಂಗ್ಲಿಷ್ಗೆ ಬದಲಾಯಿಸಬೇಡಿ.",
    speechLanguage: "kn-IN"
  }
};

function validateResponseLanguage(text, targetLangCode) {
  if (!text || typeof text !== 'string') return true;
  const stripped = text
    .replace(/COAD-X|SHA-256|SHA256|MD5|JPEG|PNG|WEBP|PDF|DOCX|DOC|TXT|CSV|JSON|XML|LOG|HEX|DoD|Gutmann|NIST/gi, '')
    .replace(/[0-9A-Fa-f]{16,64}/g, '')
    .replace(/[0-9%#*`_~()[\]{}:;.,\-+/\\|<>="'`]/g, '')
    .trim();

  if (stripped.length < 8) return true;

  let devanagariCount = 0;
  let kannadaCount = 0;
  let latinCount = 0;

  for (let i = 0; i < stripped.length; i++) {
    const code = stripped.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097F) devanagariCount++;
    else if (code >= 0x0C80 && code <= 0x0CFF) kannadaCount++;
    else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) latinCount++;
  }

  if (targetLangCode === 'hi') {
    return devanagariCount >= 8 || devanagariCount > latinCount * 0.3;
  }
  if (targetLangCode === 'kn') {
    return kannadaCount >= 8 || kannadaCount > latinCount * 0.3;
  }
  if (targetLangCode === 'en') {
    return latinCount >= devanagariCount && latinCount >= kannadaCount;
  }
  return true;
}

function copilotApiPlugin() {
  return {
    name: 'coadx-copilot-api',
    configureServer(server) {
      // 1. Health Check Endpoint: GET /api/gemini/health
      server.middlewares.use('/api/gemini/health', (req, res) => {
        if (req.method === 'GET') {
          const apiKey = getGeminiApiKey();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            configured: Boolean(apiKey),
            provider: 'gemini',
            model: 'gemini-3.8-flash',
            status: 'operational',
            supportedLanguages: ['English', 'हिन्दी', 'ಕನ್ನಡ']
          }));
          return;
        }
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // 2. Copilot / Voice Agent Query Endpoint: POST /api/copilot
      server.middlewares.use('/api/copilot', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let rawBody = '';
        req.on('data', chunk => { rawBody += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(rawBody || '{}');
            const { message, detectedLanguage, responseLanguage, language, forensicContext, history } = payload;
            const selectedLanguage = responseLanguage || language || detectedLanguage || 'en';
            const langCfg = LANGUAGE_CONFIG[selectedLanguage] || LANGUAGE_CONFIG.en;

            const apiKey = getGeminiApiKey();

            if (apiKey) {
              console.log(`[COAD-X Voice] Sending request to Gemini with active session context. Selected Language: ${langCfg.name} (${selectedLanguage})`);

              const dynamicSystemInstruction = `${GEMINI_SYSTEM_INSTRUCTION}

MANDATORY RESPONSE LANGUAGE REQUIREMENT:
The investigator has explicitly selected response language: ${langCfg.name} (${selectedLanguage}).
Directive: ${langCfg.responseInstruction}
You MUST formulate your complete answer strictly in ${langCfg.name}.
${selectedLanguage === 'hi' ? 'DO NOT respond in English. Use Devanagari script.' : ''}
${selectedLanguage === 'kn' ? 'DO NOT respond in English. Use Kannada script.' : ''}`;

              const promptContent = `CRITICAL DIRECTIVE: ${langCfg.responseInstruction}

Live COAD-X Investigation Context:
${JSON.stringify(forensicContext || {}, null, 2)}

Investigator Question:
${message}

Remember: You MUST answer entirely in ${langCfg.name}.`;

              const modelsToTry = [
                'gemini-3.8-flash',
                'gemini-3.1-flash-lite',
                'gemini-flash-latest',
                'gemini-3.1-flash-lite-preview',
                'gemini-3.6-flash',
                'gemini-3-flash-preview'
              ];

              for (const model of modelsToTry) {
                try {
                  const callGemini = async (userPromptText) => {
                    const geminiRes = await fetch(
                      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          system_instruction: {
                            parts: [{ text: dynamicSystemInstruction }]
                          },
                          contents: [
                            ...(history || []).slice(-6).map(h => ({
                              role: h.role === 'assistant' ? 'model' : 'user',
                              parts: [{ text: h.content || h.text || '' }]
                            })),
                            {
                              role: 'user',
                              parts: [{ text: userPromptText }]
                            }
                          ],
                          generationConfig: {
                            temperature: 0.15,
                            maxOutputTokens: 600
                          }
                        })
                      }
                    );
                    if (!geminiRes.ok) return null;
                    const geminiData = await geminiRes.json();
                    const parts = geminiData?.candidates?.[0]?.content?.parts || [];
                    const textPart = parts.find(p => p.text && !p.thought) || parts[parts.length - 1];
                    return textPart?.text || null;
                  };

                  let text = await callGemini(promptContent);

                  if (text && text.trim()) {
                    // Response validation safeguard
                    const isCorrectLang = validateResponseLanguage(text, selectedLanguage);
                    if (!isCorrectLang) {
                      console.warn(`[COAD-X Voice] Warning: Gemini response was not in expected language (${selectedLanguage}). Triggering 1-time retry...`);
                      const retryPrompt = `IMPORTANT: Your previous response was not in ${langCfg.name}. Rewrite the complete response entirely in ${langCfg.name} ${selectedLanguage === 'hi' ? 'using Devanagari script' : selectedLanguage === 'kn' ? 'using Kannada script' : ''}. Preserve all numerical values, evidence IDs, hashes, and technical identifiers.\n\nOriginal Question: ${message}`;
                      const retryText = await callGemini(retryPrompt);
                      if (retryText && retryText.trim() && validateResponseLanguage(retryText, selectedLanguage)) {
                        text = retryText;
                      }
                    }

                    console.log(`[COAD-X Voice] Gemini response received successfully from ${model} in ${selectedLanguage}`);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      answer: text.trim(),
                      source: 'gemini',
                      model,
                      language: selectedLanguage
                    }));
                    return;
                  }
                } catch (geminiError) {
                  console.warn(`[COAD-X Voice] Error calling ${model}:`, geminiError.message);
                }
              }
            }

            // High-precision server forensic engine fallback if Gemini offline or key absent
            console.log(`[COAD-X Voice] Invoking server forensic engine fallback in ${selectedLanguage}`);
            const { generateForensicAnswer } = await import('./src/utils/aiCopilot.js');
            const fallbackAnswer = generateForensicAnswer(message, selectedLanguage, forensicContext, history);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              answer: fallbackAnswer,
              source: 'forensic-engine',
              language: selectedLanguage
            }));
          } catch (err) {
            console.error('[COAD-X Voice] Backend processing error:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },

    configurePreviewServer(server) {
      server.middlewares.use('/api/gemini/health', (req, res) => {
        const apiKey = getGeminiApiKey();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ configured: Boolean(apiKey), provider: 'gemini' }));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), copilotApiPlugin()],
  server: {
    port: 3000,
    open: false
  }
});
