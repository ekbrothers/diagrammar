export interface TextMetrics {
  fontSize: number;
  /** Average glyph width as a fraction of the font size. */
  charWidth: number;
  lineHeight: number;
}

export const DEFAULT_METRICS: TextMetrics = { fontSize: 14, charWidth: 0.58, lineHeight: 1.3 };

// Width is estimated from character count rather than measured in a browser, so
// the server, the build, and the client all compute the same layout.
export function textWidth(text: string, metrics: TextMetrics): number {
  return text.length * metrics.fontSize * metrics.charWidth;
}

export interface WrappedText {
  lines: string[];
  width: number;
  height: number;
}

/** Wraps on spaces. A single word wider than maxWidth stays whole so it is never clipped. */
export function wrapText(text: string, maxWidth: number, metrics: TextMetrics): WrappedText {
  const lineHeight = metrics.fontSize * metrics.lineHeight;
  if (text === '') return { lines: [], width: 0, height: 0 };

  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0] as string;
    for (const word of words.slice(1)) {
      const candidate = `${current} ${word}`;
      if (textWidth(candidate, metrics) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }

  const width = Math.max(...lines.map((l) => textWidth(l, metrics)));
  return { lines, width, height: lines.length * lineHeight };
}
