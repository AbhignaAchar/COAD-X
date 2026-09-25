// Test fast inpainting / gap closure algorithm for canvas
export function inpaintBlackGaps(ctx, width, height, threshold = 28) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Mask: true if pixel is black gap
  const isGap = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Black gap border detection
    if (r < threshold && g < threshold && b < threshold) {
      isGap[p] = 1;
    }
  }

  // Multi-pass iterative neighbor diffusion to fill black gaps cleanly
  // Pass 1-4: Directional propagation from non-gap boundaries
  for (let pass = 0; pass < 4; pass++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        if (isGap[p] === 1) {
          // Look at 8 neighbors
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          const neighbors = [
            p - 1, p + 1, p - width, p + width,
            p - width - 1, p - width + 1, p + width - 1, p + width + 1
          ];
          for (let k = 0; k < 8; k++) {
            const np = neighbors[k];
            if (isGap[np] === 0) {
              const ni = np * 4;
              sumR += data[ni];
              sumG += data[ni + 1];
              sumB += data[ni + 2];
              count++;
            }
          }
          if (count > 0) {
            const idx = p * 4;
            data[idx] = Math.round(sumR / count);
            data[idx + 1] = Math.round(sumG / count);
            data[idx + 2] = Math.round(sumB / count);
            isGap[p] = 2; // filled this pass
          }
        }
      }
    }
    // Mark filled as non-gap for subsequent passes
    for (let p = 0; p < isGap.length; p++) {
      if (isGap[p] === 2) isGap[p] = 0;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
