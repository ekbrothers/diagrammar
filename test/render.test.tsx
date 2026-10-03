import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { layoutDiagram } from '../src/layout/index.js';
import { registerIcon, renderSvg, type RenderOptions } from '../src/render/index.js';
import { renderDiagram } from '../src/server/index.js';
import { DiagramView } from '../src/react/index.js';
import type { Diagram } from '../src/index.js';

const diagram: Diagram = {
  title: 'Request flow',
  description: 'A request moves from the client to the database.',
  nodes: [
    { id: 'web', label: 'Web <app>', subtitle: 'Next.js', type: 'card', icon: 'globe' },
    { id: 'api', label: 'API', role: 'primary' },
    { id: 'db', label: 'Postgres', type: 'database', role: 'success' },
    { id: 'user', label: 'Reader', type: 'actor' },
    { id: 'queue', label: 'Queue', type: 'pill', role: 'warning' },
    { id: 'old', label: 'Legacy', role: 'danger', type: 'shape' },
    { id: 'cache', label: 'Cache', role: 'muted' },
  ],
  edges: [
    { id: 'e1', from: 'user', to: 'web', label: 'visits' },
    { id: 'e2', from: 'web', to: 'api', style: 'dashed' },
    { id: 'e3', from: 'api', to: 'db', arrow: 'both', style: 'dotted' },
    { id: 'e4', from: 'api', to: 'queue', arrow: 'none' },
    { id: 'e5', from: 'api', to: 'cache', arrow: 'start', role: 'danger' },
  ],
};

async function draw(d: Diagram = diagram, options: RenderOptions = {}) {
  const layout = await layoutDiagram(d);
  return renderSvg(d, layout, options);
}

function edgeGroup(svg: string, id: string): string {
  const start = svg.indexOf(`<g class="edge`, svg.indexOf(`data-id="${id}"`) - 40);
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('renderSvg', () => {
  it('draws every node and edge into one self-contained svg', async () => {
    const svg = await draw();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    for (const n of diagram.nodes) expect(svg).toContain(`data-id="${n.id}"`);
    for (const e of diagram.edges!) expect(svg).toContain(`data-id="${e.id}"`);
    expect(svg).not.toContain('<script');
  });

  it('is deterministic', async () => {
    expect(await draw()).toBe(await draw());
  });

  it('escapes text so labels cannot inject markup', async () => {
    const svg = await draw();
    expect(svg).toContain('Web &lt;app&gt;');
    expect(svg).not.toContain('Web <app>');
  });

  it('draws each built-in node type', async () => {
    const svg = await draw();
    for (const type of ['card', 'database', 'actor', 'pill', 'shape', 'box']) expect(svg).toContain(`type-${type}`);
    expect(svg).toContain('<polygon');
  });

  it('shows status with shape as well as color', async () => {
    const svg = await draw();
    for (const role of ['success', 'warning', 'danger']) expect(svg).toContain(`data-role="${role}"`);
    expect(svg).toContain('.role-muted .shape{stroke-dasharray');
  });

  it('draws edge styles and arrowheads at the requested ends', async () => {
    const svg = await draw();
    expect(svg).toContain('stroke-dasharray="6 4"');
    expect(svg).toContain('stroke-dasharray="0.1 5"');
    const arrows = (id: string) => (edgeGroup(svg, id).match(/class="arrow"/g) ?? []).length;
    expect(arrows('e2')).toBe(1);
    expect(arrows('e3')).toBe(2);
    expect(arrows('e4')).toBe(0);
    expect(arrows('e5')).toBe(1);
  });

  it('puts edge labels on a background box', async () => {
    const svg = await draw();
    expect(svg).toContain('class="edge-label-box"');
    expect(svg).toContain('>visits<');
  });

  it('labels the diagram for assistive technology', async () => {
    const svg = await draw();
    expect(svg).toContain('role="img"');
    expect(svg).toContain('<title id=');
    expect(svg).toContain('Request flow');
    expect(svg).toContain('A request moves from the client to the database.');
    expect(svg).toContain('<title>Reader to Web &lt;app&gt;: visits</title>');
  });

  it('scopes every style rule to the diagram', async () => {
    const svg = await draw();
    const css = svg.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    const scope = svg.match(/class="(dg-[^"]+)"/)![1]!;
    for (const rule of css.split('\n')) {
      expect(rule.startsWith(`.${scope}`) || rule.startsWith('@media') || rule.startsWith(':is(')).toBe(true);
    }
  });
});

