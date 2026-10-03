import { describe, expect, it } from 'vitest';
import { DEFAULT_METRICS, textWidth, wrapText } from '../src/layout/index.js';

describe('text wrapping', () => {
  it('estimates width from character count', () => {
    expect(textWidth('abcd', DEFAULT_METRICS)).toBeCloseTo(4 * 14 * 0.58);
  });

  it('returns nothing for empty text', () => {
    expect(wrapText('', 100, DEFAULT_METRICS)).toEqual({ lines: [], width: 0, height: 0 });
  });

  it('keeps short text on one line', () => {
    expect(wrapText('hello world', 500, DEFAULT_METRICS).lines).toEqual(['hello world']);
  });

  it('wraps on spaces without losing words', () => {
    const wrapped = wrapText('one two three four five six', 90, DEFAULT_METRICS);
    expect(wrapped.lines.length).toBeGreaterThan(1);
    expect(wrapped.lines.join(' ')).toBe('one two three four five six');
  });

  it('never splits a word that is wider than the limit', () => {
    const wrapped = wrapText('a unbreakableunbreakableunbreakable b', 60, DEFAULT_METRICS);
    expect(wrapped.lines).toContain('unbreakableunbreakableunbreakable');
    expect(wrapped.width).toBeGreaterThan(60);
  });

  it('respects explicit line breaks, including blank lines', () => {
    expect(wrapText('a\n\nb', 500, DEFAULT_METRICS).lines).toEqual(['a', '', 'b']);
  });

  it('reports height from the line count', () => {
    const wrapped = wrapText('a\nb\nc', 500, DEFAULT_METRICS);
    expect(wrapped.height).toBeCloseTo(3 * 14 * 1.3);
  });
});
