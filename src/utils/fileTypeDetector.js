/**
 * COAD-X Multi-Factor File Type & Forensic Signature Detector
 * Identifies file categories and formats using magic numbers (file signatures),
 * structural characteristics, MIME types, and filename extensions.
 * Detects and flags file extension / payload signature mismatches.
 */

// Known binary magic byte signatures (in hex)
const SIGNATURES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  GIF: [0x47, 0x49, 0x46, 0x38],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // bytes 0..3: RIFF, bytes 8..11: WEBP
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  ZIP_PK: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP, DOCX, XLSX, etc.)
  ZIP_EMPTY: [0x50, 0x4B, 0x05, 0x06],
  ZIP_SPANNED: [0x50, 0x4B, 0x07, 0x08],
  OLE2_DOC: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // Legacy MS Compound Binary (DOC, XLS)
};

/**
 * Check if a Uint8Array starts with a given byte array
 */
function matchesSignature(bytes, sig) {
  if (!bytes || bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

/**
 * Check if byte array is an unallocated disk slice or slack space interrupted by zero-fill null sectors
 */
function isUnallocatedDiskSlice(bytes) {
  if (!bytes || bytes.length === 0) return false;
  const sampleLen = Math.min(bytes.length, 4096);
  let nullCount = 0;
  let printableCount = 0;

  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if (b === 0x00) {
      nullCount++;
    } else if (
      (b >= 0x20 && b <= 0x7E) || // Printable ASCII
      b === 0x09 || b === 0x0A || b === 0x0D || // Tab, LF, CR
      (b >= 0xC2 && b <= 0xF4) // Valid UTF-8
    ) {
      printableCount++;
    }
  }

  // Must have both null sectors AND significant printable text
  const nonNull = sampleLen - nullCount;
  if (nullCount >= 16 && printableCount >= 20 && (printableCount / Math.max(1, nonNull)) > 0.75) {
    return true;
  }
  return false;
}

/**
 * Check if byte array is valid printable UTF-8 or ASCII text (no binary control nulls)
 */
function isPlainTextBytes(bytes) {
  if (!bytes || bytes.length === 0) return true;
  const sampleLen = Math.min(bytes.length, 1024);
  let nullCount = 0;
  let printableCount = 0;

  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if (b === 0x00) {
      nullCount++;
    } else if (
      (b >= 0x20 && b <= 0x7E) || // Printable ASCII
      b === 0x09 || b === 0x0A || b === 0x0D || // Tab, LF, CR
      (b >= 0xC2 && b <= 0xF4) // Valid UTF-8 leading bytes
    ) {
      printableCount++;
    }
  }

  // If there are null bytes, check if it's an unallocated disk slice
  if (nullCount > 0) {
    return isUnallocatedDiskSlice(bytes);
  }
  return (printableCount / sampleLen) > 0.85;
}

/**
 * Convert first few bytes to hex string for forensic display
 */
export function getHexSignature(bytes, maxLen = 8) {
  if (!bytes || bytes.length === 0) return '00 00 00 00';
  const len = Math.min(bytes.length, maxLen);
  const hex = [];
  for (let i = 0; i < len; i++) {
    hex.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
  }
  return hex.join(' ');
}

/**
 * Deep multi-factor file type detection
 * @param {File|Object} file - File object or metadata
 * @param {Uint8Array|ArrayBuffer} bytes - Raw byte array or buffer of the file
 * @param {string} textPreview - Decoded text string if available
 */
