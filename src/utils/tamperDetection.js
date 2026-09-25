/**
 * COAD-X Tamper & Anti-Forensic Detection Engine
 * Real byte-level mathematical algorithms to distinguish natural disk corruption
 * from deliberate anti-forensic activity (secure deletion, header wiping, timestamp tampering).
 */

import { calculateEntropy } from './forensicEngine';

// Known secure-delete reference patterns (DoD 5220.22-M, Gutmann, NIST, Schneier)
export const KNOWN_WIPE_PATTERNS = [
  {
    name: 'DoD 5220.22-M pass 1 (0x00)',
    shortName: 'DoD 5220.22-M pass 1',
    standard: 'DoD 5220.22-M',
    pass: 1,
    pattern: [0x00],
    description: 'Fixed single-character zero wipe pass'
  },
  {
    name: 'DoD 5220.22-M pass 2 (0xFF)',
    shortName: 'DoD 5220.22-M pass 2',
    standard: 'DoD 5220.22-M',
    pass: 2,
    pattern: [0xFF],
    description: 'Bitwise complement one-fill pass'
  },
  {
    name: 'DoD 5220.22-M pass 3 (0x96)',
    shortName: 'DoD 5220.22-M pass 3',
    standard: 'DoD 5220.22-M',
    pass: 3,
    pattern: [0x96], // 10010110 binary
    description: 'DoD standard pseudo-random fixed character pass'
  },
  {
    name: 'Gutmann pass 5 (0x55)',
    shortName: 'Gutmann pass 5',
    standard: 'Gutmann 35-Pass',
    pass: 5,
    pattern: [0x55], // 01010101 binary
    description: 'Mnemonic flux transition suppression pattern'
  },
  {
    name: 'Gutmann pass 6 (0xAA)',
    shortName: 'Gutmann pass 6',
    standard: 'Gutmann 35-Pass',
    pass: 6,
    pattern: [0xAA], // 10101010 binary
    description: 'Alternating bit pattern pass'
  },
  {
    name: 'Gutmann pass 7 (0x92 0x49 0x24)',
    shortName: 'Gutmann pass 7',
    standard: 'Gutmann 35-Pass',
    pass: 7,
    pattern: [0x92, 0x49, 0x24],
    description: 'RLL (1,7) encoding sequence wipe'
  },
  {
    name: 'Gutmann pass 8 (0x49 0x24 0x92)',
    shortName: 'Gutmann pass 8',
    standard: 'Gutmann 35-Pass',
    pass: 8,
    pattern: [0x49, 0x24, 0x92],
    description: 'RLL (1,7) phase-shifted wipe pass'
  },
  {
    name: 'Gutmann pass 9 (0x24 0x92 0x49)',
    shortName: 'Gutmann pass 9',
    standard: 'Gutmann 35-Pass',
    pass: 9,
    pattern: [0x24, 0x92, 0x49],
    description: 'RLL (1,7) cyclic wipe sequence'
  },
  {
    name: 'NIST SP 800-88 Clear (0x00)',
    shortName: 'NIST 800-88 Clear',
    standard: 'NIST SP 800-88 Rev 1',
    pass: 1,
    pattern: [0x00],
    description: 'Logical overwrite sanitize pass'
  },
  {
    name: 'Schneier 7-Pass (0x00/0xFF)',
    shortName: 'Schneier 7-Pass',
    standard: 'Bruce Schneier Algorithm',
    pass: 1,
    pattern: [0x00],
    description: 'Fixed character overwrite pass'
  }
];

