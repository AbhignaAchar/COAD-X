/**
 * COAD-X Forensic & Fragment Analysis Engine
 * Pure client-side processing using Web Crypto API and ArrayBuffer scanning.
 */

// Common File Magic Byte Signatures
export const FILE_SIGNATURES = [
  {
    type: 'JPEG Image',
    ext: 'jpg',
    mime: 'image/jpeg',
    magic: [0xFF, 0xD8, 0xFF],
    description: 'Joint Photographic Experts Group raster image format',
    headerHex: 'FF D8 FF'
  },
  {
    type: 'PNG Image',
    ext: 'png',
    mime: 'image/png',
    magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    description: 'Portable Network Graphics lossless raster image format',
    headerHex: '89 50 4E 47 0D 0A 1A 0A'
  },
  {
    type: 'PDF Document',
    ext: 'pdf',
    mime: 'application/pdf',
    magic: [0x25, 0x50, 0x44, 0x46], // %PDF
    description: 'Adobe Portable Document Format',
    headerHex: '25 50 44 46'
  },
  {
    type: 'ZIP Archive',
    ext: 'zip',
    mime: 'application/zip',
    magic: [0x50, 0x4B, 0x03, 0x04], // PK..
    description: 'ZIP compressed archive container',
    headerHex: '50 4B 03 04'
  },
  {
    type: 'GIF Image',
    ext: 'gif',
    mime: 'image/gif',
    magic: [0x47, 0x49, 0x46, 0x38], // GIF8
    description: 'Graphics Interchange Format animated image',
    headerHex: '47 49 46 38'
  },
  {
    type: 'Executable (Windows)',
    ext: 'exe',
    mime: 'application/x-msdownload',
    magic: [0x4D, 0x5A], // MZ
    description: 'DOS/Windows Executable PE format',
    headerHex: '4D 5A'
  },
  {
    type: 'WAV Audio',
    ext: 'wav',
    mime: 'audio/wav',
    magic: [0x52, 0x49, 0x46, 0x46], // RIFF
    description: 'Resource Interchange File Format Audio',
    headerHex: '52 49 46 46'
  }
];

/**
 * Calculate SHA-256 Hash using Web Crypto API
 * @param {Uint8Array|ArrayBuffer} buffer 
 * @returns {Promise<string>} Hex string of hash
 */
export async function calculateSHA256(buffer) {
  try {
    const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Crypto error:', err);
    return 'HASH_CALCULATION_FAILED';
  }
}

/**
 * Scan first bytes against magic signatures
 * @param {Uint8Array} bytes 
 * @param {string} declaredMime 
 * @returns {Object} classification result
 */
export function classifyFileHeader(bytes, declaredMime = '') {
  if (!bytes || bytes.length === 0) {
    return {
      detectedType: 'Empty File',
      confidence: 0,
      matched: false,
      extension: 'unknown',
      headerHex: '00 00 00 00',
      reason: 'No byte data found'
    };
  }

  // Get hex header snippet
  const sampleLength = Math.min(16, bytes.length);
  const headerHex = Array.from(bytes.slice(0, sampleLength))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  for (const sig of FILE_SIGNATURES) {
    let match = true;
    for (let i = 0; i < sig.magic.length; i++) {
      if (i >= bytes.length || bytes[i] !== sig.magic[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      const mimeMatches = declaredMime.toLowerCase().includes(sig.ext);
      return {
        detectedType: sig.type,
        confidence: mimeMatches ? 100 : 95,
        matched: true,
        extension: sig.ext,
        headerHex: sig.headerHex,
        description: sig.description,
        signatureMatch: true
      };
    }
  }

  // Check if UTF-8 plain text
  let isText = true;
  for (let i = 0; i < Math.min(100, bytes.length); i++) {
    const b = bytes[i];
    // Printable ASCII + TAB, LF, CR
    if ((b < 32 || b > 126) && b !== 9 && b !== 10 && b !== 13) {
      isText = false;
      break;
    }
  }

  if (isText && bytes.length > 0) {
    return {
      detectedType: 'Plain Text / Code (ASCII/UTF-8)',
      confidence: 90,
      matched: true,
      extension: 'txt',
      headerHex: headerHex.substring(0, 11),
      description: 'Text document or source script file',
      signatureMatch: false
    };
  }

  return {
    detectedType: 'Unknown / Raw Fragment Binary',
    confidence: 30,
    matched: false,
    extension: 'bin',
    headerHex,
    description: 'Header magic bytes did not match any standard signature dictionary.',
    signatureMatch: false
  };
}

/**
 * Calculate Shannon Entropy of a byte slice (0.0 to 8.0)
 * High entropy (> 7.5) usually indicates compressed or encrypted fragments.
 */
export function calculateEntropy(bytes) {
  if (!bytes || bytes.length === 0) return 0;
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    frequencies[bytes[i]]++;
  }
  let entropy = 0;
  for (let count of frequencies) {
    if (count > 0) {
      const p = count / bytes.length;
      entropy -= p * (Math.log2 ? Math.log2(p) : Math.log(p) / Math.LN2);
    }
  }
  return parseFloat(entropy.toFixed(3));
}

/**
 * Divide file into fragment chunks
 * @param {Uint8Array} bytes 
 * @param {number} chunkSize 
 * @param {boolean} isDemo 
 * @returns {Array} List of fragment metadata objects
 */
export function extractFragments(bytes, chunkSize = 1024, isDemo = false) {
  const fragments = [];
  const totalLength = bytes.length;
  let offset = 0;
  let index = 1;

  while (offset < totalLength) {
    const end = Math.min(offset + chunkSize, totalLength);
    const chunkBytes = bytes.slice(offset, end);
    const entropy = calculateEntropy(chunkBytes);

    fragments.push({
      id: `FRAG-${String(index).padStart(4, '0')}`,
      chunkIndex: index - 1,
      offsetStart: offset,
      offsetEnd: end,
      sizeBytes: chunkBytes.length,
      entropy,
      data: chunkBytes,
      isDemo: isDemo,
      sourceType: isDemo ? 'Demo-Generated Block' : 'Actual Extracted Slice',
      status: 'Intact',
      hexSnippet: Array.from(chunkBytes.slice(0, 16))
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ')
    });

    offset = end;
    index++;
  }

  return fragments;
}

/**
 * Format bytes into standard Hex Editor View (Address | Hex Bytes | ASCII)
 */
export function formatHexView(bytes, bytesPerLine = 16, maxLines = 64) {
  const lines = [];
  const len = Math.min(bytes.length, bytesPerLine * maxLines);

  for (let i = 0; i < len; i += bytesPerLine) {
    const slice = bytes.slice(i, i + bytesPerLine);
    const address = i.toString(16).padStart(8, '0').toUpperCase();

    const hexArr = [];
    const asciiArr = [];

    for (let j = 0; j < bytesPerLine; j++) {
      if (j < slice.length) {
        const b = slice[j];
        hexArr.push(b.toString(16).padStart(2, '0').toUpperCase());
        // ASCII printable range
        asciiArr.push((b >= 32 && b <= 126) ? String.fromCharCode(b) : '.');
      } else {
        hexArr.push('  ');
        asciiArr.push(' ');
      }
    }

    // Split hex in half for readability
    const hexFirst = hexArr.slice(0, 8).join(' ');
    const hexSecond = hexArr.slice(8, 16).join(' ');

    lines.push({
      address,
      hex: `${hexFirst}  ${hexSecond}`,
      ascii: asciiArr.join('')
    });
  }

  return lines;
}
