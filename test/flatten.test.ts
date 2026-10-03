import { describe, expect, it } from 'vitest';
import { renderSvg } from '../src/render/index.js';
import { flattenCss, flattenInlineStyles } from '../src/render/flatten.js';
import { resolveTheme } from '../src/render/theme.js';
import { layoutDiagram } from '../src/layout/index.js';
import type { Diagram } from '../src/schema/types.js';

const theme = resolveTheme('default');

const diagram: Diagram = {
  title: 'Flatten',
  nodes: [
    { id: 'a', label: 'Alpha', role: 'primary' },
    { id: 'b', label: 'Beta', colors: { fill: '#ffe8d6', stroke: '#bc6c25', text: '#6b3a0f' } },
    { id: 'c', label: 'Gamma', type: 'database', icon: 'server' },
  ],
  edges: [
    { id: 'e1', from: 'a', to: 'b', label: 'flows' },
    { id: 'e2', from: 'b', to: 'c', role: 'danger' },
  ],
  groups: [],
};

async function flat(mode: 'light' | 'dark' = 'light'): Promise<string> {
  const layout = await layoutDiagram(diagram);
  return renderSvg(diagram, layout, { mode, flatten: true, background: true });
}

describe('flattenCss', () => {
  it('resolves variables to literal colors', () => {
    const css = flattenCss('.s .lbl{fill:var(--dg-text)}', 's', theme, 'light');
    expect(css).toBe(`.s .lbl{fill:${theme.light.text}}`);
  });

  it('uses the dark palette when asked', () => {
    const css = flattenCss('.s .lbl{fill:var(--dg-text)}', 's', theme, 'dark');
    expect(css).toBe(`.s .lbl{fill:${theme.dark.text}}`);
  });

  it('repeats role-scoped rules once per role and keeps an unroled case', () => {
    const css = flattenCss('.s .shape{fill:var(--fill)}', 's', theme, 'light');
    expect(css).toContain(`.s .role-primary .shape{fill:${theme.light.roles.primary.fill}}`);
    expect(css).toContain(`.s .role-danger .shape{fill:${theme.light.roles.danger.fill}}`);
    expect(css).toContain(`.s .shape{fill:${theme.light.roles.default.fill}}`);
  });

  it('matches a role class on the element itself as well as an ancestor', () => {
    const css = flattenCss('.s .shape{fill:var(--fill)}', 's', theme, 'light');
    expect(css).toContain('.s.role-primary .shape');
    expect(css).toContain('.s .role-primary .shape');
  });

  it('resolves a var fallback when the name is not role scoped', () => {
    const css = flattenCss('.s .x{stroke:var(--missing,#123456)}', 's', theme, 'light');
    expect(css).toBe('.s .x{stroke:#123456}');
  });

  it('drops media blocks, which describe another appearance', () => {
    const css = flattenCss('.s .a{fill:var(--dg-text)}@media (prefers-color-scheme:dark){.s{--dg-text:#fff}}', 's', theme, 'light');
    expect(css).not.toContain('@media');
  });

  it('drops rules that only declare custom properties', () => {
    const css = flattenCss('.s{--dg-text:#111}', 's', theme, 'light');
    expect(css).toBe('');
  });

  it('leaves declarations that are not colors alone', () => {
    const css = flattenCss('.s .lbl{font-size:14px;fill:var(--dg-text)}', 's', theme, 'light');
    expect(css).toContain('font-size:14px');
  });
});

describe('flattenInlineStyles', () => {
  it('turns per-node custom properties into rules that outrank the role rule', () => {
    const markup = '<g class="node" id="dg-n-b" data-id="b" style="--fill:#ffe8d6;--stroke:#bc6c25;--text:#6b3a0f">x</g>';
    const result = flattenInlineStyles(markup, theme, 'light');
    expect(result.css).toContain('#dg-n-b .shape{fill:#ffe8d6;stroke:#bc6c25}');
    expect(result.css).toContain('#dg-n-b .lbl,#dg-n-b .sub{fill:#6b3a0f}');
    expect(result.markup).not.toContain('--fill');
  });

  it('leaves markup without custom properties unchanged', () => {
    const markup = '<g class="node" id="dg-n-a" data-id="a">x</g>';
    expect(flattenInlineStyles(markup, theme, 'light').markup).toBe(markup);
  });
});

describe('renderSvg with flatten', () => {
  it('leaves no var() in the output', async () => {
    expect(await flat()).not.toContain('var(');
  });

  it('keeps edges visible by giving unroled elements a color', async () => {
    const svg = await flat();
    const css = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? '';
    const unroled = css.split('\n').find((line) => line.includes('.edge-line') && !line.includes('.role-'));
    expect(unroled).toBeDefined();
    expect(unroled).toContain(theme.light.edge);
  });

  it('keeps a role colour that differs from the default', async () => {
    const svg = await flat();
    expect(svg).toContain(theme.light.roles.primary.stroke);
  });

  it('refuses to flatten in auto mode, which has two appearances', async () => {
    const layout = await layoutDiagram(diagram);
    expect(() => renderSvg(diagram, layout, { flatten: true })).toThrow(/mode/);
  });

  it('still produces a valid single root element', async () => {
    const svg = await flat();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('is deterministic', async () => {
    expect(await flat()).toBe(await flat());
  });
});