/**
 * 1. calculateEntropyUniformity(blocks, targetFragIndex, rawBytes)
 * 
 * Natural corruption -> entropy varies block to block (irregular).
 * Secure-delete wipes -> entropy is uniformly high (>7.8) with very low variance (stddev < 0.15)
 * across consecutive blocks.
 * 
 * Computes standard deviation of entropy across a sliding window of consecutive blocks (e.g. 8 blocks).
 * Also inspects intra-fragment sub-slices when isolated fragments are evaluated.
 * 
 * @param {Array} blocks Array of { offsetStart, offsetEnd, entropy, data? }
 * @param {number} targetIndex Index of the specific block being evaluated
 * @param {Uint8Array} rawBytes Raw byte array of the fragment (for sub-block evaluation)
 * @returns {Object} { suspicious: bool, meanEntropy, stddev, windowOffsetRange, details }
 */
export function calculateEntropyUniformity(blocks = [], targetIndex = 0, rawBytes = null) {
  // If we have an array of blocks across the file
  if (blocks && blocks.length >= 2) {
    const windowSize = Math.min(8, blocks.length);
    const n = blocks.length;

    let bestWindow = null;
    let minStdDev = Infinity;
    let flaggedWindow = null;

    // Slide window across blocks
    for (let i = 0; i <= n - windowSize; i++) {
      const windowBlocks = blocks.slice(i, i + windowSize);
      
      // Check if this window includes targetIndex
      const coversTarget = targetIndex >= i && targetIndex < (i + windowSize);

      const sum = windowBlocks.reduce((acc, b) => acc + (b.entropy || 0), 0);
      const mean = sum / windowSize;
      const variance = windowBlocks.reduce((acc, b) => acc + Math.pow((b.entropy || 0) - mean, 2), 0) / windowSize;
      const stddev = Math.sqrt(variance);

      const isSuspicious = mean > 7.8 && stddev < 0.15;

      const windowMeta = {
        mean: parseFloat(mean.toFixed(2)),
        stddev: parseFloat(stddev.toFixed(3)),
        suspicious: isSuspicious,
        startIndex: i,
        endIndex: i + windowSize - 1,
        startOffset: windowBlocks[0].offsetStart || 0,
        endOffset: windowBlocks[windowBlocks.length - 1].offsetEnd || 0
      };

      if (isSuspicious && coversTarget) {
        flaggedWindow = windowMeta;
        break;
      }

      if (coversTarget && stddev < minStdDev) {
        minStdDev = stddev;
        bestWindow = windowMeta;
      }
    }

    const resultWindow = flaggedWindow || bestWindow;
    if (resultWindow) {
      return {
        suspicious: resultWindow.suspicious,
        meanEntropy: resultWindow.mean,
        stddev: resultWindow.stddev,
        windowOffsetRange: [resultWindow.startOffset, resultWindow.endOffset],
        details: resultWindow.suspicious
          ? `Entropy: ${resultWindow.mean} (σ ${resultWindow.stddev} — abnormal wipe variance across ${windowSize} blocks)`
          : `Entropy: ${resultWindow.mean} (σ ${resultWindow.stddev} — normal variance)`
      };
    }
  }

  // Fallback: If isolated fragment with rawBytes, analyze intra-fragment sub-slices (8 slices of 128 bytes)
  if (rawBytes && rawBytes.length >= 256) {
    const sliceCount = 8;
    const sliceSize = Math.floor(rawBytes.length / sliceCount);
    const subEntropies = [];

    for (let s = 0; s < sliceCount; s++) {
      const slice = rawBytes.slice(s * sliceSize, (s + 1) * sliceSize);
      subEntropies.push(calculateEntropy(slice));
    }

    const sum = subEntropies.reduce((a, b) => a + b, 0);
    const mean = sum / sliceCount;
    const variance = subEntropies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sliceCount;
    const stddev = Math.sqrt(variance);
    const suspicious = mean > 7.8 && stddev < 0.15;

    return {
      suspicious,
      meanEntropy: parseFloat(mean.toFixed(2)),
      stddev: parseFloat(stddev.toFixed(3)),
      windowOffsetRange: [0, rawBytes.length],
      details: suspicious
        ? `Entropy: ${mean.toFixed(2)} (σ ${stddev.toFixed(2)} — abnormal intra-sector uniformity)`
        : `Entropy: ${mean.toFixed(2)} (σ ${stddev.toFixed(2)} — normal)`
    };
  }

  // Single block without enough context
  const singleEntropy = blocks && blocks[targetIndex] ? blocks[targetIndex].entropy : (rawBytes ? calculateEntropy(rawBytes) : 0);
  return {
    suspicious: singleEntropy > 7.85,
    meanEntropy: parseFloat(singleEntropy.toFixed(2)),
    stddev: 0.2,
    windowOffsetRange: [0, 1024],
    details: `Entropy: ${singleEntropy.toFixed(2)} (single sector estimation)`
  };
}