describe('appearance', () => {
  it('ships both palettes and follows the host by default', async () => {
    const svg = await draw();
    expect(svg).toContain('@media (prefers-color-scheme:dark)');
    expect(svg).toContain('[data-theme="dark"]');
    expect(svg).toContain('--dg-bg:#ffffff');
    expect(svg).toContain('--dg-bg:#0d1117');
  });

  it('can be pinned to one appearance', async () => {
    const dark = await draw(diagram, { mode: 'dark' });
    expect(dark).toContain('--dg-bg:#0d1117');
    expect(dark).not.toContain('--dg-bg:#ffffff');
    const light = await draw(diagram, { mode: 'light' });
    expect(light).not.toContain('prefers-color-scheme');
    expect(light).not.toContain('#0d1117');
  });

  it('changes every use of a token from one override', async () => {
    const svg = await draw(diagram, { tokens: { roles: { primary: { fill: '#ffeeee' } } }, mode: 'light' });
    expect(svg).toContain('--dg-primary-fill:#ffeeee');
    expect(svg).not.toContain('#ddf4ff');
  });

  it('accepts host css variables as token values', async () => {
    const svg = await draw(diagram, { tokens: { edge: 'var(--site-edge)' }, mode: 'light' });
    expect(svg).toContain('--dg-edge:var(--site-edge)');
  });

  it('switches to the high-contrast theme', async () => {
    const svg = await draw(diagram, { theme: 'high-contrast', mode: 'light' });
    expect(svg).toContain('--dg-bg:#ffffff');
    expect(svg).toContain('--dg-default-stroke:#000000');
  });

  it('overrides colors for a single node only', async () => {
    const d: Diagram = { nodes: [{ id: 'a', label: 'A', colors: { fill: '#abcdef' } }, { id: 'b', label: 'B' }] };
    const svg = await draw(d);
    const nodes = svg.split('<g class="node ').slice(1);
    expect(nodes[0]).toContain('style="--fill:#abcdef"');
    expect(nodes[1]).not.toContain('style=');
  });

  it('ignores unsafe per-node colors', async () => {
    const onWarning = vi.fn();
    const d: Diagram = { nodes: [{ id: 'a', label: 'A', colors: { fill: 'red;}x{' } }] };
    const svg = await draw(d, { onWarning });
    expect(svg).not.toContain('red;}');
    expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('unsafe fill'));
  });
});

