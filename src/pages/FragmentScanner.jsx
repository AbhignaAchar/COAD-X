import React, { useState } from 'react';
import { FileScan, Layers, Binary, ShieldCheck, Eye, Hash, ShieldAlert } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import HexViewer from '../components/HexViewer';
import StatusBadge from '../components/StatusBadge';

export default function FragmentScanner() {
  const { evidenceFiles, fragments, activeFileId, setActiveFileId } = useForensic();
  const [selectedFragId, setSelectedFragId] = useState(null);

  const activeFile = evidenceFiles.find(f => f.id === activeFileId) || evidenceFiles[0];
  const fileFragments = fragments.filter(frag => frag.fileId === activeFile?.id);

  const selectedFragment = fragments.find(f => f.id === selectedFragId) || fileFragments[0];

  // Helper to determine status category
  const getFragmentStatus = (frag) => {
    if (!frag) return 'Recovered';
    if (frag.status === 'Corrupted' || frag.entropy > 7.9) return 'Corrupted';
    if (frag.entropy < 1.0 || frag.tamperSuspect) return 'Suspect';
    return 'Recovered';
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Byte Fragment & Hex Scanner</h2>
          <p className="text-xs text-[#64748B]">
            Inspect raw byte magic signatures, sector block offsets, Shannon entropy, and hex dumps.
          </p>
        </div>
      </div>

      {evidenceFiles.length === 0 ? (
        <div className="glass-panel p-10 text-center border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
          <FileScan className="w-12 h-12 mx-auto mb-3 text-[#94A3B8]" />
          <h4 className="text-sm font-bold text-[#0F172A]">No evidence files available to scan</h4>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Please upload a digital evidence file or load sample data from the sidebar to inspect sectors.
          </p>
        </div>
      ) : (
        <>
          {/* File Selector & Header Inspection */}
          <div className="glass-panel p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Select Evidence File to Analyze
                </label>
                <select
                  value={activeFile?.id || ''}
                  onChange={(e) => {
                    setActiveFileId(e.target.value);
                    setSelectedFragId(null);
                  }}
                  className="input-field max-w-md bg-white font-mono text-xs text-[#0891B2] font-semibold border-[#DCE5EF]"
                >
                  {evidenceFiles.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.id} — {f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </option>
                  ))}
                </select>
              </div>

              {activeFile && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-[#64748B] block">Header Magic Bytes</span>
                    <span className="font-mono text-xs font-bold text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] px-2 py-0.5 rounded">
                      {activeFile.headerHex || 'N/A'}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-[#DCE5EF]"></div>
                  <div className="text-right">
                    <span className="text-xs text-[#64748B] block">Detected Format</span>
                    <span className="text-xs font-bold text-[#0F172A]">{activeFile.detectedType}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Detail Row */}
            {activeFile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-[#F8FAFC] border border-[#DCE5EF] rounded-lg text-xs">
                <div>
                  <span className="text-[#64748B] block">SHA-256 Hash:</span>
                  <span className="font-mono text-[#0891B2] font-semibold truncate block" title={activeFile.hash}>
                    {activeFile.hash ? `${activeFile.hash.substring(0, 16)}...${activeFile.hash.slice(-8)}` : 'Computing...'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Extracted Sectors:</span>
                  <span className="font-mono text-[#0F172A] font-semibold">{fileFragments.length} Blocks (1024 B)</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Signature Match:</span>
                  <span className="font-semibold text-[#16A34A] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    {activeFile.signatureMatch ? 'Verified Signature' : 'ASCII/Text Signature'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Source Tag:</span>
                  <span className="font-mono text-[#7C3AED] font-semibold">
                    {activeFile.isSample ? 'Built-in Demo Sample' : 'User In-Memory File'}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Physical Fragment Map Grid */}
            {fileFragments.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-[#DCE5EF]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0891B2]" /> Sector Fragment Grid Map ({fileFragments.length} Blocks)
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-[#64748B] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#16A34A]"></span> Recovered
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]"></span> Suspect
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]"></span> Corrupted
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#0891B2] ring-1 ring-[#0891B2]"></span> Selected
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-[#F8FAFC] rounded-lg border border-[#DCE5EF]">
                  {fileFragments.map((frag) => {
                    const isSelected = selectedFragment?.id === frag.id;
                    const status = getFragmentStatus(frag);

                    let bgClass = 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]';
                    if (status === 'Suspect') bgClass = 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]';
                    if (status === 'Corrupted') bgClass = 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]';
                    if (isSelected) bgClass = 'bg-[#0891B2] text-white border-[#0891B2] shadow-xs scale-105';

                    return (
                      <button
                        key={frag.id}
                        onClick={() => setSelectedFragId(frag.id)}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${bgClass}`}
                        title={`${frag.id} (${frag.offsetStart} - ${frag.offsetEnd} B)`}
                      >
                        {frag.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fragment Grid & Hex Inspector Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Extracted Fragments Table */}
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0891B2]" />
                  Extracted Byte Fragments ({fileFragments.length})
                </h3>
                <span className="text-[11px] text-[#64748B]">Click row to inspect hex</span>
              </div>

              <div className="custom-table-container max-h-[420px] overflow-y-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Frag ID</th>
                      <th>Byte Range</th>
                      <th>Size</th>
                      <th>Entropy</th>
                      <th>Status</th>
                      <th>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileFragments.map((frag) => {
                      const isSelected = selectedFragment?.id === frag.id;
                      const status = getFragmentStatus(frag);

                      return (
                        <tr
                          key={frag.id}
                          onClick={() => setSelectedFragId(frag.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#ECFEFF] border-l-[3px] border-[#0891B2]' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="font-mono text-xs text-[#0891B2] font-semibold">{frag.id}</td>
                          <td className="font-mono text-xs text-[#0F172A]">
                            {frag.offsetStart} - {frag.offsetEnd} B
                          </td>
                          <td className="font-mono text-xs text-[#64748B]">
                            {frag.sizeBytes || 1024} bytes
                          </td>
                          <td className="font-mono text-xs text-[#D97706] font-medium">
                            {frag.entropy} / 8.0
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                              status === 'Recovered'
                                ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                                : status === 'Suspect'
                                ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <button className="p-1 text-[#64748B] hover:text-[#0891B2]">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Hex & ASCII Viewer */}
            <div>
              <HexViewer
                bytes={selectedFragment ? selectedFragment.data : activeFile?.rawBytes}
                title={selectedFragment ? `Hex Inspection: ${selectedFragment.id} (${selectedFragment.sizeBytes || 1024} bytes)` : `Header Hex: ${activeFile?.name}`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