/**
 * 2. checkHeaderZeroing(fragmentBytes, inspectLength = 128)
 * 
 * Check if header bytes are a single repeated value (all 0x00, all 0xFF,
 * or any single repeated byte) across >90% of header length.
 * Inconsistent with natural corruption; highly consistent with deliberate wiping.
 * 
 * @param {Uint8Array} fragmentBytes 
 * @param {number} inspectLength Length to inspect (default 128 bytes)
 * @returns {Object} { zeroed: bool, repeatedByte: string, percentUniform: number, matchingBytesCount: number, totalInspected: number }
 */
export function checkHeaderZeroing(fragmentBytes, inspectLength = 128) {
  if (!fragmentBytes || fragmentBytes.length === 0) {
    return {
      zeroed: false,
      repeatedByte: null,
      repeatedByteHex: null,
      percentUniform: 0,
      matchingBytesCount: 0,
      totalInspected: 0,
      details: 'No bytes available to inspect'
    };
  }

  const n = Math.min(inspectLength, fragmentBytes.length);
  const freq = new Array(256).fill(0);

  for (let i = 0; i < n; i++) {
    freq[fragmentBytes[i]]++;
  }

  let maxByte = 0;
  let maxCount = 0;

  for (let b = 0; b < 256; b++) {
    if (freq[b] > maxCount) {
      maxCount = freq[b];
      maxByte = b;
    }
  }

  const percentUniform = (maxCount / n) * 100;
  const isZeroed = percentUniform >= 90;
  const hexVal = '0x' + maxByte.toString(16).padStart(2, '0').toUpperCase();

  return {
    zeroed: isZeroed,
    repeatedByte: hexVal,
    repeatedByteDecimal: maxByte,
    repeatedByteHex: hexVal,
    percentUniform: Math.round(percentUniform * 10) / 10,
    matchingBytesCount: maxCount,
    totalInspected: n,
    details: isZeroed
      ? `Header: ${Math.round(percentUniform)}% uniform (${maxCount}/${n} bytes matching ${hexVal})`
      : `Header: Intact / Variable (${Math.round(percentUniform)}% peak byte ${hexVal})`
  };
}

/**
 * 3. matchKnownWipeSignature(fragmentBytes, inspectLength = 512)
 * 
 * Compare byte-level similarity of the fragment against reference secure-delete
 * pass patterns (e.g. DoD 5220.22-M: 0x00, 0xFF, 0x96; Gutmann passes).
 * 
 * @param {Uint8Array} fragmentBytes 
 * @param {number} inspectLength Length to inspect (default 512 bytes)
 * @returns {Object} { matched: bool, patternName: string, similarityPercent: number, patternStandard: string, patternHex: string }
 */
