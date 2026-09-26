import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Compass,
  Send
} from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import {
  LANGUAGE_CONFIG,
  SUPPORTED_LANGUAGES,
  detectLanguageFromTranscript,
  speakResponse
} from '../utils/languageDetector';
import {
  buildLiveForensicContext,
  queryCopilotAPI,
  detectNavigationIntent
} from '../utils/aiCopilot';

export default function VoiceAgentModal({ isOpen, onClose, setCurrentPage }) {
  const { caseId, evidenceFiles, fragments, reconstructedFiles, tamperSummary } = useForensic();

  // ONE Source of Truth for Response Language: 'en' | 'hi' | 'kn'
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Voice Interaction States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedSpeechLang, setDetectedSpeechLang] = useState(LANGUAGE_CONFIG.en);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioFeedbackMsg, setAudioFeedbackMsg] = useState('');
  const [manualInput, setManualInput] = useState('');

  const currentConfig = LANGUAGE_CONFIG[selectedLanguage] || LANGUAGE_CONFIG.en;

  // Initial welcome message per language
  const getWelcomeMessage = (langCode) => {
    switch (langCode) {
      case 'hi':
        return 'COAD-X बहुभाषी फ़ोरेंसिक वॉयस एजेंट तैयार है। आप हिंदी में प्रश्न पूछ सकते हैं।';
      case 'kn':
        return 'COAD-X ಬಹುಭಾಷಾ ವಿಧಿವಿಜ್ಞಾನ ವಾಯ್ಸ್ ಏಜೆಂಟ್ ಸಿದ್ಧವಾಗಿದೆ. ನೀವು ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು.';
      default:
        return 'COAD-X Multilingual Forensic Voice Agent ready. Speak or type your forensic question.';
    }
  };

  // Conversation history in this modal session
  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      text: getWelcomeMessage('en'),
      lang: 'en',
      langLabel: 'English',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef(null);
  const chatScrollRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Quick Multilingual Test Prompts dynamically rendered according to selected language
  const getPresetQueries = (langCode) => {
    switch (langCode) {
      case 'hi':
        return [
          { label: 'साक्ष्य गणना', text: 'इस केस में कितने सबूत हैं?' },
          { label: 'साक्ष्य स्थिति', text: 'कितनी एविडेंस फाइलें वर्तमान में अपलोड की गई हैं?' },
          { label: 'रिकंस्ट्रक्शन परिणाम', text: 'मेरी रिकंस्ट्रक्शन का परिणाम क्या है?' },
          { label: 'इंटीग्रिटी सत्यापन', text: 'क्रिप्टोग्राफ़िक इंटीग्रिटी की क्या स्थिति है?' },
          { label: 'टैम्पर विश्लेषण', text: 'क्या किसी साक्ष्य में छेड़छाड़ या डेटा वाइपिंग पाई गई है?' }
        ];
      case 'kn':
        return [
          { label: 'ಸಾಕ್ಷ್ಯಗಳ ಸಂಖ್ಯೆ', text: 'ಈ ಪ್ರಕರಣದಲ್ಲಿ ಎಷ್ಟು ಸಾಕ್ಷ್ಯಗಳಿವೆ?' },
          { label: 'ಮರುನಿರ್ಮಾಣ ಸ್ಥಿತಿ', text: 'ನನ್ನ ರೀಕನ್ಸ್ಟ್ರಕ್ಷನ್ ಫಲಿತಾಂಶ ಏನು?' },
          { label: 'ಸಾಕ್ಷ್ಯ ಸ್ಥಿತಿ', text: 'ಪ್ರಸ್ತುತ ಎಷ್ಟು ಎವಿಡೆನ್ಸ್ ಫೈಲ್ಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ?' },
          { label: 'ಸಮಗ್ರತೆ ಪರಿಶೀಲನೆ', text: 'ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಇಂಟೆಗ್ರಿಟಿ ಸ್ಥಿತಿ ಏನು?' },
          { label: 'ಟ್ಯಾಂಪರ್ ತನಿಖೆ', text: 'ಯಾವುದಾದರೂ ಸಾಕ್ಷ್ಯದಲ್ಲಿ ವೈಪಿಂಗ್ ಅಥವಾ ತಿರುಚುವಿಕೆ ಇದೆಯೇ?' }
        ];
      default:
        return [
          { label: 'Evidence Count', text: 'What is the evidence count?' },
          { label: 'Reconstruction Result', text: 'How many fragments were detected in the reconstruction?' },
          { label: 'Evidence Status', text: 'How many evidence files are currently uploaded?' },
          { label: 'Integrity Status', text: 'What is the cryptographic SHA-256 integrity verification status?' },
          { label: 'Tamper Findings', text: 'Are there signs of deliberate tampering or data wiping?' }
        ];
    }
  };

  // Switch Selected Language immediately across complete pipeline
  const handleLanguageChange = (newLangCode) => {
    if (!LANGUAGE_CONFIG[newLangCode]) return;
    setSelectedLanguage(newLangCode);
    setAudioFeedbackMsg('');
    setSpeechError('');

    // Update speech recognition dialect
    if (recognitionRef.current) {
      const wasListening = isListening;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current.lang = LANGUAGE_CONFIG[newLangCode].speechRecognition;
      if (wasListening) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }, 150);
      }
    }

    // Stop active speech if speaking
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Auto-scroll conversation
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation, transcript, isProcessing]);

  // Clean up on modal open / close
  useEffect(() => {
    if (isOpen) {
      setSpeechError('');
      setAudioFeedbackMsg('');
      initSpeechRecognition();
    } else {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [isOpen]);

  /**
   * Initializes Web Speech API Recognition adhering to selectedLanguage
   */
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech Recognition API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = (LANGUAGE_CONFIG[selectedLanguage] || LANGUAGE_CONFIG.en).speechRecognition;

      recognition.onstart = () => {
        console.log('[COAD-X Voice] Microphone started in', recognition.lang);
        setIsListening(true);
        setSpeechError('');
        setAudioFeedbackMsg('');
      };

      recognition.onresult = (event) => {
        let accumulatedFinal = '';
        let interim = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulatedFinal += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        const fullSpoken = (accumulatedFinal + interim).trim();

        if (fullSpoken) {
          // Actively type speech into BOTH manual input and transcript!
          setTranscript(fullSpoken);
          setManualInput(fullSpoken);

          const detected = detectLanguageFromTranscript(fullSpoken);
          setDetectedSpeechLang(detected);

          // Reset silence timer on every new speech token
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Auto-submit after 1.8 seconds of silence when a complete sentence is spoken
          const hasFinal = Array.from(event.results).some(r => r.isFinal);
          if (hasFinal && (accumulatedFinal.trim().length > 3 || fullSpoken.length > 5)) {
            silenceTimerRef.current = setTimeout(() => {
              const query = (accumulatedFinal || fullSpoken).trim();
              if (query) {
                stopListening();
                handleProcessQuery(query, selectedLanguage);
              }
            }, 1800);
          }
        }
      };

      recognition.onerror = (event) => {
        // 'no-speech' is non-fatal in continuous mode
        if (event.error === 'no-speech') {
          return;
        }

        setIsListening(false);
        switch (event.error) {
          case 'not-allowed':
            setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
            break;
          case 'audio-capture':
            setSpeechError('No audio capture device found.');
            break;
          case 'network':
            setSpeechError('Speech recognition network error. You can type directly or click quick questions.');
            break;
          case 'language-not-supported':
            setSpeechError(`Speech recognition for ${currentConfig.name} is not supported on this device.`);
            break;
          default:
            setSpeechError(`Speech recognition status: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setSpeechError('Failed to initialize microphone interface.');
    }
  };

  /**
   * Toggle Microphone Listening
   */
  const handleToggleMic = () => {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      const currentQuery = (manualInput || transcript || '').trim();
      if (currentQuery) {
        handleProcessQuery(currentQuery, selectedLanguage);
      }
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setSpeechError('');
    setTranscript('');
    setAudioFeedbackMsg('');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = (LANGUAGE_CONFIG[selectedLanguage] || LANGUAGE_CONFIG.en).speechRecognition;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        initSpeechRecognition();
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
              setIsListening(true);
            }
          } catch (inner) {
            console.warn('Recognition start error:', inner);
          }
        }, 150);
      }
    } else {
      initSpeechRecognition();
      setTimeout(() => {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        } catch (inner) {
          console.warn('Recognition start error:', inner);
        }
      }, 150);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  /**
   * Main Pipeline Execution
   * USER QUESTION -> SELECTED LANGUAGE INSTRUCTION -> GEMINI / LIVE FORENSIC CONTEXT -> NATIVE RESPONSE -> TTS
   */
  const handleProcessQuery = async (queryText, forceLang = null) => {
    if (!queryText || !queryText.trim()) return;

    stopListening();
    setIsProcessing(true);

    const targetLangCode = forceLang || selectedLanguage || 'en';
    const targetConfig = LANGUAGE_CONFIG[targetLangCode] || LANGUAGE_CONFIG.en;

    // Record user message in chat
    const userMsg = {
      role: 'user',
      text: queryText,
      lang: targetLangCode,
      langLabel: targetConfig.nativeLabel,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversation(prev => [...prev, userMsg]);
    setTranscript('');
    setManualInput('');

    // Compile 100% Live Forensic Context from active state
    const liveContext = buildLiveForensicContext(
      evidenceFiles,
      fragments,
      reconstructedFiles,
      tamperSummary,
      caseId,
      'voice-agent'
    );

    // Check for navigation commands
    const navTarget = detectNavigationIntent(queryText);
    if (navTarget && typeof setCurrentPage === 'function') {
      setCurrentPage(navTarget);
    }

    try {
      console.log(`[COAD-X Voice] Processing query in ${targetConfig.name} (${targetLangCode})`);

      // Query Copilot / Gemini backend with explicit selected response language
      const result = await queryCopilotAPI({
        message: queryText,
        detectedLanguage: targetLangCode,
        languageName: targetConfig.name,
        responseLanguage: targetLangCode,
        language: targetLangCode,
        forensicContext: liveContext,
        history: conversation.slice(-6).map(c => ({
          role: c.role,
          content: c.text
        }))
      });

      const responseText = result.answer;

      const assistantMsg = {
        role: 'assistant',
        text: responseText,
        lang: targetLangCode,
        langLabel: targetConfig.nativeLabel,
        source: result.source,
        model: result.model,
        navigatedTo: navTarget || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversation(prev => [...prev, assistantMsg]);
      setIsProcessing(false);

      // Speak response using browser speech synthesis strictly matching selected language
      const played = speakResponse(
        responseText,
        targetLangCode,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );

      if (!played && targetLangCode === 'kn') {
        setAudioFeedbackMsg('Kannada TTS voice is not installed on this system. Response displayed in Kannada text.');
      } else if (!played && targetLangCode === 'hi') {
        setAudioFeedbackMsg('Hindi TTS voice is not installed on this system. Response displayed in Hindi text.');
      }
    } catch (err) {
      console.error('Voice Agent query execution error:', err);
      setIsProcessing(false);
      const errorMsg = {
        role: 'assistant',
        text: targetLangCode === 'hi'
          ? 'सेवा वर्तमान में अनुपलब्ध है। कृपया पुनः प्रयास करें।'
          : targetLangCode === 'kn'
          ? 'ಸೇವೆ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Gemini service is temporarily unavailable. Please try again.',
        lang: targetLangCode,
        langLabel: targetConfig.nativeLabel,
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConversation(prev => [...prev, errorMsg]);
    }
  };

  /**
   * Handle Preset Click - Always executes in CURRENT selectedLanguage
   */
  const handlePresetSelect = (preset) => {
    setSpeechError('');
    setManualInput(preset.text);
    handleProcessQuery(preset.text, selectedLanguage);
  };

  /**
   * Handle Manual Text Question Submission
   */
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!manualInput.trim() || isProcessing) return;
    handleProcessQuery(manualInput.trim(), selectedLanguage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.1)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F6FA] border border-[#BAE6FD] flex items-center justify-center text-[#0F8FB3]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] leading-none">
                COAD-X Gemini 3.8 Flash Multilingual Voice Agent
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Speech-to-Text & Live Forensic Intelligence ({currentConfig.name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Language Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F6FA] text-[#0F8FB3] border border-[#BAE6FD]">
              <Globe className="w-3 h-3" />
              <span>{currentConfig.nativeLabel}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Conversation Stream Area */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#F8FAFC]"
        >
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#0F2747] text-[#0F8FB3] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#E6F6FA] border border-[#BAE6FD] text-[#0F2747] rounded-tr-sm'
                    : 'bg-white border border-[#E2E8F0] text-slate-800 rounded-tl-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500">
                    {msg.role === 'user' ? 'Investigator' : 'COAD-X Intelligence'}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {msg.langLabel || 'English'}
                    </span>
                    <span>{msg.time}</span>
                  </div>
                </div>

                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                {msg.navigatedTo && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#0F8FB3] font-semibold">
                    <Compass className="w-3 h-3" />
                    <span>Navigated to: {msg.navigatedTo}</span>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#0F8FB3] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Real-time Streaming Transcript */}
          {transcript && (
            <div className="flex gap-2.5 justify-end animate-fadeIn">
              <div className="max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed bg-[#E6F6FA]/90 border border-dashed border-[#0F8FB3] text-[#0F2747] shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1 text-[10px] text-[#0F8FB3]">
                  <span className="font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> Live Speech Typing
                  </span>
                  <span className="font-semibold">{detectedSpeechLang.nativeLabel}</span>
                </div>
                <p className="font-medium text-slate-800">{transcript}</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#0F8FB3] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex gap-2.5 justify-start animate-fadeIn">
              <div className="w-7 h-7 rounded-lg bg-[#0F2747] text-[#0F8FB3] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#E2E8F0] p-3 rounded-2xl text-xs flex items-center gap-2 text-slate-600 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 text-[#0F8FB3] animate-spin" />
                <span>Formulating response in {currentConfig.nativeLabel} via Gemini 3.8 Flash...</span>
              </div>
            </div>
          )}
        </div>

        {/* Audio feedback notice if regional TTS voice missing */}
        {audioFeedbackMsg && (
          <div className="px-5 py-1.5 bg-blue-50 border-t border-blue-100 text-[11px] text-blue-700 flex items-center gap-1.5">
            <VolumeX className="w-3 h-3 shrink-0" />
            <span>{audioFeedbackMsg}</span>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="px-5 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={startListening}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Retry Mic
            </button>
          </div>
        )}

        {/* Presets Chips for 1-Click Multi-Language Evaluation */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Voice Questions ({currentConfig.nativeLabel}):
            </span>
            <span className="text-[10px] text-slate-400">Response strictly in {currentConfig.nativeLabel}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {getPresetQueries(selectedLanguage).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(item)}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0F2747] border border-slate-200 rounded-lg transition-colors shadow-xs flex items-center gap-1"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Text Question Input with Live Typing and Embedded Mic Toggle */}
        <form onSubmit={handleManualSubmit} className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={
                isListening
                  ? (selectedLanguage === 'hi'
                    ? 'बोलिए... आपकी आवाज़ यहां टाइप हो रही है'
                    : selectedLanguage === 'kn'
                    ? 'ಮಾತನಾಡಿ... ನಿಮ್ಮ ಧ್ವನಿ ಇಲ್ಲಿ ಟೈಪ್ ಆಗುತ್ತಿದೆ'
                    : 'Listening... speaking will type here live')
                  : (selectedLanguage === 'hi'
                    ? 'प्रश्न यहां टाइप करें या माइक दबाकर बोलें...'
                    : selectedLanguage === 'kn'
                    ? 'ಇಲ್ಲಿ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ...'
                    : 'Speak into mic or type a forensic question...')
              }
              disabled={isProcessing}
              className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all font-medium ${
                isListening
                  ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
                  : 'border-slate-200 focus:border-[#0F8FB3] focus:bg-white'
              }`}
            />
            {/* Quick Mic toggle inside the input box */}
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isProcessing}
              className={`absolute right-2 p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'text-red-500 bg-red-100 animate-pulse'
                  : 'text-slate-400 hover:text-[#0F8FB3] hover:bg-slate-100'
              }`}
              title={isListening ? 'Stop listening & send' : 'Click to speak'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!manualInput.trim() || isProcessing}
            className="px-4 py-2.5 bg-[#0F2747] hover:bg-[#163866] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-40 shrink-0"
          >
            <span>Send</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Microphone Controller Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
          {/* Status Label & Waveform */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100'
                  : 'bg-[#0F8FB3] hover:bg-[#0D7A99] text-white'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F2747]">
                  {isListening
                    ? 'Listening & Typing Speech...'
                    : isProcessing
                    ? 'Processing with Gemini 3.8 Flash...'
                    : isSpeaking
                    ? 'Speaking Response...'
                    : 'Ready'}
                </span>
                {isListening && (
                  <span className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-2 bg-red-500 animate-pulse"></span>
                    <span className="w-0.5 h-3 bg-red-500 animate-bounce"></span>
                    <span className="w-0.5 h-1.5 bg-red-500 animate-pulse"></span>
                  </span>
                )}
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Audio Active</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Powered by <strong className="text-[#0F8FB3]">Gemini 3.8 Flash</strong> ({currentConfig.nativeLabel})
              </p>
            </div>
          </div>

          {/* Language Switch / Force Guide Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {Object.values(LANGUAGE_CONFIG).map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedLanguage === lang.code
                    ? 'bg-white text-[#0F8FB3] shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lang.nativeLabel || lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