describe('icons, links, and custom types', () => {
  it('draws built-in and registered icons', async () => {
    registerIcon('spark', '<path d="M12 2v20M2 12h20"/>');
    const d: Diagram = { nodes: [{ id: 'a', label: 'A', icon: 'spark' }, { id: 'b', label: 'B', icon: 'database' }] };
    const svg = await draw(d);
    expect(svg).toContain('M12 2v20M2 12h20');
    expect(svg).toContain('<ellipse');
  });

  it('accepts icons for a single render', async () => {
    const d: Diagram = { nodes: [{ id: 'a', label: 'A', icon: 'mine' }] };
    const svg = await draw(d, { icons: { mine: { body: '<circle cx="5" cy="5" r="4"/>', viewBox: '0 0 10 10' } } });
    expect(svg).toContain('<circle cx="5" cy="5" r="4"/>');
    expect(svg).toContain('scale(2)');
  });

  it('draws a placeholder and reports a missing icon', async () => {
    const onWarning = vi.fn();
    const d: Diagram = { nodes: [{ id: 'a', label: 'A', icon: 'nope' }] };
    const svg = await draw(d, { onWarning });
    expect(svg).toContain('data-missing-icon="nope"');
    expect(onWarning).toHaveBeenCalledWith('Icon "nope" is not registered.');
  });

  it('reports a missing icon once however many nodes use it', async () => {
    const onWarning = vi.fn();
    const d: Diagram = { nodes: [{ id: 'a', icon: 'nope' }, { id: 'b', icon: 'nope' }] };
    await draw(d, { onWarning });
    expect(onWarning).toHaveBeenCalledTimes(1);
  });

  it('wraps linked nodes in anchors and refuses script urls', async () => {
    const onWarning = vi.fn();
    const d: Diagram = {
      nodes: [
        { id: 'a', label: 'A', href: 'https://example.com/?a=1&b=2' },
        { id: 'b', label: 'B', href: 'javascript:alert(1)' },
        { id: 'c', label: 'C', href: '#a' },
      ],
    };
    const svg = await draw(d, { onWarning, id: 'x' });
    expect(svg).toContain('<a href="https://example.com/?a=1&amp;b=2">');
    expect(svg).not.toContain('javascript:');
    expect(svg).toContain('<a href="#dg-x-n-a">');
    expect(svg).toContain('role="group"');
    expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('not allowed'));
  });

  it('lets custom node types supply their outline and still takes part in layout', async () => {
    const d: Diagram = {
      nodes: [{ id: 'a', label: 'Gate', type: 'gate' }, { id: 'b', label: 'B' }],
      edges: [{ id: 'e', from: 'a', to: 'b' }],
    };
    const layout = await layoutDiagram(d);
    const svg = renderSvg(d, layout, {
      nodeTypes: {
        gate: (_n, box) =>
          `<ellipse class="shape" cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}"/>`,
      },
    });
    expect(svg).toContain('<ellipse class="shape"');
    expect(svg).toContain('Gate');
  });

  it('draws unregistered types as boxes and says so', async () => {
    const onWarning = vi.fn();
    const d: Diagram = { nodes: [{ id: 'a', label: 'A', type: 'mystery' }] };
    const svg = await draw(d, { onWarning });
    expect(svg).toContain('<rect class="shape"');
    expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('mystery'));
  });
});

describe('sizing and edge cases', () => {
  it('sizes the viewBox to the content with padding', async () => {
    const svg = await draw(diagram, { padding: 10 });
    const [, , w, h] = svg.match(/viewBox="([^"]+)"/)![1]!.split(' ').map(Number);
    expect(svg).toContain(`width="${w}" height="${h}"`);
    expect(svg).toContain('max-width:100%;height:auto');
  });

  it('renders an empty diagram', async () => {
    const svg = await draw({ nodes: [] });
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="-16 -16 32 32"');
  });

  it('renders groups behind their children', async () => {
    const d: Diagram = {
      nodes: [{ id: 'a', label: 'A', group: 'g' }],
      groups: [{ id: 'g', label: 'Backend' }],
    };
    const svg = await draw(d);
    expect(svg.indexOf('class="group-box"')).toBeLessThan(svg.indexOf('type-box'));
    expect(svg).toContain('>Backend<');
  });

  it('draws curved routes as curves', async () => {
    const d: Diagram = {
      nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      edges: [
        { id: 'e1', from: 'a', to: 'b' },
        { id: 'e2', from: 'a', to: 'c' },
        { id: 'e3', from: 'b', to: 'd' },
        { id: 'e4', from: 'c', to: 'd' },
        { id: 'e5', from: 'a', to: 'd' },
      ],
    };
    const layout = await layoutDiagram(d, { routing: 'curved' });
    expect(renderSvg(d, layout)).toMatch(/<path class="edge-line"[^>]* d="M[^"]*Q/);
  });
});

describe('integrations', () => {
  it('renders from a definition in one call', async () => {
    const svg = await renderDiagram(diagram, { mode: 'light', layout: { direction: 'down' } });
    expect(svg).toContain('data-id="web"');
  });

  it('rejects invalid definitions before drawing', async () => {
    await expect(renderDiagram({ nodes: [{ id: 'a' }, { id: 'a' }] })).rejects.toThrow(/used by both/);
  });

  it('produces the full svg in server-rendered react markup', async () => {
    const layout = await layoutDiagram(diagram);
    const html = renderToStaticMarkup(<DiagramView diagram={diagram} layout={layout} className="wrap" />);
    expect(html.startsWith('<div class="wrap"><svg')).toBe(true);
    for (const n of diagram.nodes) expect(html).toContain(`data-id="${n.id}"`);
    expect(html).toBe(`<div class="wrap">${renderSvg(diagram, layout)}</div>`);
  });
});