export function matchKnownWipeSignature(fragmentBytes, inspectLength = 512) {
  if (!fragmentBytes || fragmentBytes.length === 0) {
    return {
      matched: false,
      patternName: 'None',
      similarityPercent: 0,
      patternStandard: 'N/A',
      patternHex: 'N/A',
      details: 'No byte data for pattern matching'
    };
  }

  const n = Math.min(inspectLength, fragmentBytes.length);
  let bestMatch = null;
  let highestSimilarity = 0;

  for (const ref of KNOWN_WIPE_PATTERNS) {
    let matchCount = 0;
    const patLen = ref.pattern.length;

    for (let i = 0; i < n; i++) {
      if (fragmentBytes[i] === ref.pattern[i % patLen]) {
        matchCount++;
      }
    }

    const similarity = (matchCount / n) * 100;
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = ref;
    }
  }

  const matched = highestSimilarity >= 80;
  const roundedSim = Math.round(highestSimilarity);

  return {
    matched,
    patternName: bestMatch ? bestMatch.shortName : 'None',
    patternFullName: bestMatch ? bestMatch.name : 'None',
    patternStandard: bestMatch ? bestMatch.standard : 'N/A',
    similarityPercent: roundedSim,
    patternHex: bestMatch ? bestMatch.pattern.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ') : '',
    details: matched
      ? `Pattern match: ${roundedSim}% — ${bestMatch.shortName}`
      : `Pattern match: ${roundedSim}% — No known wipe signature`
  };
}

/**
 * 4. checkTimestampAnomaly(fragments, activeFile)
 * 
 * Compare each fragment's captured lastModified against its logical offset / sequence position.
 * Flag when a fragment that should logically precede another (lower offset, parent dependency)
 * has a LATER modified timestamp — this suggests post-hoc editing / sector tampering.
 * 
 * @param {Array} fragments List of fragments with { id, offsetStart, lastModified }
 * @param {Object} activeFile Parent file metadata
 * @returns {Object} { anomalous: bool, conflictingPairs: Array, conflictCount: number }
 */
export function checkTimestampAnomaly(fragments = [], activeFile = null) {
  if (!fragments || fragments.length < 2) {
    return {
      anomalous: false,
      conflictingPairs: [],
      conflictCount: 0,
      details: 'Insufficient fragment sequence data'
    };
  }

  // If fragments are image fragments (e.g. have polygon, boundingBox, or activeFile is an image)
  // or non-sequential memory fragments, spatial coordinates must not be treated as a linear timestamp sequence
  const isImageOrSpatial = Boolean(
    (activeFile?.type?.startsWith('image/') || activeFile?.detectedType?.includes('Image'))
    || fragments.some(f => f.boundingBox || f.polygon || f.isImageFragment)
  );

  if (isImageOrSpatial) {
    return {
      anomalous: false,
      conflictingPairs: [],
      conflictCount: 0,
      details: 'Spatial image evidence (timestamp anomaly check not applicable)'
    };
  }

  // Sort logically by offset
  const sorted = [...fragments].sort((a, b) => a.offsetStart - b.offsetStart);
  const conflictingPairs = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentTimestamp = current.lastModified || (activeFile ? activeFile.lastModified : null);
    const nextTimestamp = next.lastModified || (activeFile ? activeFile.lastModified : null);

    // If both have timestamps and current (lower offset) was modified noticeably AFTER next (higher offset)
    // Threshold: > 1000ms later indicates non-sequential / post-hoc modification
    if (currentTimestamp && nextTimestamp && (currentTimestamp - nextTimestamp > 1000)) {
      conflictingPairs.push({
        earlierFragId: current.id,
        laterFragId: next.id,
        earlierOffset: current.offsetStart,
        laterOffset: next.offsetStart,
        earlierTime: new Date(currentTimestamp).toISOString(),
        laterTime: new Date(nextTimestamp).toISOString(),
        diffMs: currentTimestamp - nextTimestamp,
        diffSeconds: Math.round((currentTimestamp - nextTimestamp) / 1000)
      });
    }
  }

  return {
    anomalous: conflictingPairs.length > 0,
    conflictingPairs,
    conflictCount: conflictingPairs.length,
    details: conflictingPairs.length > 0
      ? `Timestamp anomaly: ${conflictingPairs.length} inverted sequence pair(s) detected`
      : 'Timestamp: Chronological sequence intact'
  };
}

