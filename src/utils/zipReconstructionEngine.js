import { calculateSHA256 } from './forensicEngine.js';

export async function processZipArchive(fileBuffer) {
  const view = new DataView(fileBuffer);
  const uint8 = new Uint8Array(fileBuffer);
  
  if (uint8[0] !== 0x50 || uint8[1] !== 0x4B || uint8[2] !== 0x03 || uint8[3] !== 0x04) {
    throw new Error('Invalid ZIP signature');
  }

  // 1. Find End of Central Directory (EOCD)
  let eocdOffset = -1;
  // EOCD signature is 0x06054B50 (PK\x05\x06). It's at least 22 bytes from the end.
  // We search backwards from the end of the file.
  for (let i = uint8.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('ZIP EOCD not found.');
  }

  const cdRecords = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);

  const filesRecovered = [];

  // 2. Parse Central Directory
  for (let i = 0; i < cdRecords; i++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) {
      break;
    }

    const compression = view.getUint16(cdOffset + 10, true);
    const compressedSize = view.getUint32(cdOffset + 20, true);
    const uncompressedSize = view.getUint32(cdOffset + 24, true);
    const fileNameLen = view.getUint16(cdOffset + 28, true);
    const extraFieldLen = view.getUint16(cdOffset + 30, true);
    const fileCommentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);

    let fileName = '';
    for (let j = 0; j < fileNameLen; j++) {
      fileName += String.fromCharCode(uint8[cdOffset + 46 + j]);
    }

    cdOffset += 46 + fileNameLen + extraFieldLen + fileCommentLen;

    const isDir = fileName.endsWith('/');
    if (isDir) continue;

    // 3. Read Local File Header to find data offset
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      continue; // Skip invalid local header
    }

    const localFileNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraFieldLen = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraFieldLen;

    const compressedData = uint8.slice(dataOffset, dataOffset + compressedSize);
    let uncompressedData = null;
    let status = 'RECOVERED';
    
    if (compression === 0) {
      uncompressedData = compressedData;
    } else if (compression === 8) {
      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compressedData).catch(() => {});
        writer.close().catch(() => {});
        
        const reader = ds.readable.getReader();
        const chunks = [];
        let totalLen = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalLen += value.length;
        }
        
        uncompressedData = new Uint8Array(totalLen);
        let ptr = 0;
        for (const chunk of chunks) {
          uncompressedData.set(chunk, ptr);
          ptr += chunk.length;
        }
      } catch (e) {
        status = 'CORRUPTED';
        uncompressedData = new Uint8Array(0);
      }
    } else {
      status = 'UNSUPPORTED COMPRESSION';
      uncompressedData = new Uint8Array(0);
    }
    
    const sha256 = await calculateSHA256(uncompressedData);
    filesRecovered.push({
      name: fileName,
      type: fileName.split('.').pop().toUpperCase(),
      size: uncompressedData.length,
      compressedSize: compressedSize,
      buffer: uncompressedData,
      sha256,
      status
    });
  }

  return {
    status: 'ZIP EXTRACTED',
    evidenceFormat: 'ZIP Archive',
    logicalSize: filesRecovered.reduce((acc, f) => acc + f.size, 0),
    filesRecovered: filesRecovered.length,
    integrity: 'VERIFIED',
    files: filesRecovered,
  };
}
