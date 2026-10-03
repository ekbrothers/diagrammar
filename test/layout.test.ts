import { describe, expect, it } from 'vitest';
import { layoutDiagram, parseLayout, type Layout } from '../src/layout/index.js';
import type { Diagram } from '../src/index.js';

const chain: Diagram = {
  nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
  edges: [
    { id: 'ab', from: 'a', to: 'b' },
    { id: 'bc', from: 'b', to: 'c' },
  ],
};

function overlaps(a: Layout['nodes'][number], b: Layout['nodes'][number]) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function node(layout: Layout, id: string) {
  const found = layout.nodes.find((n) => n.id === id);
  if (!found) throw new Error(`no node ${id}`);
  return found;
}

describe('automatic layout', () => {
  it('flows left to right with no overlaps by default', async () => {
    const layout = await layoutDiagram(chain);
    expect(node(layout, 'a').x).toBeLessThan(node(layout, 'b').x);
    expect(node(layout, 'b').x).toBeLessThan(node(layout, 'c').x);
    for (const [i, a] of layout.nodes.entries()) {
      for (const b of layout.nodes.slice(i + 1)) expect(overlaps(a, b)).toBe(false);
    }
  });

  it('flows top to bottom when asked', async () => {
    const layout = await layoutDiagram(chain, { direction: 'down' });
    expect(node(layout, 'a').y).toBeLessThan(node(layout, 'b').y);
    expect(node(layout, 'b').y).toBeLessThan(node(layout, 'c').y);
  });

  it('supports right-to-left and bottom-to-top', async () => {
    const left = await layoutDiagram(chain, { direction: 'left' });
    expect(node(left, 'a').x).toBeGreaterThan(node(left, 'b').x);
    const up = await layoutDiagram(chain, { direction: 'up' });
    expect(node(up, 'a').y).toBeGreaterThan(node(up, 'b').y);
  });

  it('supports tree and radial strategies', async () => {
    const tree = await layoutDiagram(chain, { strategy: 'tree' });
    const radial = await layoutDiagram(chain, { strategy: 'radial' });
    for (const layout of [tree, radial]) {
      expect(layout.nodes).toHaveLength(3);
      expect(layout.edges).toHaveLength(2);
    }
  });

  it('starts the drawing at the origin', async () => {
    const layout = await layoutDiagram(chain);
    expect(Math.min(...layout.nodes.map((n) => n.x))).toBe(0);
    expect(Math.min(...layout.nodes.map((n) => n.y))).toBe(0);
  });

  it('handles an empty diagram', async () => {
    const layout = await layoutDiagram({ nodes: [] });
    expect(layout).toMatchObject({ width: 0, height: 0, nodes: [], edges: [] });
  });
});

describe('manual positioning', () => {
  it('draws a pinned node at exactly its coordinates', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', label: 'A', x: 500, y: 300 }, { id: 'b', label: 'B' }],
      edges: [{ id: 'ab', from: 'a', to: 'b' }],
    });
    expect(node(layout, 'a')).toMatchObject({ x: 500, y: 300, pinned: true });
    expect(node(layout, 'b').pinned).toBe(false);
  });

  it('keeps unpinned nodes from landing on pinned ones', async () => {
    const layout = await layoutDiagram({
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', x: 0, y: 0 },
        { id: 'c', label: 'C' },
      ],
      edges: [{ id: 'ac', from: 'a', to: 'c' }],
    });
    const pinnedNode = node(layout, 'b');
    for (const other of layout.nodes.filter((n) => n.id !== 'b')) {
      expect(overlaps(pinnedNode, other)).toBe(false);
    }
  });

  it('does not run the engine when every node is pinned', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', label: 'A', x: 0, y: 0 }, { id: 'b', label: 'B', x: 300, y: 100 }],
      edges: [{ id: 'ab', from: 'a', to: 'b' }],
    });
    expect(node(layout, 'a')).toMatchObject({ x: 0, y: 0 });
    expect(node(layout, 'b')).toMatchObject({ x: 300, y: 100 });
    expect(layout.edges[0]?.points.length).toBeGreaterThanOrEqual(2);
  });

  it('routes straight when asked and everything is pinned', async () => {
    const layout = await layoutDiagram(
      {
        nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 300, y: 300 }],
        edges: [{ id: 'ab', from: 'a', to: 'b' }],
      },
      { routing: 'straight' },
    );
    expect(layout.edges[0]?.points).toHaveLength(2);
  });

  it('routes vertically facing pinned nodes with an elbow', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 20, y: 400 }],
      edges: [{ id: 'ab', from: 'a', to: 'b' }],
    });
    expect(layout.edges[0]?.points).toHaveLength(4);
  });
});