/**
 * Classify tamper status of an individual fragment combining all four checks
 * 
 * Rules:
 * - 'natural'    — no flags, or only mild entropy variance
 * - 'suspicious' — one weak signal (e.g. timestamp anomaly alone, entropy uniformity alone, header zeroing alone)
 * - 'tampered'   — entropy uniformity AND (header zeroing OR wipe signature match) — strong combined evidence
 * 
 * Never marks 'tampered' off a single weak signal alone.
 * Computes a real percentage confidence score based on the underlying byte analysis.
 * 
 * @param {Object} fragment Fragment object
 * @param {Array} allFileFragments All fragments belonging to the same evidence file
 * @param {Object} activeFile Parent file object
 * @returns {Object} Comprehensive tamper classification record
 */
export function classifyTamperStatus(fragment, allFileFragments = [], activeFile = null) {
  if (!fragment) {
    return {
      status: 'natural',
      statusLabel: 'NATURAL',
      confidence: 100,
      iconType: 'natural',
      entropyAnalysis: { suspicious: false, meanEntropy: 0, stddev: 0.5 },
      headerAnalysis: { zeroed: false, percentUniform: 0 },
      wipePatternAnalysis: { matched: false, similarityPercent: 0 },
      timestampAnalysis: { anomalous: false, isConflicting: false },
      flaggedOffsetRange: { start: 0, end: 128 },
      evidencePoints: []
    };
  }

  const fragBytes = fragment.data instanceof Uint8Array
    ? fragment.data
    : new Uint8Array(fragment.data || 0);

  // 1. Entropy Uniformity
  const fragIndex = allFileFragments.findIndex(f => f.id === fragment.id);
  const entropyResult = calculateEntropyUniformity(
    allFileFragments.length > 0 ? allFileFragments : [fragment],
    fragIndex >= 0 ? fragIndex : 0,
    fragBytes
  );

  // 2. Header Zeroing (Only applicable to block 0 / header sector)
  const isHeaderBlock = fragment.offsetStart === 0 || fragment.isHeaderBlock;
  const headerResult = (isHeaderBlock && fragBytes.length > 0)
    ? checkHeaderZeroing(fragBytes, 128)
    : { zeroed: false, repeatedByte: null, percentUniform: 0, matchingBytesCount: 0, totalInspected: 0, details: 'Non-header sector' };

  // 3. Known Wipe Signature Matching
  const wipeResult = matchKnownWipeSignature(fragBytes, 512);

  // 4. Timestamp Anomaly (Only for linear disk sector data with filesystem timestamps)
  const timestampGlobal = checkTimestampAnomaly(allFileFragments, activeFile);
  const isFragConflicting = timestampGlobal.conflictingPairs.some(
    p => p.earlierFragId === fragment.id || p.laterFragId === fragment.id
  );

  // Collect evidence signals
  const evidencePoints = [];
  if (entropyResult.suspicious) {
    evidencePoints.push(`Uniform High Entropy (Mean ${entropyResult.meanEntropy}, σ ${entropyResult.stddev})`);
  }
  if (isHeaderBlock && headerResult.zeroed) {
    evidencePoints.push(`Header ${headerResult.percentUniform}% Zeroed/Repeated (${headerResult.repeatedByte})`);
  }
  if (wipeResult.matched) {
    evidencePoints.push(`Known Wipe Pattern Match: ${wipeResult.similarityPercent}% (${wipeResult.patternName})`);
  }
  if (isFragConflicting && !timestampGlobal.details.includes('not applicable')) {
    evidencePoints.push(`Timestamp Inversion with adjacent sector`);
  }

  // Combined Status Logic
  let status = 'natural';
  let statusLabel = 'NOT ESTABLISHED';
  let confidence = 95;

  const isStrongTampered = (headerResult.zeroed && (wipeResult.matched || entropyResult.suspicious))
    || (wipeResult.matched && entropyResult.suspicious);

  if (isStrongTampered) {
    status = 'tampered';
    statusLabel = 'CONFIRMED';

    // Compute real percentage confidence:
    let computedConf = 72;
    if (headerResult.zeroed) {
      computedConf += Math.min(12, ((headerResult.percentUniform - 90) / 10) * 12);
    }
    if (wipeResult.matched) {
      computedConf += Math.min(10, ((wipeResult.similarityPercent - 80) / 20) * 10);
    }
    if (entropyResult.stddev < 0.10) {
      computedConf += Math.min(6, ((0.10 - entropyResult.stddev) / 0.10) * 6);
    }
    if (isFragConflicting) {
      computedConf += 5;
    }

    confidence = Math.min(98, Math.max(76, Math.round(computedConf)));

  } else if (wipeResult.matched || (isHeaderBlock && headerResult.zeroed) || entropyResult.suspicious) {
    // Verified single anti-forensic signal -> Suspicious
    status = 'suspicious';
    statusLabel = 'SUSPICIOUS';

    let computedConf = 45;
    if (wipeResult.matched) computedConf += 18;
    if (isHeaderBlock && headerResult.zeroed) computedConf += 16;
    if (entropyResult.suspicious) computedConf += 12;

    confidence = Math.min(75, Math.max(50, Math.round(computedConf)));

  } else {
    // Natural disk data / normal fragmentation — No anti-forensic tampering established
    status = 'natural';
    statusLabel = 'NOT ESTABLISHED';

    const varianceBonus = Math.min(10, (entropyResult.stddev || 0.2) * 20);
    confidence = Math.min(99, Math.max(82, Math.round(88 + varianceBonus)));
  }

  // Calculate flagged offset range for HexViewer inspection
  const flaggedOffsetRange = {
    start: 0,
    end: headerResult.zeroed ? headerResult.totalInspected : Math.min(256, fragBytes.length),
    label: headerResult.zeroed ? `Wiped Header Fill (${headerResult.repeatedByte})` : (wipeResult.matched ? wipeResult.patternName : 'Entropy Anomaly Block')
  };

  return {
    status,
    statusLabel,
    confidence,
    entropyAnalysis: entropyResult,
    headerAnalysis: headerResult,
    wipePatternAnalysis: wipeResult,
    timestampAnalysis: {
      anomalous: timestampGlobal.anomalous,
      isConflicting: isFragConflicting,
      conflictingPairs: timestampGlobal.conflictingPairs.filter(p => p.earlierFragId === fragment.id || p.laterFragId === fragment.id)
    },
    flaggedOffsetRange,
    evidencePoints,
    reviewed: false
  };
}

