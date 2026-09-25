/**
 * Sample Forensic Evidence Data Generator for COAD-X Demo
 * Includes realistic natural files, partially corrupted files, and deliberate anti-forensic wiped fragments.
 */

// Helper to generate pseudo-random high entropy bytes (>7.8) with low variance
function generateHighEntropyWipeBytes(size, patternByte = null, zeroHeaderLen = 0) {
  const bytes = new Uint8Array(size);
  
  // Optional zeroed header
  if (zeroHeaderLen > 0) {
    bytes.fill(0x00, 0, zeroHeaderLen);
  }

  const start = zeroHeaderLen;
  if (patternByte !== null) {
    // Fill with pattern byte or slight noise
    for (let i = start; i < size; i++) {
      // 94% pattern match, 6% slight noise
      if ((i * 7 + 3) % 17 === 0) {
        bytes[i] = (patternByte ^ 0x0F) & 0xFF;
      } else {
        bytes[i] = patternByte;
      }
    }
  } else {
    // Uniform high entropy pseudo-random distribution
    let seed = 42;
    for (let i = start; i < size; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      bytes[i] = seed & 0xFF;
    }
  }

  return bytes;
}

export const SAMPLE_EVIDENCE_FILES = [
  {
    id: 'EVID-2026-001',
    name: 'intercepted_flight_manifest.txt',
    size: 2450,
    type: 'text/plain',
    uploadedAt: new Date(Date.now() - 3600000).toISOString(),
    lastModified: Date.now() - 3600000,
    status: 'Scanned',
    contentString: `=== COAD-X CONFIDENTIAL DATA RECOVERY DEMO ===
CASE REFERENCE: FORENSIC-88291
SUBJECT: Recovered telemetry and payload manifest.

LATITUDE: 34.0522 N
LONGITUDE: 118.2437 W
STATUS: VERIFIED
SIGNATURE KEY: 0x99A817F20B

FRAGMENT SUMMARY:
All 3 primary blocks located across sectors 402..405.
Integrity score: 100%. Reassembled file matches original cryptographic hash.
=== END TRANSMISSION ===`,
    isSample: true
  },
  {
    id: 'EVID-2026-002',
    name: 'cyber_crime_evidence_header.png',
    size: 8192,
    type: 'image/png',
    uploadedAt: new Date(Date.now() - 7200000).toISOString(),
    lastModified: Date.now() - 7200000,
    status: 'Reconstructed',
    // PNG Magic header bytes: 89 50 4E 47 0D 0A 1A 0A
    headerBytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52],
    isSample: true
  },
  {
    id: 'EVID-2026-003',
    name: 'partially_corrupt_logs.pdf',
    size: 14320,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 10800000).toISOString(),
    lastModified: Date.now() - 10800000,
    status: 'Partial',
    // PDF Magic header bytes: %PDF
    headerBytes: [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A],
    isSample: true
  },
  {
    id: 'EVID-2026-004',
    name: 'coad_covert_ops_secure_wipe.dat',
    size: 6144, // 6 x 1KB blocks
    type: 'application/octet-stream',
    uploadedAt: new Date(Date.now() - 1800000).toISOString(),
    lastModified: Date.now() - 1800000,
    status: 'Flagged',
    isSample: true,
    // Specially generated raw bytes exhibiting intentional anti-forensic secure wiping
    customBytesGenerator: () => {
      const fullBuffer = new Uint8Array(6144);

      // Block 0: Header wiped with 100% zeroed bytes (128/128 bytes 0x00), followed by uniform high-entropy pseudo-random bytes
      const b0 = fullBuffer.subarray(0, 1024);
      b0.fill(0x00, 0, 128); // 100% zeroed header
      let seed0 = 1337;
      for (let i = 128; i < 1024; i++) {
        seed0 = (seed0 * 1664525 + 1013904223) >>> 0;
        b0[i] = seed0 & 0xFF;
      }

      // Block 1: DoD 5220.22-M Pass 3 repeating 0x96 pattern (92% similarity)
      const b1 = fullBuffer.subarray(1024, 2048);
      for (let i = 0; i < 1024; i++) {
        b1[i] = (i % 13 === 0) ? (0x96 ^ 0x0F) : 0x96; // 92% match to DoD Pass 3
      }

      // Block 2: Gutmann Pass 5 repeating 0x55 pattern (94% match)
      const b2 = fullBuffer.subarray(2048, 3072);
      for (let i = 0; i < 1024; i++) {
        b2[i] = (i % 16 === 0) ? 0x00 : 0x55;
      }

      // Block 3: High entropy uniform pseudo-random wipe block
      const b3 = fullBuffer.subarray(3072, 4096);
      let seed3 = 98765;
      for (let i = 0; i < 1024; i++) {
        seed3 = (seed3 * 1664525 + 1013904223) >>> 0;
        b3[i] = seed3 & 0xFF;
      }

      // Block 4: DoD 5220.22-M Pass 2 (0xFF) fill
      const b4 = fullBuffer.subarray(4096, 5120);
      for (let i = 0; i < 1024; i++) {
        b4[i] = (i % 20 === 0) ? 0xEE : 0xFF;
      }

      // Block 5: NIST 800-88 Zero pass fill
      const b5 = fullBuffer.subarray(5120, 6144);
      b5.fill(0x00);

      return fullBuffer;
    }
  }
];
