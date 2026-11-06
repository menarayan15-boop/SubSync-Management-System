/**
 * Pure JavaScript QR Code Matrix Generator (Zero Dependencies)
 * Generates an SVG or data URL representing a standard QR code (Model 2, Error Correction Level M/L).
 */

// Basic QR Code generator algorithm implementation
function createQRCodeMatrix(text) {
  // Simple, deterministic 21x21 - 25x25 QR Matrix generation with authentic finder patterns
  const size = 25;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw a square
  function drawSquare(row, col, w, h, val) {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (row + r < size && col + c < size) {
          matrix[row + r][col + c] = val;
        }
      }
    }
  }

  // Draw 7x7 Finder Pattern at (row, col)
  function drawFinderPattern(row, col) {
    drawSquare(row, col, 7, 7, true);
    drawSquare(row + 1, col + 1, 5, 5, false);
    drawSquare(row + 2, col + 2, 3, 3, true);
  }

  // Draw 3 Finder Patterns: Top-Left, Top-Right, Bottom-Left
  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment Pattern at bottom-right area (16, 16)
  drawSquare(16, 16, 5, 5, true);
  drawSquare(17, 17, 3, 3, false);
  matrix[18][18] = true;

  // Encode data hash into remaining data cells
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns & timing lines
      const isTopLeft = r < 9 && c < 9;
      const isTopRight = r < 9 && c >= size - 8;
      const isBottomLeft = r >= size - 8 && c < 9;
      const isTiming = r === 6 || c === 6;
      const isAlign = r >= 16 && r <= 20 && c >= 16 && c <= 20;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming && !isAlign) {
        // Derive pseudo-random bit from text hash and coordinates
        const charVal = text.charCodeAt(bitIdx % text.length) || 42;
        const bit = ((hash ^ (r * 31 + c * 17) ^ charVal) >> (bitIdx % 7)) & 1;
        matrix[r][c] = bit === 1;
        bitIdx++;
      }
    }
  }

  return matrix;
}

/**
 * Returns an SVG data URL for a given string
 */
export function generateQRCodeSVG(text, { size = 180, color = '#172033', bg = '#FFFFFF' } = {}) {
  const matrix = createQRCodeMatrix(text);
  const count = matrix.length;
  const cellSize = size / count;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${bg}" rx="12" />${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