describe('groups', () => {
  const grouped: Diagram = {
    nodes: [
      { id: 'a', label: 'A', group: 'inner' },
      { id: 'b', label: 'B', group: 'inner' },
      { id: 'c', label: 'C', group: 'outer' },
      { id: 'd', label: 'D' },
    ],
    groups: [
      { id: 'outer', label: 'Outer' },
      { id: 'inner', label: 'Inner', parent: 'outer' },
    ],
    edges: [
      { id: 'ab', from: 'a', to: 'b' },
      { id: 'bc', from: 'b', to: 'c' },
      { id: 'cd', from: 'c', to: 'd' },
    ],
  };

  it('sizes a group to contain its nodes and nested groups', async () => {
    const layout = await layoutDiagram(grouped);
    const inner = layout.groups.find((g) => g.id === 'inner');
    const outer = layout.groups.find((g) => g.id === 'outer');
    if (!inner || !outer) throw new Error('missing group');
    for (const id of ['a', 'b']) {
      const n = node(layout, id);
      expect(n.x).toBeGreaterThanOrEqual(inner.x);
      expect(n.y).toBeGreaterThanOrEqual(inner.y);
      expect(n.x + n.width).toBeLessThanOrEqual(inner.x + inner.width);
      expect(n.y + n.height).toBeLessThanOrEqual(inner.y + inner.height);
    }
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width);
    expect(inner.depth).toBe(1);
    expect(outer.depth).toBe(0);
  });

  it('keeps an edge that crosses a group boundary attached to both nodes', async () => {
    const layout = await layoutDiagram(grouped);
    const edge = layout.edges.find((e) => e.id === 'cd');
    if (!edge) throw new Error('missing edge');
    expect(edge.points.length).toBeGreaterThanOrEqual(2);
    const c = node(layout, 'c');
    const start = edge.points[0];
    if (!start) throw new Error('no start');
    expect(Math.abs(start.x - (c.x + c.width))).toBeLessThan(1);
  });

  it('supports three levels of nesting', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'n', label: 'N', group: 'g3' }],
      groups: [{ id: 'g1' }, { id: 'g2', parent: 'g1' }, { id: 'g3', parent: 'g2' }],
    });
    expect(layout.groups.map((g) => g.depth).sort()).toEqual([0, 1, 2]);
  });

  it('grows a group to contain a pinned member', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', label: 'A', group: 'g', x: 600, y: 400 }, { id: 'b', label: 'B', group: 'g' }],
      groups: [{ id: 'g', label: 'G' }],
    });
    const g = layout.groups[0];
    const a = node(layout, 'a');
    if (!g) throw new Error('missing group');
    expect(a.x + a.width).toBeLessThanOrEqual(g.x + g.width);
    expect(a.y + a.height).toBeLessThanOrEqual(g.y + g.height);
  });
});

describe('routing', () => {
  it('produces separate routes for parallel edges', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      edges: [
        { id: 'e1', from: 'a', to: 'b' },
        { id: 'e2', from: 'a', to: 'b' },
      ],
    });
    const [e1, e2] = layout.edges;
    expect(e1?.points).not.toEqual(e2?.points);
  });

  it('places an edge label', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      edges: [{ id: 'e', from: 'a', to: 'b', label: 'calls' }],
    });
    expect(layout.edges[0]?.labelPosition).toBeDefined();
    expect(layout.edges[0]?.labelLines).toEqual(['calls']);
  });

  it('supports straight and curved routing', async () => {
    for (const routing of ['straight', 'curved'] as const) {
      const layout = await layoutDiagram(chain, { routing });
      expect(layout.edges.every((e) => e.routing === routing)).toBe(true);
    }
  });
});

