import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, CheckCircle2, AlertCircle, Database, ShieldCheck, Lock } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function EvidenceUpload() {
  const { evidenceFiles, addUploadedFiles, loadSampleData, clearSession } = useForensic();
  const { requireAuthForUpload, isAuthenticated, openAuthModal } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = e.dataTransfer.files;
      requireAuthForUpload(() => {
        addUploadedFiles(droppedFiles);
      });
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = e.target.files;
      requireAuthForUpload(() => {
        addUploadedFiles(selectedFiles);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Digital Evidence Ingestion</h2>
          <p className="text-xs text-[#64748B]">
            Upload files into browser memory for immediate byte signature scan and cryptographic hashing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadSampleData} className="btn btn-outline text-xs">
            <Database className="w-3.5 h-3.5 text-[#0891B2]" /> Load Sample Evidence
          </button>
          <button
            onClick={clearSession}
            disabled={evidenceFiles.length === 0}
            className="btn btn-danger text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear In-Memory Evidence
          </button>
        </div>
      </div>

      {/* Free Access Notice Banner */}
      {!isAuthenticated && (
        <div className="bg-[#ECFEFF] border border-[#A5F3FC] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#A5F3FC] flex items-center justify-center text-[#0891B2] shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A]">Free Exploration Mode Active:</span>
              <span className="text-[#64748B] ml-1">
                You can freely navigate all forensic modules, inspect sample evidence, and test AI tools. Uploading your own custom evidence files requires a free Supabase examiner account.
              </span>
            </div>
          </div>
          <button
            onClick={openAuthModal}
            className="btn btn-primary text-xs py-1.5 px-3.5 whitespace-nowrap shrink-0 shadow-2xs"
          >
            Sign In / Sign Up
          </button>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          requireAuthForUpload(() => {
            fileInputRef.current?.click();
          });
        }}
        className={`bg-white p-8 sm:p-10 text-center border-2 border-dashed rounded-xl cursor-pointer transition-all shadow-2xs ${
          isDragging
            ? 'border-[#0891B2] bg-[#ECFEFF] shadow-xs scale-[1.002]'
            : 'border-[#DCE5EF] hover:border-[#0891B2] hover:bg-[#F8FAFC]'
        }`}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".txt,.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.csv,.json,.xml,.log,.zip,.bin,.dat"
        />

        <div className="w-12 h-12 rounded-xl bg-[#ECFEFF] border border-[#A5F3FC] flex items-center justify-center mx-auto mb-3 text-[#0891B2]">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mb-1">
          Drag & Drop Digital Evidence Files Here
        </h3>
        <p className="text-xs text-[#64748B] max-w-md mx-auto mb-3.5">
          Supports JPG, PNG, WEBP, TXT, CSV, JSON, XML, LOG, PDF, DOC, and DOCX files up to 25MB.
        </p>

        <div className="inline-flex items-center gap-2">
          <span className="btn btn-cyan text-xs inline-flex items-center gap-2 shadow-2xs">
            {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-white/80" />}
            Browse Files On System
          </span>
          {!isAuthenticated && (
            <span className="text-[11px] text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-1 rounded font-medium">
              Requires Sign In / Sign Up
            </span>
          )}
        </div>

        <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Files are parsed 100% locally in browser memory. No external server upload.</span>
        </div>
      </div>

      {/* Uploaded Evidence Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Ingested Evidence List</h3>
            <p className="text-xs text-[#64748B]">{evidenceFiles.length} file(s) in active session memory</p>
          </div>
        </div>

        {evidenceFiles.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-xs">
            No evidence files ingested yet. Drag files into the box above or click "Load Sample Evidence".
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>MIME Type</th>
                  <th>SHA-256 Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {evidenceFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="font-mono text-xs text-[#0891B2] font-semibold">{file.id}</td>
                    <td className="font-medium text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-[#64748B]" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-[#64748B]">
                      {(file.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="text-xs text-[#64748B] font-mono">
                      {file.type || 'unknown'}
                    </td>
                    <td className="font-mono text-xs text-[#0891B2]" title={file.hash}>
                      {file.hash ? `${file.hash.substring(0, 16)}...` : 'Calculating...'}
                    </td>
                    <td>
                      <StatusBadge status={file.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
