import { describe, expect, it } from 'vitest';
import { concepts } from '../src/icons/concepts.js';
import { logos } from '../src/logos/index.js';
import { registerIconPack, renderSvg } from '../src/render/index.js';
import { layoutDiagram } from '../src/layout/index.js';
import type { Diagram } from '../src/schema/types.js';

const names = Object.keys(concepts);

describe('concept icons', () => {
  it('covers the infrastructure ideas the specification names', () => {
    for (const name of ['workspace', 'project', 'module', 'state-file', 'plan', 'apply', 'queue', 'cache', 'job', 'schedule', 'secret']) {
      expect(names).toContain(name);
    }
  });

  it('are outline icons that follow the text color', () => {
    for (const [name, icon] of Object.entries(concepts)) {
      expect(icon.color, name).toBeUndefined();
      expect(icon.body, name).not.toContain('fill="#');
    }
  });

  it('contain only drawing instructions', () => {
    for (const [name, icon] of Object.entries(concepts)) {
      expect(icon.body, name).not.toMatch(/<script|<text|on\w+=|href/i);
    }
  });

  it('draw when used in a diagram', async () => {
    registerIconPack('concept', concepts);
    const diagram: Diagram = { nodes: names.map((n) => ({ id: n, label: n, icon: `concept:${n}` })) };
    const warnings: string[] = [];
    const svg = renderSvg(diagram, await layoutDiagram(diagram), { onWarning: (m) => warnings.push(m) });
    expect(warnings).toEqual([]);
    expect(svg.match(/class="icon"/g)).toHaveLength(names.length);
  });
});

describe('bundled logos', () => {
  it('includes Snowflake, which the first set lacked', () => {
    expect(logos.snowflake).toBeDefined();
    expect(logos.snowflake?.color).toBe(true);
  });

  it('does not include marks whose owners asked to be removed from the source set', () => {
    // Simple Icons dropped these at the trademark holder's request, so they must not reappear.
    for (const absent of ['aws', 'amazonwebservices', 'azure', 'microsoftazure', 'slack']) {
      expect(Object.keys(logos)).not.toContain(absent);
    }
  });

  it('keeps every logo a color icon with its own viewBox', () => {
    for (const [name, icon] of Object.entries(logos)) {
      expect(icon.color, name).toBe(true);
      expect(icon.viewBox, name).toBeDefined();
    }
  });
});