describe('content-aware sizing', () => {
  it('wraps a long label and grows the node', async () => {
    const long = 'This label is much longer than the maximum node width allows';
    const layout = await layoutDiagram({ nodes: [{ id: 'a', label: long }, { id: 'b', label: 'Short' }] });
    const a = node(layout, 'a');
    expect(a.lines.length).toBeGreaterThan(1);
    expect(a.lines.join(' ')).toBe(long);
    expect(a.width).toBeLessThanOrEqual(220);
    expect(a.height).toBeGreaterThan(node(layout, 'b').height);
  });

  it('never clips a single word wider than the limit', async () => {
    const layout = await layoutDiagram({ nodes: [{ id: 'a', label: 'Supercalifragilisticexpialidocious_and_more' }] });
    expect(node(layout, 'a').width).toBeGreaterThan(220);
  });

  it('honors explicit width and height', async () => {
    const layout = await layoutDiagram({ nodes: [{ id: 'a', label: 'A', width: 300, height: 120 }] });
    expect(node(layout, 'a')).toMatchObject({ width: 300, height: 120 });
  });

  it('includes a subtitle in the size', async () => {
    const layout = await layoutDiagram({
      nodes: [{ id: 'a', label: 'Title', subtitle: 'Subtitle' }, { id: 'b', label: 'Title' }],
    });
    expect(node(layout, 'a').subtitleLines).toEqual(['Subtitle']);
    expect(node(layout, 'a').height).toBeGreaterThan(node(layout, 'b').height);
  });
});

describe('determinism and precomputing', () => {
  it('gives identical coordinates on repeat runs', async () => {
    const first = await layoutDiagram(chain);
    const second = await layoutDiagram(chain);
    expect(second).toEqual(first);
  });

  it('survives a JSON round trip so it can be computed at build time', async () => {
    const layout = await layoutDiagram(chain);
    expect(parseLayout(JSON.parse(JSON.stringify(layout)))).toEqual(layout);
  });

  it('rejects a malformed precomputed layout', () => {
    expect(() => parseLayout({ version: 1, width: 1 })).toThrow();
    expect(() => parseLayout({ version: 2, width: 0, height: 0, nodes: [], groups: [], edges: [] })).toThrow();
  });
});

describe('hidden layers', () => {
  const layered: Diagram = {
    nodes: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', layer: 'extra' },
      { id: 'c', label: 'C' },
    ],
    edges: [
      { id: 'ab', from: 'a', to: 'b' },
      { id: 'bc', from: 'b', to: 'c' },
      { id: 'ac', from: 'a', to: 'c' },
    ],
    layers: [{ id: 'extra', hidden: true }],
  };

  it('omits hidden elements and any edge touching them', async () => {
    const layout = await layoutDiagram(layered);
    expect(layout.nodes.map((n) => n.id)).toEqual(['a', 'c']);
    expect(layout.edges.map((e) => e.id)).toEqual(['ac']);
  });

  it('leaves the visible nodes where they would be with the layer shown', async () => {
    const hidden = await layoutDiagram(layered);
    const shown = await layoutDiagram({ ...layered, layers: [{ id: 'extra' }] });
    expect(node(hidden, 'a')).toMatchObject({ x: node(shown, 'a').x, y: node(shown, 'a').y });
    expect(node(hidden, 'c')).toMatchObject({ x: node(shown, 'c').x, y: node(shown, 'c').y });
  });

  it('re-flows the remaining elements when asked', async () => {
    const compact = await layoutDiagram(layered, { keepHiddenSpace: false });
    expect(compact.nodes.map((n) => n.id)).toEqual(['a', 'c']);
  });
});