export function detectFileType(file, bytes, textPreview = '') {
  const fileName = file?.name || 'evidence_file';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const declaredMime = file?.type || '';

  // Ensure uint8 is a Uint8Array regardless of whether an ArrayBuffer or Uint8Array was passed
  const uint8 = bytes instanceof Uint8Array
    ? bytes
    : (bytes instanceof ArrayBuffer
        ? new Uint8Array(bytes)
        : (bytes && bytes.buffer instanceof ArrayBuffer
            ? new Uint8Array(bytes.buffer)
            : new Uint8Array(0)));

  const hexSig = getHexSignature(uint8);
  const text = textPreview || (uint8.length > 0 ? new TextDecoder('latin1').decode(uint8.slice(0, 4096)) : '');

  let detectedCategory = 'UNKNOWN';
  let detectedFormat = 'UNKNOWN';
  let reconstructionMode = 'UNSUPPORTED FORMAT';
  let magicSignatureMatch = false;
  let mimeType = declaredMime || 'application/octet-stream';
  let description = 'Unknown binary or unformatted evidence';

  // 1. Check Magic Numbers
  if (matchesSignature(uint8, SIGNATURES.JPEG)) {
    detectedCategory = 'IMAGE';
    detectedFormat = 'JPEG';
    reconstructionMode = 'IMAGE RECONSTRUCTION';
    mimeType = 'image/jpeg';
    magicSignatureMatch = true;
    description = 'Standard JPEG/JFIF image (Magic: FF D8 FF)';
  } else if (matchesSignature(uint8, SIGNATURES.PNG)) {
    detectedCategory = 'IMAGE';
    detectedFormat = 'PNG';
    reconstructionMode = 'IMAGE RECONSTRUCTION';
    mimeType = 'image/png';
    magicSignatureMatch = true;
    description = 'Portable Network Graphics (Magic: 89 50 4E 47)';
  } else if (
    matchesSignature(uint8, SIGNATURES.WEBP_RIFF) &&
    uint8.length >= 12 &&
    uint8[8] === 0x57 && uint8[9] === 0x45 && uint8[10] === 0x42 && uint8[11] === 0x50
  ) {
    detectedCategory = 'IMAGE';
    detectedFormat = 'WEBP';
    reconstructionMode = 'IMAGE RECONSTRUCTION';
    mimeType = 'image/webp';
    magicSignatureMatch = true;
    description = 'WebP Visual Container (Magic: RIFF....WEBP)';
  } else if (
    matchesSignature(uint8, SIGNATURES.PDF) ||
    ext === 'pdf' ||
    declaredMime === 'application/pdf' ||
    (uint8.length > 4 && text.includes('%PDF'))
  ) {
    const hasCleanMagic = matchesSignature(uint8, SIGNATURES.PDF);
    detectedCategory = 'DOCUMENT';
    detectedFormat = 'PDF';
    reconstructionMode = 'PDF STRUCTURAL RECONSTRUCTION';
    mimeType = 'application/pdf';
    magicSignatureMatch = true;
    description = hasCleanMagic
      ? 'Adobe Portable Document Format (Magic: %PDF)'
      : 'Corrupted / Damaged PDF Document (Structural Engine Auto-Repair Active)';
  } else if (
    matchesSignature(uint8, SIGNATURES.ZIP_PK) ||
    matchesSignature(uint8, SIGNATURES.ZIP_EMPTY) ||
    matchesSignature(uint8, SIGNATURES.ZIP_SPANNED)
  ) {
    // Check if this PK container is a DOCX (Office Open XML)
    const isDocxExt = ext === 'docx';
    const hasDocxMarkers = text.includes('word/') ||
      text.includes('[Content_Types].xml') ||
      text.includes('word/document.xml');

    if (isDocxExt || hasDocxMarkers) {
      detectedCategory = 'DOCUMENT';
      detectedFormat = 'DOCX';
      reconstructionMode = 'OFFICE DOCUMENT RECONSTRUCTION';
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      magicSignatureMatch = true;
      description = 'Office Open XML Document Container (Magic: PK 03 04)';
    } else {
      detectedCategory = 'DOCUMENT';
      detectedFormat = 'ZIP';
      reconstructionMode = 'ARCHIVE STRUCTURAL RECONSTRUCTION';
      mimeType = 'application/zip';
      magicSignatureMatch = true;
      description = 'Generic ZIP Compressed Container (Magic: PK 03 04)';
    }
  } else if (matchesSignature(uint8, SIGNATURES.OLE2_DOC) || (ext === 'doc' && !matchesSignature(uint8, SIGNATURES.ZIP_PK))) {
    detectedCategory = 'DOCUMENT';
    detectedFormat = 'DOC';
    reconstructionMode = 'LEGACY BINARY DOCUMENT HANDLING';
    mimeType = 'application/msword';
    magicSignatureMatch = true;
    description = 'Legacy Microsoft Compound Binary Document (Magic: D0 CF 11 E0)';
  } else if (isPlainTextBytes(uint8) || ['txt', 'csv', 'log', 'json', 'xml', 'raw', 'dd', 'slice', 'dat'].includes(ext)) {
    detectedCategory = 'TEXT';
    const trimmedText = text.trim();
    let hasNullRun = false;
    for (let i = 0; i < Math.min(uint8.length - 1, 8192); i++) {
      if (uint8[i] === 0x00 && uint8[i + 1] === 0x00) {
        hasNullRun = true;
        break;
      }
    }

    if (hasNullRun || ['raw', 'dd', 'slice'].includes(ext) || /unallocated|disk slice|carved fragment/i.test(trimmedText)) {
      detectedFormat = 'UNALLOCATED_SLICE';
      reconstructionMode = 'UNALLOCATED DISK SLICE CARVING';
      mimeType = 'text/plain';
      description = 'Unallocated Disk Slice / Slack Space Evidence with Zero-Filled Sectors';
    } else if (ext === 'json' || (trimmedText.startsWith('{') && trimmedText.endsWith('}')) || (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
      detectedFormat = 'JSON';
      reconstructionMode = 'JSON STRUCTURAL RECONSTRUCTION';
      mimeType = 'application/json';
      description = 'JavaScript Object Notation Data Structure';
    } else if (ext === 'xml' || (trimmedText.startsWith('<?xml') || (trimmedText.startsWith('<') && trimmedText.includes('</')))) {
      detectedFormat = 'XML';
      reconstructionMode = 'XML STRUCTURAL RECONSTRUCTION';
      mimeType = 'application/xml';
      description = 'Extensible Markup Language Document Structure';
    } else if (ext === 'csv' || (trimmedText.includes(',') && trimmedText.includes('\n') && !trimmedText.startsWith('{'))) {
      detectedFormat = 'CSV';
      reconstructionMode = 'STRUCTURED TEXT RECONSTRUCTION';
      mimeType = 'text/csv';
      description = 'Comma-Separated Tabular Values';
    } else if (ext === 'log' || /\[\d{4}-\d{2}-\d{2}|\b(INFO|WARN|ERROR|DEBUG)\b/i.test(trimmedText)) {
      detectedFormat = 'LOG';
      reconstructionMode = 'TEXT RECONSTRUCTION';
      mimeType = 'text/plain';
      description = 'Chronological System & Audit Log Records';
    } else {
      detectedFormat = 'TXT';
      reconstructionMode = 'TEXT RECONSTRUCTION';
      mimeType = 'text/plain';
      description = 'Plain Unformatted Text Stream';
    }
    magicSignatureMatch = false;
  }

  // 2. Mismatch Verification: Does extension match detected binary/structural format?
  let isMismatch = false;
  let mismatchDetails = null;

  const imageExts = ['jpg', 'jpeg', 'png', 'webp'];
  const docExts = ['pdf', 'doc', 'docx'];
  const textExts = ['txt', 'csv', 'log', 'json', 'xml'];

  if (ext) {
    if (imageExts.includes(ext) && detectedCategory !== 'IMAGE' && detectedCategory !== 'UNKNOWN') {
      isMismatch = true;
      mismatchDetails = `File extension (.${ext}) conflicts with binary payload signature (${detectedFormat}). Analyzing as structural ${detectedFormat}.`;
    } else if (ext === 'pdf' && detectedFormat !== 'PDF' && detectedCategory !== 'UNKNOWN') {
      isMismatch = true;
      mismatchDetails = `File named with .pdf extension, but byte payload matches ${detectedFormat}. Analyzing as ${detectedFormat}.`;
    } else if (ext === 'docx' && detectedFormat !== 'DOCX' && detectedCategory !== 'UNKNOWN') {
      isMismatch = true;
      mismatchDetails = `File named with .docx extension, but internal structure is ${detectedFormat}.`;
    } else if (textExts.includes(ext) && detectedCategory === 'IMAGE') {
      isMismatch = true;
      mismatchDetails = `Text file extension (.${ext}) disguised over raw ${detectedFormat} image data.`;
    }
  }

  return {
    category: detectedCategory,
    format: detectedFormat,
    fileType: detectedFormat.toLowerCase(),
    detectedType: detectedFormat,
    subType: detectedFormat.toLowerCase(),
    reconstructionMode,
    mimeType,
    isMismatch,
    mismatchDetails,
    hexSignature: hexSig,
    magicBytesHex: hexSig,
    magicSignatureMatch,
    description
  };
}
