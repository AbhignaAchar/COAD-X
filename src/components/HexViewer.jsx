import React, { useRef, useEffect } from 'react';

export default function HexViewer({
  bytes,
  title = 'Raw Hex Dump',
  highlightRange = null, // { start: number, end: number, label?: string }
  maxLines = 64
}) {
  const highlightedRowRef = useRef(null);
  const containerRef = useRef(null);

  if (!bytes || bytes.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-slate-500 text-xs">
        No byte data selected for hex inspection.
      </div>
    );
  }

  const bytesPerLine = 16;
  const len = Math.min(bytes.length, bytesPerLine * maxLines);
  const lines = [];
  let firstHighlightedLineIdx = -1;

  for (let i = 0; i < len; i += bytesPerLine) {
    const slice = bytes.slice(i, i + bytesPerLine);
    const address = i.toString(16).padStart(8, '0').toUpperCase();
    const byteItems = [];
    let lineHasHighlight = false;

    for (let j = 0; j < bytesPerLine; j++) {
      const byteOffset = i + j;
      if (j < slice.length) {
        const b = slice[j];
        const hex = b.toString(16).padStart(2, '0').toUpperCase();
        const ascii = (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
        const isHighlighted = !!(highlightRange && byteOffset >= highlightRange.start && byteOffset < highlightRange.end);

        if (isHighlighted) {
          lineHasHighlight = true;
          if (firstHighlightedLineIdx === -1) {
            firstHighlightedLineIdx = lines.length;
          }
        }

        byteItems.push({
          offset: byteOffset,
          hex,
          ascii,
          isHighlighted
        });
      } else {
        byteItems.push({
          offset: byteOffset,
          hex: '  ',
          ascii: ' ',
          isHighlighted: false
        });
      }
    }

    lines.push({
      address,
      startOffset: i,
      bytes: byteItems,
      lineHasHighlight
    });
  }

  // Auto-scroll to flagged offset range when highlighted
  useEffect(() => {
    if (highlightRange && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightRange, bytes]);

  return (
    <div className="bg-white overflow-hidden border border-slate-200 rounded-xl shadow-sm">
      {/* Title Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${highlightRange ? 'bg-red-500 animate-ping' : 'bg-[#0F8FB3]'}`}></span>
          <h4 className="text-xs font-mono font-bold tracking-wider text-[#0F2747] uppercase">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          {highlightRange && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>Flagged: 0x{highlightRange.start.toString(16).padStart(4, '0').toUpperCase()} - 0x{(highlightRange.end - 1).toString(16).padStart(4, '0').toUpperCase()} ({highlightRange.end - highlightRange.start} B)</span>
            </span>
          )}
          <span className="text-xs text-slate-500 font-mono">
            Showing {Math.min(bytes.length, len)} / {bytes.length} Bytes
          </span>
        </div>
      </div>

      {/* Flagged Alert Banner if Highlight Range Present */}
      {highlightRange && highlightRange.label && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-700 font-medium">
          <span className="flex items-center gap-2">
            <span className="font-bold">⚠ Suspicious Byte Sequence:</span>
            <span className="font-mono text-red-900">{highlightRange.label}</span>
          </span>
          <span className="text-[11px] text-red-600 font-mono">Offset #{highlightRange.start} to #{highlightRange.end}</span>
        </div>
      )}

      {/* Hex Dump Table */}
      <div ref={containerRef} className="p-4 bg-slate-50 overflow-x-auto text-mono text-xs leading-relaxed max-h-[440px] overflow-y-auto">
        <div className="min-w-[660px]">
          {/* Column Header Row */}
          <div className="flex text-slate-400 border-b border-slate-200 pb-1 mb-2 font-bold select-none text-[11px]">
            <span className="w-24">OFFSET</span>
            <span className="flex-1 font-mono tracking-wider">
              00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F
            </span>
            <span className="w-36 text-right">ASCII DECODE</span>
          </div>

          {/* Hex & ASCII Lines */}
          {lines.map((line, lineIdx) => {
            const isFirstHighlightedRow = lineIdx === firstHighlightedLineIdx;

            return (
              <div
                key={lineIdx}
                ref={isFirstHighlightedRow ? highlightedRowRef : null}
                className={`flex rounded px-1.5 py-0.5 transition-colors font-mono ${
                  line.lineHasHighlight
                    ? 'bg-red-50 border-l-2 border-red-500 shadow-sm'
                    : 'hover:bg-slate-200/60'
                }`}
              >
                {/* Address */}
                <span className={`w-24 font-medium select-none ${line.lineHasHighlight ? 'text-red-700 font-bold' : 'text-slate-500'}`}>
                  {line.address}
                </span>

                {/* 16 Hex Bytes with 8-byte Gap */}
                <span className="flex-1 flex items-center tracking-wider">
                  {line.bytes.slice(0, 8).map((b, bIdx) => (
                    <span
                      key={bIdx}
                      className={`inline-block mr-1.5 ${
                        b.isHighlighted
                          ? 'bg-red-100 text-red-800 font-extrabold px-0.5 rounded border border-red-300'
                          : 'text-[#0F2747]'
                      }`}
                    >
                      {b.hex}
                    </span>
                  ))}
                  <span className="inline-block w-2"></span>
                  {line.bytes.slice(8, 16).map((b, bIdx) => (
                    <span
                      key={bIdx + 8}
                      className={`inline-block mr-1.5 ${
                        b.isHighlighted
                          ? 'bg-red-100 text-red-800 font-extrabold px-0.5 rounded border border-red-300'
                          : 'text-[#0F2747]'
                      }`}
                    >
                      {b.hex}
                    </span>
                  ))}
                </span>

                {/* ASCII Representation */}
                <span className="w-36 text-right font-mono tracking-widest text-slate-600 select-none">
                  {line.bytes.map((b, aIdx) => (
                    <span
                      key={aIdx}
                      className={b.isHighlighted ? 'text-red-700 font-bold bg-red-100' : ''}
                    >
                      {b.ascii}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
