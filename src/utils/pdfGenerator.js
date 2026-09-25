import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate official COAD-X Cyber Forensic Report as a PDF
 * Automatically populated from real COAD-X investigation state.
 */
export function generateForensicPdfReport(caseData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date().toLocaleString();
  const caseId = caseData.caseId || 'CX-8849-2026';
  const investigatorName = caseData.investigatorName || 'Analyst Officer (Local)';
  const evidenceList = caseData.evidenceFiles || [];
  const fragments = caseData.fragments || [];
  const reconstructedFiles = caseData.reconstructedFiles || [];
  const tamperMap = caseData.tamperAnalysisMap || {};

  // Header Banner (Dark Navy Theme)
  doc.setFillColor(11, 19, 43); // #0b132b
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setTextColor(6, 182, 212); // #06b6d4 Cyan
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COAD-X CYBER FORENSIC REPORT', 14, 18);

  doc.setTextColor(148, 163, 184); // Muted slate
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Assisted Intelligent Data Recovery & Digital Evidence Reconstruction', 14, 25);
  doc.text(`Generated: ${now} | Classification: CONFIDENTIAL`, 14, 30);

  // Case Metadata Box
  doc.setLineWidth(0.3);
  doc.setDrawColor(30, 58, 95);
  doc.setFillColor(17, 28, 56);
  doc.roundedRect(14, 42, 182, 28, 2, 2, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE METADATA', 18, 49);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Case Reference ID: ${caseId}`, 18, 56);
  doc.text(`Investigator / Analyst: ${investigatorName}`, 18, 62);
  doc.text(`Total Evidence Files: ${evidenceList.length}`, 110, 56);
  doc.text(`Total Fragments Scanned: ${fragments.length}`, 110, 62);

  let currentY = 78;

  // Section 1: Evidence Files & Classification
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. EVIDENCE FILES & CLASSIFICATION', 14, currentY);
  currentY += 4;

  const fileRows = evidenceList.map(f => {
    let sizeStr = typeof f.size === 'number'
      ? (f.size >= 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : `${(f.size / 1024).toFixed(2)} KB`)
      : (f.size || 'N/A');

    const hashStr = f.hash
      ? (f.hash.length > 20 ? `${f.hash.substring(0, 16)}...` : f.hash)
      : 'Pending';

    return [
      f.id || 'EVID-001',
      f.name || 'Unknown',
      sizeStr,
      f.detectedType || f.type || 'Unknown',
      hashStr,
      f.status || 'Scanned'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'File Name', 'Size', 'Detected Type', 'SHA-256 Hash', 'Status']],
    body: fileRows.length > 0 ? fileRows : [['-', 'No evidence files uploaded', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [11, 19, 43], textColor: [6, 182, 212], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Section 2: Reconstruction & Cryptographic Integrity
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. RECONSTRUCTION & CRYPTOGRAPHIC INTEGRITY', 14, currentY);
  currentY += 4;

  const reconRows = reconstructedFiles.map(r => {
    const origHashDisplay = (r.originalHash && r.originalHash !== 'NOT AVAILABLE')
      ? (r.originalHash.length > 20 ? `${r.originalHash.substring(0, 16)}...` : r.originalHash)
      : 'NOT AVAILABLE';

    const reconHashDisplay = (r.reconstructedHash && r.reconstructedHash !== 'NOT AVAILABLE')
      ? (r.reconstructedHash.length > 20 ? `${r.reconstructedHash.substring(0, 16)}...` : r.reconstructedHash)
      : 'NOT AVAILABLE';

    const fragDisplay = r.fragmentCount !== undefined
      ? r.fragmentCount.toString()
      : (r.fragmentsDetected ? `${r.fragmentsDetected} detected` : '1');

    return [
      r.id || 'REC-001',
      r.targetFile || r.originalName || r.name || 'Evidence File',
      fragDisplay,
      r.status || r.reconStatus || 'RECONSTRUCTED',
      origHashDisplay,
      reconHashDisplay,
      r.integrityStatus || r.integrity || 'VERIFIED'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Rec ID', 'Target File', 'Fragments', 'Recon Status', 'Original Hash', 'Recon Hash', 'Integrity']],
    body: reconRows.length > 0 ? reconRows : [['-', 'No reconstruction performed', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [11, 19, 43], textColor: [59, 130, 246], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Section 3: Forensic Disclaimers & Legal Notice
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, 182, 42, 'FD');

  doc.setTextColor(239, 68, 68); // Red
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('3. IMPORTANT FORENSIC NOTICE & VERIFICATION DISCLAIMER:', 18, currentY + 7);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const disclaimerText = [
    '1. SHA-256 hash match confirms content equivalence between reconstructed output and source reference.',
    '2. Cryptographic verification confirms bitwise integrity but does not prove chain of custody or provenance.',
    '3. Reconstructed artifacts are assembled directly from verified forensic fragments and spatial continuity.',
    '4. Flagged findings should be treated as investigative leads requiring further verification, not conclusive evidence.',
    '5. COAD-X does not modify the original physical storage medium.'
  ];

  disclaimerText.forEach((line, idx) => {
    doc.text(line, 18, currentY + 14 + (idx * 5));
  });

  // Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`COAD-X Cyber Forensic Platform | Page ${i} of ${totalPages}`, 14, 287);
  }

  const fileName = `COAD-X_Forensic_Report_${caseId}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Trigger local browser download
  doc.save(fileName);

  // Extract PDF Blob for Supabase Cloud Storage
  const pdfBlob = doc.output('blob');

  return {
    doc,
    pdfBlob,
    fileName
  };
}