/**
 * Batch analyze all fragments in the active session
 * @param {Array} fragments 
 * @param {Array} evidenceFiles 
 * @returns {Object} { analysisMap: Object, summary: Object, flaggedFragments: Array }
 */
export function analyzeAllSessionFragments(fragments = [], evidenceFiles = []) {
  const analysisMap = {};
  const flaggedFragments = [];
  let naturalCount = 0;
  let suspiciousCount = 0;
  let tamperedCount = 0;

  fragments.forEach(frag => {
    const parentFile = evidenceFiles.find(f => f.id === frag.fileId);
    const fileFragments = fragments.filter(f => f.fileId === frag.fileId);
    const analysis = classifyTamperStatus(frag, fileFragments, parentFile);

    analysisMap[frag.id] = analysis;

    if (analysis.status === 'tampered') {
      tamperedCount++;
      flaggedFragments.push({ ...frag, tamperAnalysis: analysis, parentFileName: parentFile?.name });
    } else if (analysis.status === 'suspicious') {
      suspiciousCount++;
      flaggedFragments.push({ ...frag, tamperAnalysis: analysis, parentFileName: parentFile?.name });
    } else {
      naturalCount++;
    }
  });

  return {
    analysisMap,
    flaggedFragments,
    summary: {
      total: fragments.length,
      naturalCount,
      suspiciousCount,
      tamperedCount
    }
  };
}
