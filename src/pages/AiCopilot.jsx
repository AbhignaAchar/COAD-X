import React, { useState } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, CheckCircle2, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import {
  analyzeEvidenceWithRules,
  buildLiveForensicContext,
  queryCopilotAPI
} from '../utils/aiCopilot';

export default function AiCopilot() {
  const { evidenceFiles, fragments, reconstructedFiles, tamperSummary } = useForensic();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      sender: 'copilot',
      text: 'COAD-X AI Forensic Copilot initialized. I have direct access to active in-memory evidence, byte fragments, cryptographic integrity records, and tamper detection heuristics. How can I assist your investigation?',
      isRule: true,
      time: new Date().toLocaleTimeString()
    }
  ]);

  const analysis = analyzeEvidenceWithRules(evidenceFiles, fragments, reconstructedFiles, tamperSummary);

  const handleSendQuery = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg = { sender: 'user', text: query, time: new Date().toLocaleTimeString() };
    setChatLog(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const liveContext = buildLiveForensicContext(evidenceFiles, fragments, reconstructedFiles, tamperSummary);
      const result = await queryCopilotAPI({
        message: query,
        detectedLanguage: 'en',
        languageName: 'English',
        responseLanguage: 'en',
        forensicContext: liveContext
      });

      const copilotMsg = {
        sender: 'copilot',
        text: result.answer,
        source: result.source,
        time: new Date().toLocaleTimeString()
      };

      setChatLog(prev => [...prev, copilotMsg]);
    } catch (err) {
      setChatLog(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Encountered an issue consulting forensic intelligence engine. Please retry your inquiry.',
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Which evidence should I investigate first?',
    'Why is this file partially recoverable?',
    'Which fragments are critical?',
    'Show related evidence.',
    'Explain this corruption.',
    'What can realistically be restored?'
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
          <span className="text-[#0891B2]">✦</span> COAD-X AI COPILOT
        </h2>
        <p className="text-xs text-[#64748B]">
          Investigation-aware forensic analysis powered by live in-memory case telemetry.
        </p>
      </div>

      {/* Analysis Summary Box */}
      <div className="glass-panel p-5 border-[#DCE5EF] bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0891B2]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Automated Telemetry Analysis</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC] font-semibold">
            {analysis.engineLabel}
          </span>
        </div>

        <p className="text-xs text-[#0F172A] leading-relaxed mb-3">
          {analysis.summary}
        </p>

        {analysis.recommendations && (
          <div className="space-y-1.5 pt-2.5 border-t border-[#DCE5EF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Investigative Recommendations:</span>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-[#0F172A] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] shrink-0"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Interactive Q&A Copilot Chat Panel */}
      <div className="glass-panel p-5 flex flex-col h-[520px]">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#DCE5EF]">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#0891B2]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Forensic Assistant Consultation</h3>
          </div>
          <span className="text-[11px] font-mono text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] px-2 py-0.5 rounded font-semibold">
            Context: {evidenceFiles.length} files / {fragments.length} frags
          </span>
        </div>

        {/* Preset Suggested Questions */}
        <div className="mb-3">
          <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
            Suggested Forensic Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(q)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#ECFEFF] text-[#0F172A] hover:text-[#0891B2] rounded-md border border-[#DCE5EF] hover:border-[#0891B2] shadow-2xs transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 bg-[#F8FAFC] p-4 rounded-lg border border-[#DCE5EF]">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-lg text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#0891B2] text-white rounded-br-none shadow-xs font-medium'
                    : 'bg-white border border-[#DCE5EF] text-[#0F172A] rounded-bl-none shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
              <span className="text-[9px] text-[#64748B] mt-1 font-mono px-1">{msg.time}</span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#64748B] p-2 bg-white rounded-md border border-[#DCE5EF] max-w-xs">
              <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-ping"></span>
              <span>Analyzing live forensic telemetry...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-2 pt-2 border-t border-[#DCE5EF]"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask forensic copilot about headers, entropy, or reconstruction..."
            className="input-field text-xs bg-white border-[#DCE5EF] text-[#0F172A] placeholder-[#94A3B8] focus:bg-white"
          />
          <button type="submit" disabled={isLoading || !inputQuery.trim()} className="btn btn-cyan py-2 px-3 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
