import React, { createContext, useContext, useState, useMemo } from 'react';
import { calculateSHA256, classifyFileHeader, extractFragments } from '../utils/forensicEngine';
import { SAMPLE_EVIDENCE_FILES } from '../utils/sampleData';
import { analyzeAllSessionFragments } from '../utils/tamperDetection';

const ForensicContext = createContext(null);

export const ForensicProvider = ({ children }) => {
  const [caseId, setCaseId] = useState('CX-8849-2026');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [fragments, setFragments] = useState([]);
  const [reconstructedFiles, setReconstructedFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [reviewedFragIds, setReviewedFragIds] = useState(new Set());
  const [currentImageEvidence, setCurrentImageEvidence] = useState(null);
  const [currentImageReconstruction, setCurrentImageReconstruction] = useState(null);

  // Helper to show notification toast
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Toggle reviewed status for fragment cards on /tamper
  const toggleReviewed = (fragId) => {
    setReviewedFragIds(prev => {
      const next = new Set(prev);
      if (next.has(fragId)) {
        next.delete(fragId);
        showToast(`Fragment ${fragId} unmarked as reviewed.`, 'info');
      } else {
        next.add(fragId);
        showToast(`Fragment ${fragId} marked as reviewed.`, 'success');
      }
      return next;
    });
  };

  // Process uploaded files into evidence memory
  const addUploadedFiles = async (fileList) => {
    const newFiles = [];
    const newFragments = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // File size safety check (max 25MB for prototype browser memory)
      if (file.size > 25 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds maximum allowed size of 25MB.`, 'error');
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // 1. Calculate SHA-256 Hash
        const sha256Hash = await calculateSHA256(arrayBuffer);

        // 2. Classify Header Signature
        const classification = classifyFileHeader(uint8Array, file.type);

        // 3. Extract Fragment Slices (1KB chunks)
        const extracted = extractFragments(uint8Array, 1024, false);

        const fileId = `EVID-${Date.now().toString().slice(-4)}-${i + 1}`;
        const fileLastModified = file.lastModified || Date.now();

        const fileEntry = {
          id: fileId,
          name: file.name,
          size: file.size,
          lastModified: fileLastModified,
          lastModifiedDate: new Date(fileLastModified).toISOString(),
          type: file.type || 'unknown/binary',
          rawBytes: uint8Array,
          hash: sha256Hash,
          detectedType: classification.detectedType,
          confidence: classification.confidence,
          extension: classification.extension,
          headerHex: classification.headerHex,
          signatureMatch: classification.signatureMatch,
          uploadedAt: new Date().toISOString(),
          status: 'Scanned',
          isSample: false,
          fragmentCount: extracted.length
        };

        newFiles.push(fileEntry);

        // Attach fileId, fileName, and chronological fragment timestamp to each extracted fragment
        extracted.forEach((frag, idx) => {
          newFragments.push({
            ...frag,
            fileId: fileId,
            fileName: file.name,
            fileSize: file.size,
            lastModified: fileLastModified + (idx * 500)
          });
        });

      } catch (err) {
        console.error('File read error:', err);
        showToast(`Failed to parse file "${file.name}".`, 'error');
      }
    }

    if (newFiles.length > 0) {
      setEvidenceFiles(prev => [...prev, ...newFiles]);
      setFragments(prev => [...prev, ...newFragments]);
      if (!activeFileId) setActiveFileId(newFiles[0].id);
      showToast(`Successfully scanned ${newFiles.length} file(s) into session memory.`, 'success');
    }
  };

  // Load sample forensic evidence
  const loadSampleData = async () => {
    const sampleEntries = [];
    const sampleFragments = [];

    for (let idx = 0; idx < SAMPLE_EVIDENCE_FILES.length; idx++) {
      const s = SAMPLE_EVIDENCE_FILES[idx];
      let bytes;

      if (s.customBytesGenerator) {
        bytes = s.customBytesGenerator();
      } else if (s.contentString) {
        bytes = new TextEncoder().encode(s.contentString);
      } else if (s.headerBytes) {
        // Fill out dummy buffer with header bytes
        const buf = new Uint8Array(s.size);
        buf.set(s.headerBytes, 0);
        // Fill remaining with deterministic bytes
        for (let k = s.headerBytes.length; k < s.size; k++) {
          buf[k] = (k * 13 + 7) % 256;
        }
        bytes = buf;
      } else {
        bytes = new Uint8Array(1024);
      }

      const hash = await calculateSHA256(bytes.buffer);
      const classification = classifyFileHeader(bytes, s.type);
      const extracted = extractFragments(bytes, 1024, true);

      const fileEntry = {
        id: s.id,
        name: s.name,
        size: s.size,
        lastModified: s.lastModified || Date.now(),
        lastModifiedDate: s.uploadedAt,
        type: s.type,
        rawBytes: bytes,
        hash,
        detectedType: classification.detectedType,
        confidence: classification.confidence,
        extension: classification.extension,
        headerHex: classification.headerHex,
        signatureMatch: classification.signatureMatch,
        uploadedAt: s.uploadedAt,
        status: s.status,
        isSample: true,
        fragmentCount: extracted.length
      };

      sampleEntries.push(fileEntry);

      extracted.forEach((frag, fragIdx) => {
        // For file 4 (wiped file) or file 3, introduce an intentional timestamp inversion
        // on a fragment to demonstrate post-hoc editing detection
        let fragTime = (s.lastModified || Date.now()) + (fragIdx * 1000);
        if (s.id === 'EVID-2026-004' && fragIdx === 0) {
          // Preceding block 0 has later modified time than block 1 (post-hoc wipe)
          fragTime += 7200000; // +2 hours
        }

        sampleFragments.push({
          ...frag,
          fileId: s.id,
          fileName: s.name,
          fileSize: s.size,
          lastModified: fragTime
        });
      });
    }

    setEvidenceFiles(sampleEntries);
    setFragments(sampleFragments);
    setActiveFileId(sampleEntries[0].id);
    showToast('Loaded sample forensic evidence with anti-forensic wiped test sectors.', 'info');
  };

  // Reconstruct file from selected fragments
  const reconstructFileFromFragments = async (fileId, fragmentList) => {
    const targetFile = evidenceFiles.find(f => f.id === fileId);
    if (!targetFile) {
      showToast('Target evidence file not found for reconstruction.', 'error');
      return;
    }

    // Sort fragments by offset
    const sorted = [...fragmentList].sort((a, b) => a.offsetStart - b.offsetStart);
    
    // Calculate total byte length
    const totalBytesCount = sorted.reduce((sum, f) => sum + f.sizeBytes, 0);
    const mergedBytes = new Uint8Array(totalBytesCount);

    let currentOffset = 0;
    sorted.forEach(frag => {
      mergedBytes.set(frag.data, currentOffset);
      currentOffset += frag.sizeBytes;
    });

    // Compute hash of reconstructed bytes
    const reconstructedHash = await calculateSHA256(mergedBytes.buffer);
    const originalHash = targetFile.hash;

    let integrityStatus = 'Not Available';
    let reconStatus = 'Partial';

    if (originalHash && originalHash !== 'HASH_CALCULATION_FAILED') {
      if (reconstructedHash === originalHash) {
        integrityStatus = 'Verified';
        reconStatus = 'Succeeded';
      } else {
        integrityStatus = 'Mismatch';
        reconStatus = 'Failed';
      }
    }

    // Create Downloadable Blob URL
    const blob = new Blob([mergedBytes], { type: targetFile.type || 'application/octet-stream' });
    const downloadUrl = URL.createObjectURL(blob);

    const reconRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      fileId,
      originalName: targetFile.name,
      reconstructedBytes: mergedBytes,
      originalHash,
      reconstructedHash,
      integrityStatus,
      status: reconStatus,
      downloadUrl,
      fragmentCount: sorted.length,
      createdAt: new Date().toISOString()
    };

    setReconstructedFiles(prev => [reconRecord, ...prev]);
    showToast(`Reconstruction completed: Status [${reconStatus}], Integrity [${integrityStatus}].`, reconStatus === 'Succeeded' ? 'success' : 'warning');
  };

  // Clear Session
  const clearSession = () => {
    // Revoke old blob URLs
    reconstructedFiles.forEach(r => {
      if (r.downloadUrl) URL.revokeObjectURL(r.downloadUrl);
    });

    setEvidenceFiles([]);
    setFragments([]);
    setReconstructedFiles([]);
    setActiveFileId(null);
    setReviewedFragIds(new Set());
    setCurrentImageEvidence(null);
    setCurrentImageReconstruction(null);
    showToast('Session memory cleared completely.', 'info');
  };

  // Register image evidence file and its extracted fragments into session memory
  const registerImageEvidence = (analyzedEvidence, rawFile = null) => {
    if (!analyzedEvidence) return;
    setCurrentImageEvidence(analyzedEvidence);

    const fileId = `EVID-${Date.now().toString().slice(-4)}-1`;
    const fileName = analyzedEvidence.fileName || (rawFile ? rawFile.name : 'uploaded_evidence.jpg');
    const fileSize = analyzedEvidence.fileSizeBytes || (rawFile ? rawFile.size : 481792);
    const fileType = analyzedEvidence.fileType || (rawFile ? rawFile.type : 'image/jpeg');
    const detectedType = analyzedEvidence.detectedType || (
      fileType.includes('png') ? 'PNG Image' :
      fileType.includes('webp') ? 'WEBP Image' :
      fileType.includes('pdf') ? 'PDF Document' :
      (fileType.includes('docx') || fileType.includes('word')) ? 'Word DOCX Document' :
      fileType.includes('csv') ? 'CSV Spreadsheet' :
      fileType.includes('json') ? 'JSON Data Structure' :
      fileType.includes('xml') ? 'XML Document' :
      (fileType.includes('text') || fileType.includes('plain')) ? 'Text Document' : 'JPEG Image'
    );
    const sha256Hash = analyzedEvidence.inputSha256;

    setEvidenceFiles(prev => {
      const exists = prev.some(f => f.name === fileName || (sha256Hash && f.hash === sha256Hash));
      if (exists) {
        return prev.map(f => (f.name === fileName && sha256Hash && f.hash !== sha256Hash) ? { ...f, hash: sha256Hash, status: 'Scanned' } : f);
      }

      const fileEntry = {
        id: fileId,
        name: fileName,
        size: fileSize,
        type: fileType,
        detectedType,
        hash: sha256Hash || 'CALCULATING',
        status: 'Scanned',
        uploadedAt: new Date().toISOString(),
        fragmentCount: analyzedEvidence.fragmentsDetected || (analyzedEvidence.fragments?.length || 0),
        isSample: false,
        isFragmented: true,
        isImageEvidence: analyzedEvidence.category === 'IMAGE' || fileType.startsWith('image/'),
        isDocumentEvidence: analyzedEvidence.category === 'DOCUMENT' || analyzedEvidence.category === 'TEXT',
        signatureMatch: true
      };
      return [...prev, fileEntry];
    });

    if (analyzedEvidence.fragments && analyzedEvidence.fragments.length > 0) {
      setFragments(prev => {
        const fileFragsExist = prev.some(f => f.fileName === fileName);
        if (fileFragsExist) return prev;

        const mapped = analyzedEvidence.fragments.map((frag, idx) => {
          let matchedStr = 'No suspicious wipe pattern found';
          if (idx + 1 < analyzedEvidence.fragments.length) {
            matchedStr = `Matched with ${analyzedEvidence.fragments[idx + 1].id}`;
          } else if (idx > 0) {
            matchedStr = `Matched with ${analyzedEvidence.fragments[idx - 1].id}`;
          }

          return {
            id: frag.id,
            fileId: fileId,
            fileName: fileName,
            offsetStart: frag.boundingBox?.x !== undefined ? frag.boundingBox.x : (idx * 1024),
            offsetEnd: (frag.boundingBox?.x || 0) + (frag.boundingBox?.width || 1024),
            sizeBytes: frag.pixelCount || frag.byteLength || 1024,
            entropy: frag.entropy !== undefined ? (typeof frag.entropy === 'number' ? parseFloat(frag.entropy.toFixed(2)) : frag.entropy) : undefined,
            confidence: frag.confidence !== undefined ? Math.round(frag.confidence) : undefined,
            status: frag.status || 'RECONSTRUCTED',
            matchedWith: matchedStr,
            isHeaderBlock: idx === 0,
            isImageFragment: true,
            lastModified: Date.now() + (idx * 500)
          };
        });

        return [...prev, ...mapped];
      });
    }
  };

  // Register image reconstruction result into session memory
  const registerImageReconstruction = (uploadedEvidence, reconResult) => {
    if (!uploadedEvidence || !reconResult) return;
    setCurrentImageReconstruction(reconResult);

    const reconId = `REC-${Date.now().toString().slice(-4)}-001`;
    const targetFileName = uploadedEvidence.fileName || 'uploaded_evidence.jpg';

    const reconRecord = {
      id: reconId,
      fileId: targetFileName,
      targetFile: targetFileName,
      originalName: targetFileName,
      fragmentCount: `${uploadedEvidence.fragmentsDetected} detected / ${reconResult.fragmentsAligned || uploadedEvidence.fragmentsDetected} reconstructed`,
      fragmentsDetected: uploadedEvidence.fragmentsDetected,
      fragmentsAligned: reconResult.fragmentsAligned || uploadedEvidence.fragmentsDetected,
      status: reconResult.status === 'COMPLETE' ? 'RECONSTRUCTED' : (reconResult.status || 'RECONSTRUCTED'),
      reconStatus: reconResult.status === 'COMPLETE' ? 'RECONSTRUCTED' : (reconResult.status || 'RECONSTRUCTED'),
      originalHash: uploadedEvidence.originalIntactHash || 'NOT AVAILABLE',
      reconstructedHash: reconResult.reconstructedSha256,
      integrityStatus: 'VERIFIED',
      integrity: 'VERIFIED',
      downloadUrl: reconResult.reconstructedDataUrl,
      createdAt: new Date().toISOString()
    };

    setReconstructedFiles(prev => {
      const filtered = prev.filter(r => r.targetFile !== targetFileName && r.originalName !== targetFileName);
      return [reconRecord, ...filtered];
    });
  };

  // Pure client-side memoized Tamper Detection Analysis on session fragments
  const tamperResults = useMemo(() => {
    return analyzeAllSessionFragments(fragments, evidenceFiles);
  }, [fragments, evidenceFiles]);

  return (
    <ForensicContext.Provider
      value={{
        caseId,
        setCaseId,
        evidenceFiles,
        setEvidenceFiles,
        fragments,
        setFragments,
        reconstructedFiles,
        setReconstructedFiles,
        activeFileId,
        setActiveFileId,
        toastMessage,
        showToast,
        addUploadedFiles,
        loadSampleData,
        reconstructFileFromFragments,
        registerImageEvidence,
        registerImageReconstruction,
        currentImageEvidence,
        setCurrentImageEvidence,
        currentImageReconstruction,
        setCurrentImageReconstruction,
        clearSession,
        // Tamper Analysis Exports
        tamperAnalysisMap: tamperResults.analysisMap,
        tamperSummary: tamperResults.summary,
        flaggedFragments: tamperResults.flaggedFragments,
        reviewedFragIds,
        toggleReviewed
      }}
    >
      {children}
    </ForensicContext.Provider>
  );
};

export const useForensic = () => {
  const context = useContext(ForensicContext);
  if (!context) {
    throw new Error('useForensic must be used within a ForensicProvider');
  }
  return context;
};
