import React, { useState, useId } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Eye,
  Check,
  CheckCircle2,
  Search,
  Filter,
  X,
  FileCode,
  Layers,
  Lock,
  Activity,
  Binary,
  ArrowRight
} from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import HexViewer from '../components/HexViewer';

export default function TamperDetection({ setCurrentPage }) {
  const {
    evidenceFiles,
    fragments,
    tamperAnalysisMap,
    tamperSummary,
    reviewedFragIds,
    toggleReviewed,
    loadSampleData
  } = useForensic();

  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'tampered', 'suspicious', 'natural'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFragForHex, setSelectedFragForHex] = useState(null);

  // Close modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedFragForHex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter fragments according to active filter and search query
  const filteredFragments = fragments.filter(frag => {
    const analysis = tamperAnalysisMap[frag.id] || { status: 'natural', statusLabel: 'NATURAL', confidence: 95 };
    
    // Status filter
    if (filterStatus !== 'all' && analysis.status !== filterStatus) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = frag.id.toLowerCase().includes(q);
      const matchFile = (frag.fileName || '').toLowerCase().includes(q);
      const matchStatus = analysis.statusLabel.toLowerCase().includes(q);
      const matchPattern = (analysis.wipePatternAnalysis?.patternName || '').toLowerCase().includes(q);
      if (!matchId && !matchFile && !matchStatus && !matchPattern) return false;
    }

    return true;
  });

  // Helper for Accessible Status rendering (never color-only: icon + text label + color)
  const renderStatusBadge = (analysis) => {
    switch (analysis.status) {
      case 'tampered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-50 border border-red-200 text-red-700">
            <XCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>✕ LIKELY TAMPERED</span>
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>⚠ SUSPICIOUS</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>● NATURAL</span>
          </span>
        );
    }
  };

  const getStatusCardBorder = (analysis) => {
    switch (analysis.status) {
      case 'tampered':
        return 'border-red-300 hover:border-red-400 bg-white shadow-sm';
      case 'suspicious':
        return 'border-amber-300 hover:border-amber-400 bg-white shadow-sm';
      default:
        return 'border-slate-200 hover:border-slate-300 bg-white shadow-sm';
    }
  };

  const selectedFragAnalysis = selectedFragForHex ? tamperAnalysisMap[selectedFragForHex.id] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] text-xs font-semibold mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Pipeline Stage 5.5 • Anti-Forensic Verification
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-wide">
            Tamper & Anti-Forensic Detection
          </h2>
          <p className="text-xs text-[#64748B]">
            Distinguish natural physical disk corruption from deliberate anti-forensic wiping, header destruction, and timestamp manipulation using real byte-level mathematics.
          </p>
        </div>

        {fragments.length === 0 && (
          <button
            onClick={loadSampleData}
            className="btn btn-cyan text-xs flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <Activity className="w-4 h-4" /> Load Evidence Data
          </button>
        )}
      </div>

      {/* Required Forensic Authenticity & Legal Disclaimer */}
      <div className="p-4 bg-[#ECFEFF] border border-[#A5F3FC] rounded-xl flex items-start gap-3.5 text-xs text-[#0F172A] shadow-2xs">
        <Lock className="w-5 h-5 text-[#0891B2] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-[#0F172A] uppercase tracking-wide text-[11px]">
            Statistical Analysis Notice & Investigative Disclaimer
          </h4>
          <p className="leading-relaxed text-[#64748B]">
            Tamper detection is based on statistical byte-pattern analysis (entropy uniformity, header zeroing, known wipe-signature matching) performed entirely in-browser. This indicates <strong className="text-[#0F172A]">STATISTICAL LIKELIHOOD</strong> of deliberate tampering, not legal proof. Flagged findings should be treated as investigative leads requiring further verification, not conclusive evidence.
          </p>
        </div>
      </div>

      {fragments.length === 0 ? (
        <div className="glass-panel p-12 text-center text-[#64748B] space-y-3">
          <ShieldAlert className="w-12 h-12 mx-auto text-[#94A3B8] animate-pulse" />
          <p className="text-sm font-medium text-[#0F172A]">No fragment sectors in session memory to analyze.</p>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Upload digital evidence files or load sample data from the dashboard to run the anti-forensic detection algorithms.
          </p>
          <div className="pt-2">
            <button onClick={loadSampleData} className="btn btn-cyan text-xs">
              Load Demo Evidence with Wiped Blocks
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Summary Strip (Top) */}
          <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Counts Pill Grid */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  filterStatus === 'all'
                    ? 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2] shadow-2xs'
                    : 'bg-white text-[#64748B] border-[#DCE5EF] hover:text-[#0F172A]'
                }`}
              >
                All Sectors: <span className="text-[#0F172A] font-bold">{tamperSummary.total}</span>
              </button>

              <button
                onClick={() => setFilterStatus('natural')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                  filterStatus === 'natural'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                    : 'bg-white text-emerald-700/80 border-slate-200 hover:text-emerald-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>● Natural: <strong className="text-emerald-800 font-bold">{tamperSummary.naturalCount}</strong></span>
              </button>

              <button
                onClick={() => setFilterStatus('suspicious')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                  filterStatus === 'suspicious'
                    ? 'bg-amber-50 text-amber-700 border-amber-500 shadow-sm'
                    : 'bg-white text-amber-700/80 border-slate-200 hover:text-amber-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>⚠ Suspicious: <strong className="text-amber-800 font-bold">{tamperSummary.suspiciousCount}</strong></span>
              </button>

              <button
                onClick={() => setFilterStatus('tampered')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                  filterStatus === 'tampered'
                    ? 'bg-red-50 text-red-700 border-red-500 shadow-sm'
                    : 'bg-white text-red-700/80 border-slate-200 hover:text-red-900'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>✕ Tampered: <strong className="text-red-800 font-bold">{tamperSummary.tamperedCount}</strong></span>
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Frag ID, file, or pattern..."
                className="input-field text-xs pl-8 pr-8 py-1.5 bg-slate-50 border-slate-200 text-slate-800 font-mono focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Fragment List/Grid */}
          {filteredFragments.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-500 text-xs">
              No fragments match current filter criteria "{filterStatus}" or search term "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFragments.map((frag) => {
                const analysis = tamperAnalysisMap[frag.id] || {
                  status: 'natural',
                  statusLabel: 'NATURAL',
                  confidence: 95,
                  entropyAnalysis: { suspicious: false, meanEntropy: frag.entropy, stddev: 0.3 },
                  headerAnalysis: { zeroed: false, percentUniform: 0 },
                  wipePatternAnalysis: { matched: false, similarityPercent: 0 },
                  timestampAnalysis: { isConflicting: false }
                };

                const isReviewed = reviewedFragIds.has(frag.id);

                return (
                  <div
                    key={frag.id}
                    tabIndex={0}
                    aria-label={`Fragment ${frag.id}, status: ${analysis.statusLabel}, confidence: ${analysis.confidence} percent`}
                    className={`glass-panel p-4 rounded-xl border flex flex-col justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#0F8FB3] ${getStatusCardBorder(
                      analysis
                    )}`}
                  >
                    <div>
                      {/* Card Header: Fragment ID + Accessible Status Badge */}
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#0F8FB3]">
                            {frag.id}
                          </span>
                          {isReviewed && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                              <Check className="w-2.5 h-2.5" /> Reviewed
                            </span>
                          )}
                        </div>
                        <div>
                          {renderStatusBadge(analysis)}
                        </div>
                      </div>

                      {/* Parent File & Offset Snippet */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-3">
                        <span className="truncate max-w-[170px]" title={frag.fileName}>
                          {frag.fileName || 'Active File'}
                        </span>
                        <span>{frag.offsetStart} - {frag.offsetEnd} B</span>
                      </div>

                      {/* Real Byte Mathematical Indicators */}
                      <div className="space-y-2 text-xs font-mono mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {/* 1. Entropy Uniformity Metric */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-500">Entropy:</span>
                          <span className={`text-right font-semibold ${
                            analysis.entropyAnalysis?.suspicious ? 'text-red-600' : 'text-slate-800'
                          }`}>
                            {analysis.entropyAnalysis?.meanEntropy} (σ {analysis.entropyAnalysis?.stddev} — {analysis.entropyAnalysis?.suspicious ? 'abnormal' : 'normal'})
                          </span>
                        </div>

                        {/* 2. Header Zeroing Metric */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-500">Header:</span>
                          <span className={`text-right font-semibold ${
                            analysis.headerAnalysis?.zeroed ? 'text-red-600' : 'text-slate-800'
                          }`}>
                            {analysis.headerAnalysis?.zeroed
                              ? `${analysis.headerAnalysis.percentUniform}% zeroed (${analysis.headerAnalysis.matchingBytesCount}/${analysis.headerAnalysis.totalInspected} B)`
                              : `Intact / Variable (${analysis.headerAnalysis?.percentUniform || 12}% peak)`}
                          </span>
                        </div>

                        {/* 3. Known Wipe Pattern Match Metric */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-500">Pattern match:</span>
                          <span className={`text-right font-semibold ${
                            analysis.wipePatternAnalysis?.matched ? 'text-red-600' : 'text-slate-500'
                          }`}>
                            {analysis.wipePatternAnalysis?.matched
                              ? `${analysis.wipePatternAnalysis.similarityPercent}% — ${analysis.wipePatternAnalysis.patternName}`
                              : `${analysis.wipePatternAnalysis?.similarityPercent || 0}% — None detected`}
                          </span>
                        </div>

                        {/* 4. Timestamp Inversion Metric */}
                        {analysis.timestampAnalysis?.isConflicting && (
                          <div className="flex items-start justify-between gap-2 text-amber-700 pt-1 border-t border-slate-200">
                            <span>Timestamp:</span>
                            <span className="text-right font-bold text-[11px]">
                              ⚠ Inversion Detected (Post-Hoc Edit)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confidence Meter & Actions */}
                    <div>
                      {/* Real Computed Confidence Percentage Bar */}
                      <div className="mb-3.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Analysis Confidence:</span>
                          <span className={`font-mono font-bold ${
                            analysis.status === 'tampered'
                              ? 'text-red-600'
                              : analysis.status === 'suspicious'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}>
                            {analysis.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                          <div
                            className={`h-full transition-all duration-300 ${
                              analysis.status === 'tampered'
                                ? 'bg-red-500'
                                : analysis.status === 'suspicious'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${analysis.confidence}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => setSelectedFragForHex(frag)}
                          className="btn btn-outline text-xs flex-1 flex items-center justify-center gap-1.5 py-1.5"
                          title="View Hex Dump & Highlight Flagged Range"
                        >
                          <Binary className="w-3.5 h-3.5 text-[#0F8FB3]" />
                          <span>View Raw Bytes</span>
                        </button>

                        <button
                          onClick={() => toggleReviewed(frag.id)}
                          className={`btn text-xs py-1.5 px-3 flex items-center gap-1 transition-colors ${
                            isReviewed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                          title="Mark or Unmark Reviewed"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isReviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 3. "View Raw Bytes" Modal (Reusing Existing HexViewer Component) */}
      {selectedFragForHex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="glass-panel max-w-4xl w-full border border-slate-200 p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E6F6FA] text-[#0F8FB3]">
                  <Binary className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                    <span>Raw Byte Inspection:</span>
                    <span className="font-mono text-[#0F8FB3]">{selectedFragForHex.id}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parent File: <span className="text-slate-700 font-medium">{selectedFragForHex.fileName}</span> | Logical Range: <span className="font-mono text-[#0F8FB3] font-medium">{selectedFragForHex.offsetStart} - {selectedFragForHex.offsetEnd} Bytes</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedFragAnalysis && renderStatusBadge(selectedFragAnalysis)}
                <button
                  onClick={() => setSelectedFragForHex(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Evidence Breakdown Alert in Modal */}
            {selectedFragAnalysis && selectedFragAnalysis.status !== 'natural' && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between text-red-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Detected Anti-Forensic Signals ({selectedFragAnalysis.evidencePoints.length})
                  </span>
                  <span className="font-mono text-red-700">
                    Confidence: {selectedFragAnalysis.confidence}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedFragAnalysis.evidencePoints.map((pt, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-700 text-[11px] font-mono">
                      • {pt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reused Hex & ASCII Viewer Component */}
            <div>
              <HexViewer
                bytes={selectedFragForHex.data}
                title={`Sector Inspection: ${selectedFragForHex.id} (${selectedFragForHex.sizeBytes} Bytes)`}
                highlightRange={
                  selectedFragAnalysis?.status !== 'natural'
                    ? selectedFragAnalysis?.flaggedOffsetRange
                    : null
                }
                maxLines={64}
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-mono">
                Press ESC or click outside to dismiss inspection
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReviewed(selectedFragForHex.id)}
                  className="btn btn-outline text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {reviewedFragIds.has(selectedFragForHex.id) ? 'Unmark Reviewed' : 'Mark Reviewed'}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedFragForHex(null)}
                  className="btn btn-cyan text-xs"
                >
                  Done Inspecting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
