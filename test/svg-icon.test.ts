import { describe, expect, it } from 'vitest';
import { iconFromSvg, iconifyPack, SvgIconError } from '../src/render/svg-icon.js';
import { registerIconPack } from '../src/render/icons.js';
import { renderSvg } from '../src/render/index.js';
import { layoutDiagram } from '../src/layout/index.js';
import { logos } from '../src/logos/index.js';
import type { Diagram } from '../src/index.js';

const wrap = (inner: string, attrs = 'viewBox="0 0 24 24"') => `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;

describe('iconFromSvg', () => {
  it('keeps shapes and marks the icon as drawn with its own colors', () => {
    const icon = iconFromSvg(wrap('<path fill="#ff0000" d="M0 0h24v24H0z"/><circle cx="12" cy="12" r="4" fill="blue"/>'));
    expect(icon.color).toBe(true);
    expect(icon.viewBox).toBe('0 0 24 24');
    expect(icon.body).toContain('<path fill="#ff0000"');
    expect(icon.body).toContain('<circle');
  });

  it('falls back to width and height when there is no viewBox', () => {
    expect(iconFromSvg(wrap('<rect width="1" height="1"/>', 'width="32" height="16"')).viewBox).toBe('0 0 32 16');
  });

  it('throws when there is no usable size', () => {
    expect(() => iconFromSvg(wrap('<rect width="1" height="1"/>', ''))).toThrow(SvgIconError);
  });

  it('removes the prolog, comments, titles, and editor metadata', () => {
    const icon = iconFromSvg(
      `<?xml version="1.0"?><!-- hi --><svg viewBox="0 0 8 8" xmlns:inkscape="x"><title>Logo</title><inkscape:foo bar="1"/><path d="M0 0h8v8z"/></svg>`,
    );
    expect(icon.body).toBe('<path d="M0 0h8v8z"/>');
  });

  it.each([
    ['a script element', '<script>alert(1)</script><path d="M0 0"/>'],
    ['an event handler', '<path d="M0 0" onload="alert(1)"/>'],
    ['foreignObject', '<foreignObject><div>hi</div></foreignObject>'],
    ['an external image', '<image href="https://example.com/a.png"/>'],
    ['an external use', '<use href="https://example.com/a.svg#x"/>'],
    ['a javascript url', '<a href="javascript:alert(1)"><path d="M0 0"/></a>'],
    ['text', '<text>Hello</text>'],
    ['a bare text node', 'hello<path d="M0 0"/>'],
    ['an external url() paint', '<path d="M0 0" fill="url(https://example.com/x)"/>'],
    ['an unbalanced tag', '<g><path d="M0 0"/>'],
  ])('rejects %s', (_label, inner) => {
    expect(() => iconFromSvg(wrap(inner))).toThrow(SvgIconError);
  });

  it('rejects markup that is not a single svg', () => {
    expect(() => iconFromSvg('<div></div>')).toThrow(SvgIconError);
  });

  it('rejects a file with no shapes', () => {
    expect(() => iconFromSvg(wrap(''))).toThrow(SvgIconError);
  });

  it('inlines simple class styles from a style block', () => {
    const icon = iconFromSvg(wrap('<style>.a{fill:#123456;stroke:none}</style><path class="a" d="M0 0h1v1z"/>'));
    expect(icon.body).toContain('#123456');
    expect(icon.body).not.toContain('<style');
    expect(icon.body).not.toContain('class=');
  });

  it('rejects styles it cannot inline safely', () => {
    expect(() => iconFromSvg(wrap('<style>@import url(https://example.com/a.css);</style><path d="M0 0"/>'))).toThrow(SvgIconError);
  });

  it('keeps gradients and references to them', () => {
    const icon = iconFromSvg(
      wrap(
        '<defs><linearGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="24" height="24" fill="url(#g)"/>',
      ),
    );
    expect(icon.body).toContain('<linearGradient id="g">');
    expect(icon.body).toContain('fill="url(#g)"');
  });

  it('moves paint attributes on the root onto a group', () => {
    const icon = iconFromSvg(wrap('<path d="M0 0h1v1z"/>', 'viewBox="0 0 24 24" fill="#abcdef"'));
    expect(icon.body).toBe('<g fill="#abcdef"><path d="M0 0h1v1z"/></g>');
  });
});

describe('iconifyPack', () => {
  const set = {
    width: 16,
    height: 16,
    icons: {
      one: { body: '<path d="M0 0h16v16z"/>' },
      wide: { body: '<rect width="32" height="8"/>', width: 32, height: 8 },
      bad: { body: '<script>x</script>' },
    },
    aliases: {
      same: { parent: 'one' },
      flipped: { parent: 'one', hFlip: true },
      orphan: { parent: 'missing' },
    },
  };

  it('converts icons and plain aliases, and reports what it skips', () => {
    const skipped: string[] = [];
    const pack = iconifyPack(set, { onSkip: (name) => skipped.push(name) });
    expect(Object.keys(pack).sort()).toEqual(['one', 'same', 'wide']);
    expect(pack.wide!.viewBox).toBe('0 0 32 8');
    expect(pack.one!.color).toBe(true);
    expect(skipped.sort()).toEqual(['bad', 'flipped', 'orphan']);
  });

  it('only converts the names listed in include', () => {
    expect(Object.keys(iconifyPack(set, { include: ['one'] }))).toEqual(['one']);
  });

  it('honors left and top offsets', () => {
    const pack = iconifyPack({ icons: { a: { body: '<path d="M0 0"/>', left: 2, top: 3, width: 10, height: 12 } } });
    expect(pack.a!.viewBox).toBe('2 3 10 12');
  });
});

describe('color icons in a diagram', () => {
  registerIconPack('test', {
    wide: { body: '<defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><rect width="40" height="20" fill="url(#g)"/>', viewBox: '0 0 40 20', color: true },
  });
  const diagram: Diagram = {
    title: 'Logos',
    nodes: [
      { id: 'a', label: 'A', icon: 'test:wide' },
      { id: 'b', label: 'B', icon: 'test:wide' },
      { id: 'c', label: 'C', icon: 'logo:nope' },
    ],
    edges: [{ id: 'e1', from: 'a', to: 'b' }],
  };

  it('draws them without the outline wrapper and with ids unique per use', async () => {
    const svg = renderSvg(diagram, await layoutDiagram(diagram));
    const ids = [...svg.matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(svg).toContain(`fill="url(#${id})"`);
    expect(svg).toMatch(/<g class="icon" transform="[^"]+"><defs>/);
  });

  it('ships bundled logos that render', async () => {
    expect(Object.keys(logos).length).toBeGreaterThan(20);
    registerIconPack('logo', logos);
    const d: Diagram = { title: 'Stack', nodes: [{ id: 'db', label: 'Postgres', icon: 'logo:postgresql' }], edges: [] };
    const svg = renderSvg(d, await layoutDiagram(d));
    expect(svg).toContain('fill="#');
  });
});
