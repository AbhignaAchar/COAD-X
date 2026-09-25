import React, { useMemo } from 'react';
import { FileType, CheckCircle2, AlertTriangle, ShieldCheck, Database, Image, FileText, Film, Music, Server, Archive, HardDrive, HelpCircle } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import { FILE_SIGNATURES } from '../utils/forensicEngine';
import StatusBadge from '../components/StatusBadge';

export default function FileClassification() {
  const { evidenceFiles } = useForensic();

  // Category counts and categorization
  const categoryCards = useMemo(() => {
    const categories = [
      { id: 'IMAGE', label: 'IMAGE', icon: Image, exts: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] },
      { id: 'DOCUMENT', label: 'DOCUMENT', icon: FileText, exts: ['pdf', 'doc', 'docx', 'txt', 'csv', 'json', 'xml', 'log'] },
      { id: 'VIDEO', label: 'VIDEO', icon: Film, exts: ['mp4', 'mkv', 'avi', 'mov'] },
      { id: 'AUDIO', label: 'AUDIO', icon: Music, exts: ['wav', 'mp3', 'aac', 'flac'] },
      { id: 'DATABASE', label: 'DATABASE', icon: Server, exts: ['db', 'sqlite', 'sql', 'mdb'] },
      { id: 'ARCHIVE', label: 'ARCHIVE', icon: Archive, exts: ['zip', 'tar', 'gz', '7z', 'rar'] },
      { id: 'SYSTEM', label: 'SYSTEM', icon: HardDrive, exts: ['bin', 'dat', 'raw', 'dump', 'iso'] },
      { id: 'UNKNOWN', label: 'UNKNOWN', icon: HelpCircle, exts: [] }
    ];

    return categories.map(cat => {
      const matchingFiles = evidenceFiles.filter(f => {
        const lowerExt = (f.name?.split('.').pop() || '').toLowerCase();
        const lowerType = (f.detectedType || '').toLowerCase();
        if (cat.id === 'IMAGE') return cat.exts.includes(lowerExt) || lowerType.includes('image');
        if (cat.id === 'DOCUMENT') return cat.exts.includes(lowerExt) || lowerType.includes('document') || lowerType.includes('text') || lowerType.includes('pdf');
        if (cat.id === 'VIDEO') return cat.exts.includes(lowerExt) || lowerType.includes('video');
        if (cat.id === 'AUDIO') return cat.exts.includes(lowerExt) || lowerType.includes('audio');
        if (cat.id === 'DATABASE') return cat.exts.includes(lowerExt) || lowerType.includes('database');
        if (cat.id === 'ARCHIVE') return cat.exts.includes(lowerExt) || lowerType.includes('zip') || lowerType.includes('archive');
        if (cat.id === 'SYSTEM') return cat.exts.includes(lowerExt) || lowerType.includes('binary') || lowerType.includes('system');
        return false;
      });

      return {
        ...cat,
        count: matchingFiles.length,
        hasFiles: matchingFiles.length > 0
      };
    });
  }, [evidenceFiles]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">File Signature & Format Classification</h2>
        <p className="text-xs text-[#64748B]">
          Match file headers against known cryptographic magic byte signatures and analyze MIME consistency.
        </p>
      </div>

      {/* Forensic Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {categoryCards.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`p-3 rounded-lg border text-center transition-all ${
                cat.hasFiles
                  ? 'bg-[#ECFEFF] border-[#A5F3FC] text-[#0891B2] shadow-2xs'
                  : 'bg-white border-[#DCE5EF] text-[#64748B]'
              }`}
            >
              <Icon className={`w-4 h-4 mx-auto mb-1.5 ${cat.hasFiles ? 'text-[#0891B2]' : 'text-[#64748B]'}`} />
              <div className="text-[10px] font-bold font-mono tracking-wider">{cat.label}</div>
              <div className="text-base font-extrabold font-mono mt-0.5">{cat.count}</div>
            </div>
          );
        })}
      </div>

      {/* Evidence Files Classification Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Classification Results (Active Evidence)</h3>
            <p className="text-xs text-[#64748B]">Automated byte signature detection and confidence scoring</p>
          </div>
          <span className="text-[11px] font-mono text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] px-2 py-0.5 rounded font-semibold">
            {evidenceFiles.length} Ingested Object(s)
          </span>
        </div>

        {evidenceFiles.length === 0 ? (
          <div className="text-center py-6 text-[#64748B] text-xs">
            No evidence files ingested yet. Upload files to see magic signature classification scores.
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Declared File Name</th>
                  <th>Magic Bytes Header</th>
                  <th>Detected Signature Type</th>
                  <th>Classification Signal</th>
                  <th>Confidence Score</th>
                  <th>Signature Match</th>
                </tr>
              </thead>
              <tbody>
                {evidenceFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#F8FAFC]">
                    <td className="font-mono text-xs text-[#0891B2] font-semibold">{file.id}</td>
                    <td className="font-medium text-xs text-[#0F172A]">{file.name}</td>
                    <td className="font-mono text-xs text-[#16A34A] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0] inline-block">
                      {file.headerHex || 'N/A'}
                    </td>
                    <td className="text-xs font-semibold text-[#0F172A]">{file.detectedType}</td>
                    <td className="text-[11px] font-mono text-[#64748B]">
                      {file.signatureMatch ? 'BYTE_SIGNATURE' : 'ASCII_HEURISTIC'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#EEF3F8] h-2 rounded-full overflow-hidden border border-[#DCE5EF]">
                          <div
                            className={`h-full ${file.confidence >= 90 ? 'bg-[#16A34A]' : file.confidence >= 50 ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`}
                            style={{ width: `${file.confidence || 95}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs text-[#0F172A] font-medium">{file.confidence || 95}%</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={file.signatureMatch ? 'Verified' : 'Heuristic'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature Reference Dictionary */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#0891B2]" />
          Supported Magic Byte Signatures Dictionary
        </h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Format Name</th>
                <th>Extension</th>
                <th>MIME Pattern</th>
                <th>Header Hex Magic Bytes</th>
                <th>Format Description</th>
              </tr>
            </thead>
            <tbody>
              {FILE_SIGNATURES.map((sig, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC]">
                  <td className="font-bold text-[#0F172A] text-xs">{sig.type}</td>
                  <td className="font-mono text-xs text-[#0891B2]">.{sig.ext}</td>
                  <td className="font-mono text-xs text-[#64748B]">{sig.mime}</td>
                  <td className="font-mono text-xs text-[#16A34A] font-semibold">{sig.headerHex}</td>
                  <td className="text-xs text-[#64748B]">{sig.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
