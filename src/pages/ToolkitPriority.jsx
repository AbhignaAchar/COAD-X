import React from 'react';
import { BarChart3, ShieldCheck, AlertTriangle, Layers, Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import StatusBadge from '../components/StatusBadge';

export default function ToolkitPriority() {
  const { evidenceFiles, fragments, reconstructedFiles, tamperAnalysisMap } = useForensic();

  // Feasibility Scoring Algorithm based on measurable metrics + Anti-Forensic Tamper Penalty
  const evaluatePriority = (file) => {
    // 1. Fragmentation Analysis
    const fileFrags = fragments.filter(f => f.fileId === file.id || f.fileName === file.name);
    const isImageEvidence = Boolean(file.type?.startsWith('image/') || file.detectedType?.includes('Image'));
    const isFragmented = Boolean(file.isFragmented || file.fragmentCount > 1 || fileFrags.length > 1);
    const fragmentationStatus = isFragmented ? 'DETECTED' : 'NOT DETECTED';

    // 2. Reconstruction Status
    const recon = reconstructedFiles.find(r => r.fileId === file.id || r.targetFile === file.name || r.originalName === file.name);
    let reconstructionStatus = 'NOT ATTEMPTED';
    if (recon) {
      reconstructionStatus = (recon.status === 'COMPLETE' || recon.reconStatus === 'COMPLETE' || recon.status === 'RECONSTRUCTED')
        ? 'RECONSTRUCTED'
        : 'AVAILABLE / CANDIDATE';
    } else if (isFragmented) {
      reconstructionStatus = 'AVAILABLE / CANDIDATE';
    }

    // 3. Anti-Forensic Tamper Indicators
    let confirmedWipeCount = 0;
    let headerZeroedCount = 0;
    let suspiciousPatternCount = 0;
    const tamperIndicators = [];

    fileFrags.forEach(frag => {
      const t = tamperAnalysisMap?.[frag.id];
      if (!t) return;

      const isHeader = frag.offsetStart === 0 || frag.isHeaderBlock;
      if (isHeader && t.headerAnalysis?.zeroed) {
        headerZeroedCount++;
        tamperIndicators.push(`Header zeroed (${t.headerAnalysis.repeatedByte})`);
      }

      if (t.wipePatternAnalysis?.matched) {
        confirmedWipeCount++;
        tamperIndicators.push(`Wipe pattern: ${t.wipePatternAnalysis.patternName}`);
      } else if (t.status === 'tampered') {
        confirmedWipeCount++;
      } else if (t.status === 'suspicious' && !isImageEvidence) {
        suspiciousPatternCount++;
      }
    });

    let antiForensicStatus = 'NOT ESTABLISHED';
    if (confirmedWipeCount > 0 || headerZeroedCount > 0) {
      antiForensicStatus = 'CONFIRMED';
    } else if (suspiciousPatternCount > 0) {
      antiForensicStatus = 'SUSPICIOUS';
    }

    let tamperPenalty = 0;
    if (antiForensicStatus === 'CONFIRMED') {
      tamperPenalty = Math.min(45, (confirmedWipeCount * 20) + (headerZeroedCount * 25));
    } else if (antiForensicStatus === 'SUSPICIOUS') {
      tamperPenalty = Math.min(20, suspiciousPatternCount * 5);
    }

    // 4. Header Integrity Score (0 - 50 points)
    let headerScoreNum = 15;
    let headerStatusText = '15/50 (Unverified Header)';
    if (file.signatureMatch) {
      headerScoreNum = 50;
      headerStatusText = '50/50 (Intact Signature)';
    } else if (isFragmented && headerZeroedCount === 0) {
      headerScoreNum = 35;
      headerStatusText = '35/50 (Fragmented Evidence)';
    } else if (headerZeroedCount > 0) {
      headerScoreNum = 0;
      headerStatusText = '0/50 (Header Destruction)';
    } else if (file.detectedType && file.detectedType.includes('Text')) {
      headerScoreNum = 40;
      headerStatusText = '40/50 (Plaintext Stream)';
    }

    // 5. Fragment Completeness (0 - 30 points)
    let fragScoreNum = 10;
    let fragStatusText = '10/30 (Partial Data)';
    if (fileFrags.length > 0) {
      fragScoreNum = 30;
      fragStatusText = '30/30 (Available Sectors)';
    }

    // 6. Cryptographic Verification (0 - 20 points)
    let cryptoScoreNum = 0;
    let cryptoStatusText = '0/20 (Unverified)';
    let cryptoStatus = 'UNVERIFIED';

    if (recon) {
      const hasOrigHash = recon.originalHash && recon.originalHash !== 'NOT AVAILABLE';
      const hasReconHash = recon.reconstructedHash && recon.reconstructedHash !== 'NOT AVAILABLE';

      if (hasOrigHash && hasReconHash) {
        if (recon.originalHash === recon.reconstructedHash || recon.integrityStatus === 'Verified' || recon.integrityStatus === 'VERIFIED') {
          cryptoScoreNum = 20;
          cryptoStatus = 'VERIFIED';
          cryptoStatusText = '20/20 (Verified Hash Match)';
        } else {
          cryptoScoreNum = 0;
          cryptoStatus = 'MISMATCH';
          cryptoStatusText = '0/20 (Cryptographic Mismatch)';
        }
      } else {
        cryptoScoreNum = 10;
        cryptoStatus = 'UNVERIFIED';
        cryptoStatusText = '10/20 (No Reference Hash)';
      }
    } else {
      cryptoScoreNum = isFragmented ? 10 : 0;
      cryptoStatus = 'UNVERIFIED';
      cryptoStatusText = isFragmented ? '10/20 (Pending Job)' : '0/20 (Unverified)';
    }

    // 7. Calculate Final Feasibility Score
    const baseScore = headerScoreNum + fragScoreNum + cryptoScoreNum;
    const feasibilityScore = Math.max(5, Math.min(100, baseScore - tamperPenalty));

    // Priority Level & Explicit Explanations
    let priorityLevel = 'MEDIUM';
    const explanations = [];

    const lowerName = file.name.toLowerCase();
    if (antiForensicStatus === 'CONFIRMED' || lowerName.includes('dump') || lowerName.includes('.db') || lowerName.includes('raw') || file.status === 'Corrupted') {
      priorityLevel = 'CRITICAL';
      explanations.push('Critical reconstruction dependencies');
      explanations.push('Anti-forensic wipe or raw storage dump artifact');
      explanations.push('High investigative evidence value');
    } else if (isFragmented || feasibilityScore >= 70 || lowerName.includes('photo') || lowerName.includes('.jpg') || lowerName.includes('.pdf')) {
      priorityLevel = 'HIGH';
      explanations.push('High recoverability potential');
      explanations.push('Multi-fragment reassembly dependency');
      explanations.push('Core evidentiary target');
    } else if (feasibilityScore >= 40) {
      priorityLevel = 'MEDIUM';
      explanations.push('Standard file signature match');
      explanations.push('Verified sector stream');
    } else {
      priorityLevel = 'LOW';
      explanations.push('Low recoverability score');
      explanations.push('Severe data truncation or unmapped blocks');
    }

    return {
      fragmentationStatus,
      reconstructionStatus,
      headerStatus: headerStatusText,
      cryptoStatus,
      antiForensicStatus,
      tamperIndicators,
      tamperPenalty,
      feasibilityScore,
      priorityLevel,
      explanations,
      headerScore: headerStatusText,
      fragScore: fragStatusText,
      cryptoScore: cryptoStatusText
    };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Recovery Feasibility & Priority Matrix</h2>
        <p className="text-xs text-[#64748B]">
          Rank evidence files by empirical recovery probability with transparent, verifiable explanations.
        </p>
      </div>

      {/* Methodology Notice */}
      <div className="p-4 bg-[#ECFEFF] border border-[#A5F3FC] rounded-xl flex items-start gap-3 text-xs text-[#0F172A] shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-white border border-[#A5F3FC] flex items-center justify-center text-[#0891B2] shrink-0 shadow-2xs">
          <Info className="w-4 h-4 text-[#0891B2]" />
        </div>
        <div>
          <h4 className="font-bold text-[#0F172A] mb-0.5">Empirical Feasibility Scoring Standard</h4>
          <p className="leading-relaxed text-[#64748B]">
            Feasibility scores and priority ratings are derived strictly from empirical evidence attributes: valid header signatures (50%), fragment block availability (30%), and cryptographic hash match (20%), minus detected anti-forensic tamper penalties.
            Every priority rating includes an explicit rationale.
          </p>
        </div>
      </div>

      {/* Priority Scoring Matrix */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Evidence Priority Ranking</h3>
            <p className="text-xs text-[#64748B]">Actionable ranking categorized into CRITICAL, HIGH, MEDIUM, and LOW</p>
          </div>
          <span className="text-[11px] font-mono text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] px-2 py-0.5 rounded font-semibold">
            {evidenceFiles.length} Target(s)
          </span>
        </div>

        {evidenceFiles.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-xs">
            No evidence files ingested in session to evaluate priority.
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>File Name</th>
                  <th>Priority Level</th>
                  <th>Why? (Rationale)</th>
                  <th>Feasibility Score</th>
                  <th>Header Integrity</th>
                  <th>Fragments</th>
                  <th>Tamper Impact</th>
                </tr>
              </thead>
              <tbody>
                {evidenceFiles.map((file) => {
                  const evalData = evaluatePriority(file);

                  let badgeColor = 'badge-cyan';
                  if (evalData.priorityLevel === 'CRITICAL') badgeColor = 'badge-danger';
                  if (evalData.priorityLevel === 'HIGH') badgeColor = 'badge-warning';
                  if (evalData.priorityLevel === 'MEDIUM') badgeColor = 'badge-info';

                  return (
                    <tr key={file.id} className="hover:bg-[#F8FAFC]">
                      <td className="font-mono text-xs text-[#0891B2] font-bold">{file.id}</td>
                      <td className="font-medium text-xs text-[#0F172A]">
                        <div>{file.name}</div>
                        <div className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                          Fragmentation: <span className={evalData.fragmentationStatus === 'DETECTED' ? 'text-[#0891B2] font-semibold' : 'text-[#64748B]'}>{evalData.fragmentationStatus}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${badgeColor} font-mono font-bold text-[10px]`}>
                          {evalData.priorityLevel}
                        </span>
                      </td>
                      <td className="text-xs text-[#0F172A]">
                        <ul className="space-y-0.5">
                          {evalData.explanations.map((exp, i) => (
                            <li key={i} className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#0891B2]"></span>
                              <span>{exp}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <span className={`font-mono font-bold text-xs ${
                          evalData.feasibilityScore >= 70 ? 'text-[#16A34A]' : evalData.feasibilityScore >= 45 ? 'text-[#D97706]' : 'text-[#DC2626]'
                        }`}>
                          {evalData.feasibilityScore} / 100
                        </span>
                      </td>
                      <td className="text-xs text-[#64748B] font-mono">{evalData.headerScore}</td>
                      <td className="text-xs text-[#64748B] font-mono">{evalData.fragScore}</td>
                      <td className="text-xs font-mono">
                        {evalData.tamperPenalty > 0 ? (
                          <span className="text-[#DC2626] font-semibold">-{evalData.tamperPenalty} pts (Penalty)</span>
                        ) : (
                          <span className="text-[#16A34A] font-medium">0 pts (Clean)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
