import { describe, expect, it } from 'vitest';
import {
  ROLES,
  applyTokens,
  assertSafeTheme,
  defaultTheme,
  extendTheme,
  highContrastTheme,
  resolveTheme,
  type ColorTokens,
} from '../src/render/index.js';

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const cases: [string, ColorTokens, number, number][] = [
  ['default light', defaultTheme.light, 4.5, 3],
  ['default dark', defaultTheme.dark, 4.5, 3],
  ['high-contrast light', highContrastTheme.light, 7, 4.5],
  ['high-contrast dark', highContrastTheme.dark, 7, 4.5],
];

describe.each(cases)('%s palette contrast', (_name, colors, textMin, graphicMin) => {
  it('keeps role text readable on its fill', () => {
    for (const role of ROLES) {
      const p = colors.roles[role];
      expect(contrast(p.text, p.fill), `${role} text`).toBeGreaterThanOrEqual(textMin);
    }
  });

  it('keeps outlines visible against the page and the fill', () => {
    for (const role of ROLES) {
      const p = colors.roles[role];
      expect(contrast(p.stroke, colors.background), `${role} on page`).toBeGreaterThanOrEqual(graphicMin);
    }
  });

  it('keeps edges, labels, and group text legible', () => {
    expect(contrast(colors.edge, colors.background)).toBeGreaterThanOrEqual(graphicMin);
    expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(textMin);
    expect(contrast(colors.textMuted, colors.background)).toBeGreaterThanOrEqual(textMin);
    expect(contrast(colors.textMuted, colors.groupFill)).toBeGreaterThanOrEqual(textMin);
    expect(contrast(colors.groupStroke, colors.background)).toBeGreaterThanOrEqual(graphicMin);
  });
});

describe('theme helpers', () => {
  it('resolves built-in names and rejects unknown ones', () => {
    expect(resolveTheme(undefined)).toBe(defaultTheme);
    expect(resolveTheme('high-contrast')).toBe(highContrastTheme);
    expect(() => resolveTheme('neon' as 'default')).toThrow(/Unknown theme/);
  });

  it('extends a theme without changing the base', () => {
    const custom = extendTheme(defaultTheme, { name: 'brand', radius: 2, light: { roles: { primary: { fill: '#fff0f0' } } } });
    expect(custom.name).toBe('brand');
    expect(custom.light.roles.primary.fill).toBe('#fff0f0');
    expect(custom.light.roles.primary.stroke).toBe(defaultTheme.light.roles.primary.stroke);
    expect(custom.dark).toEqual(defaultTheme.dark);
    expect(defaultTheme.light.roles.primary.fill).toBe('#ddf4ff');
  });

  it('applies token overrides to both appearances', () => {
    const t = applyTokens(defaultTheme, { edge: 'var(--brand-edge)' });
    expect(t.light.edge).toBe('var(--brand-edge)');
    expect(t.dark.edge).toBe('var(--brand-edge)');
    expect(applyTokens(defaultTheme, undefined)).toBe(defaultTheme);
  });

  it('rejects token values that could break out of a declaration', () => {
    const bad = applyTokens(defaultTheme, { edge: 'red;} body{display:none' });
    expect(() => assertSafeTheme(bad)).toThrow(/unsafe/);
    expect(() => assertSafeTheme(defaultTheme)).not.toThrow();
  });
});
