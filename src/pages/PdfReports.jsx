import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Cloud,
  RefreshCw,
  Trash2,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import { generateForensicPdfReport } from '../utils/pdfGenerator';
import {
  uploadPdfReportToSupabase,
  listPdfReportsFromSupabase,
  deletePdfReportFromSupabase,
  REPORTS_BUCKET
} from '../utils/supabaseClient';
import StatusBadge from '../components/StatusBadge';

export default function PdfReports() {
  const { caseId, setCaseId, evidenceFiles, fragments, reconstructedFiles, tamperAnalysisMap, flaggedFragments, showToast } = useForensic();
  const [investigatorName, setInvestigatorName] = useState('Analyst Officer (Local)');
  const [isUploading, setIsUploading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [isLoadingBucket, setIsLoadingBucket] = useState(false);

  const fetchBucketReports = async () => {
    setIsLoadingBucket(true);
    try {
      const reports = await listPdfReportsFromSupabase();
      setSavedReports(reports);
    } catch (err) {
      console.warn('Error fetching Supabase reports:', err);
    } finally {
      setIsLoadingBucket(false);
    }
  };

  useEffect(() => {
    fetchBucketReports();
  }, []);

  const handleDownloadPdf = async () => {
    try {
      setIsUploading(true);
      const { doc, pdfBlob, fileName } = generateForensicPdfReport({
        caseId,
        investigatorName,
        evidenceFiles,
        fragments,
        reconstructedFiles,
        tamperAnalysisMap,
        flaggedFragments
      });
      showToast('PDF downloaded locally to your device.', 'info');

      // Automatically upload to Supabase Storage bucket
      try {
        await uploadPdfReportToSupabase(pdfBlob, fileName);
        showToast(`Archived to Supabase Storage bucket '${REPORTS_BUCKET}'!`, 'success');
        await fetchBucketReports();
      } catch (uploadErr) {
        console.error('Supabase upload error:', uploadErr);
        showToast('Downloaded locally. Supabase bucket upload failed: ' + uploadErr.message, 'warning');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to generate PDF report.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = async (fileName) => {
    if (!window.confirm(`Delete ${fileName} from Supabase Storage bucket?`)) return;
    try {
      const ok = await deletePdfReportFromSupabase(fileName);
      if (ok) {
        showToast(`Report ${fileName} deleted from Supabase bucket.`, 'success');
        fetchBucketReports();
      } else {
        showToast('Could not delete report from bucket.', 'error');
      }
    } catch (e) {
      showToast('Delete error: ' + e.message, 'error');
    }
  };

  const verifiedCount = reconstructedFiles.filter(r => r.integrityStatus === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0F172A]">Forensic Audit PDF Report Generator</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC]">
              Cloud Bucket Active
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Export official case reports and automatically archive them to Supabase Storage bucket <strong className="text-[#0F172A] font-mono">({REPORTS_BUCKET})</strong>.
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isUploading}
          className="btn btn-cyan text-xs flex items-center gap-2 shadow-2xs disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving to Supabase Bucket...</span>
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4" />
              <Download className="w-4 h-4" />
              <span>Download & Save to Supabase Bucket</span>
            </>
          )}
        </button>
      </div>

      {/* Configuration & Customization Card */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Case Metadata Configuration</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#64748B] block mb-1 font-semibold">Case Reference Identifier</label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="input-field font-mono text-[#0891B2] font-semibold bg-white border-[#DCE5EF]"
              />
            </div>

            <div>
              <label className="text-[#64748B] block mb-1 font-semibold">Lead Investigator Name</label>
              <input
                type="text"
                value={investigatorName}
                onChange={(e) => setInvestigatorName(e.target.value)}
                className="input-field bg-white border-[#DCE5EF] text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Report Contents Summary</h3>
          <div className="p-4 bg-[#F8FAFC] border border-[#DCE5EF] rounded-lg text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Evidence Files Ingested:</span>
              <span className="font-mono font-bold text-[#0F172A]">{evidenceFiles.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Fragments Scanned:</span>
              <span className="font-mono font-bold text-[#0891B2]">{fragments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Reconstructed Jobs:</span>
              <span className="font-mono font-bold text-[#7C3AED]">{reconstructedFiles.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Verified Cryptographic Matches:</span>
              <span className="font-mono font-bold text-[#16A34A]">{verifiedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live PDF Document Structure Preview */}
      <div className="glass-panel p-6 border-[#DCE5EF] bg-white">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DCE5EF]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0891B2]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Live PDF Layout Structure Preview</h3>
          </div>
          <span className="text-xs text-[#64748B] font-mono">Format: A4 Standard Document</span>
        </div>

        <div className="p-6 bg-[#F8FAFC] border border-[#DCE5EF] rounded-xl space-y-6 text-xs text-[#0F172A]">
          {/* Header Box */}
          <div className="p-4 bg-white border border-[#DCE5EF] border-l-4 border-l-[#0891B2] rounded-lg shadow-2xs">
            <h4 className="text-base font-extrabold text-[#0F172A] uppercase tracking-wide">
              COAD-X CYBER FORENSIC REPORT
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#64748B] mt-2 font-mono">
              <div>Case Reference ID: <span className="text-[#0891B2] font-bold">{caseId}</span></div>
              <div>Investigator / Analyst: <span className="text-[#0F172A] font-medium">{investigatorName}</span></div>
              <div>Total Evidence Files: <span className="text-[#0F172A] font-bold">{evidenceFiles.length}</span></div>
              <div>Total Fragments Scanned: <span className="text-[#0891B2] font-bold">{fragments.length}</span></div>
            </div>
          </div>

          {/* Section 1 */}
          <div>
            <h5 className="font-bold text-[#0F2747] mb-2 uppercase tracking-wider text-[11px]">
              1. Evidence Files & Classification
            </h5>
            <div className="custom-table-container">
              <table className="custom-table text-[11px]">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Detected Type</th>
                    <th>SHA-256 Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceFiles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-slate-400 font-mono">No evidence recorded</td>
                    </tr>
                  ) : (
                    evidenceFiles.map(f => {
                      const sizeStr = typeof f.size === 'number'
                        ? (f.size >= 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : `${(f.size / 1024).toFixed(2)} KB`)
                        : (f.size || 'N/A');
                      return (
                        <tr key={f.id}>
                          <td className="font-mono text-[#0F8FB3] font-semibold">{f.id}</td>
                          <td className="text-slate-800 font-medium">{f.name}</td>
                          <td className="font-mono text-slate-600">{sizeStr}</td>
                          <td className="text-slate-600">{f.detectedType || f.type || 'Unknown'}</td>
                          <td className="font-mono text-slate-500">{f.hash ? (f.hash.length > 20 ? `${f.hash.substring(0, 16)}...` : f.hash) : 'Pending'}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#E6F6FA] text-[#0F8FB3] border border-[#BAE6FD]">
                              {f.status || 'Scanned'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h5 className="font-bold text-[#0F172A] mb-2 uppercase tracking-wider text-[11px]">
              2. Reconstruction & Cryptographic Integrity
            </h5>
            <div className="custom-table-container">
              <table className="custom-table text-[11px]">
                <thead>
                  <tr>
                    <th>Rec ID</th>
                    <th>Target File</th>
                    <th>Fragments</th>
                    <th>Recon Status</th>
                    <th>Original Hash</th>
                    <th>Recon Hash</th>
                    <th>Integrity</th>
                  </tr>
                </thead>
                <tbody>
                  {reconstructedFiles.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-[#64748B] font-mono">No reconstruction performed</td>
                    </tr>
                  ) : (
                    reconstructedFiles.map(r => {
                      const origHashDisplay = (r.originalHash && r.originalHash !== 'NOT AVAILABLE')
                        ? (r.originalHash.length > 20 ? `${r.originalHash.substring(0, 16)}...` : r.originalHash)
                        : 'NOT AVAILABLE';

                      const reconHashDisplay = (r.reconstructedHash && r.reconstructedHash !== 'NOT AVAILABLE')
                        ? (r.reconstructedHash.length > 20 ? `${r.reconstructedHash.substring(0, 16)}...` : r.reconstructedHash)
                        : 'NOT AVAILABLE';

                      const fragDisplay = r.fragmentCount !== undefined
                        ? r.fragmentCount.toString()
                        : (r.fragmentsDetected ? `${r.fragmentsDetected} detected` : '1');

                      return (
                        <tr key={r.id}>
                          <td className="font-mono text-[#0891B2] font-semibold">{r.id}</td>
                          <td className="text-[#0F172A] font-medium">{r.targetFile || r.originalName || r.name}</td>
                          <td className="font-mono text-[#64748B]">{fragDisplay}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                              {r.status || r.reconStatus || 'RECONSTRUCTED'}
                            </span>
                          </td>
                          <td className="font-mono text-[#64748B]">{origHashDisplay}</td>
                          <td className="font-mono text-[#16A34A] font-semibold">{reconHashDisplay}</td>
                          <td><StatusBadge status={r.integrityStatus || r.integrity || 'Verified'} /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Storage Cloud Bucket Section */}
      <div className="glass-panel p-6 border-[#DCE5EF] bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5EF] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F2747] text-[#0891B2] flex items-center justify-center shadow-2xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Supabase Cloud Storage: Saved PDF Reports
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                  Bucket: {REPORTS_BUCKET}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                All generated forensic PDF reports are automatically uploaded and securely stored in your Supabase project bucket.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBucketReports}
              disabled={isLoadingBucket}
              className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#64748B] hover:text-[#0891B2]"
              title="Refresh bucket contents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBucket ? 'animate-spin' : ''}`} />
              <span>Refresh Bucket</span>
            </button>
          </div>
        </div>

        {/* Bucket Files Table */}
        {isLoadingBucket ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0F8FB3]" />
            <span>Loading reports from Supabase Storage...</span>
          </div>
        ) : savedReports.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No PDF reports saved in Supabase bucket yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Download &amp; Save to Supabase Bucket&quot; above to generate and archive your first forensic case report.
            </p>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Report File Name</th>
                  <th>Archive Timestamp</th>
                  <th>File Size</th>
                  <th>Cloud Storage URL</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedReports.map((report) => (
                  <tr key={report.id || report.name}>
                    <td className="font-medium text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-mono text-xs font-semibold">{report.name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-600 font-mono">
                      {report.formattedDate}
                    </td>
                    <td className="text-xs text-slate-600 font-mono">
                      {report.sizeKb} KB
                    </td>
                    <td className="text-xs text-slate-400 font-mono">
                      <span className="truncate max-w-[240px] block" title={report.publicUrl}>
                        {report.publicUrl}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={report.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline text-[11px] py-1 px-2.5 flex items-center gap-1 text-[#0F8FB3] hover:border-[#0F8FB3]"
                          title="Open/Download from Supabase"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                        <button
                          onClick={() => handleDeleteReport(report.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete from Supabase bucket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
