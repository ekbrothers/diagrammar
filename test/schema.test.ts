import { describe, expect, it } from 'vitest';
import { DiagramValidationError, parseDiagram, validateDiagram, type Diagram } from '../src/index.js';

const minimal: Diagram = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  edges: [{ id: 'a-b', from: 'a', to: 'b' }],
};

function errorsOf(input: unknown) {
  const result = validateDiagram(input);
  if (result.ok) throw new Error('expected validation to fail');
  return result.errors;
}

describe('serializable definition', () => {
  it('accepts a minimal definition of two nodes and one edge', () => {
    expect(validateDiagram(minimal).ok).toBe(true);
  });

  it('round-trips through JSON unchanged', () => {
    const full: Diagram = {
      version: 1,
      title: 'Full',
      nodes: [{ id: 'a', group: 'g', layer: 'l', role: 'primary', x: 10, y: 20 }, { id: 'b' }],
      edges: [{ id: 'e', from: 'a', to: 'b', style: 'dashed', arrow: 'both' }],
      groups: [{ id: 'g', label: 'Group' }],
      layers: [{ id: 'l', hidden: true }],
    };
    expect(parseDiagram(JSON.parse(JSON.stringify(full)))).toEqual(full);
  });

  it('rejects functions in a definition', () => {
    const errors = errorsOf({ nodes: [{ id: 'a', label: () => 'x' }] });
    expect(errors[0]?.path).toBe('nodes[0].label');
  });
});

describe('stable identifiers', () => {
  it('names both elements when an identifier is duplicated', () => {
    const errors = errorsOf({ nodes: [{ id: 'a' }, { id: 'a' }] });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('duplicate-id');
    expect(errors[0]?.message).toContain('nodes[0]');
    expect(errors[0]?.message).toContain('nodes[1]');
  });

  it('treats ids as unique across element kinds', () => {
    const errors = errorsOf({ nodes: [{ id: 'x' }], groups: [{ id: 'x' }] });
    expect(errors[0]?.code).toBe('duplicate-id');
  });
});

describe('validation reporting', () => {
  it('reports a dangling edge endpoint with edge id and path', () => {
    const errors = errorsOf({ nodes: [{ id: 'a' }], edges: [{ id: 'e1', from: 'a', to: 'missing' }] });
    expect(errors[0]).toMatchObject({ code: 'unknown-endpoint', path: 'edges[0].to' });
    expect(errors[0]?.message).toContain('e1');
    expect(errors[0]?.message).toContain('missing');
  });

  it('reports every problem, not only the first', () => {
    const errors = errorsOf({
      nodes: [{ id: 'a', group: 'nope' }, { id: 'a' }],
      edges: [{ id: 'e', from: 'a', to: 'ghost', layer: 'none' }],
    });
    const codes = errors.map((e) => e.code).sort();
    expect(codes).toEqual(['duplicate-id', 'unknown-endpoint', 'unknown-group', 'unknown-layer']);
  });

  it('reports structural problems with a field path', () => {
    const errors = errorsOf({ nodes: [{ id: 'a', role: 'purple' }] });
    expect(errors[0]).toMatchObject({ code: 'invalid', path: 'nodes[0].role' });
  });

  it('rejects unknown fields so typos are caught', () => {
    const errors = errorsOf({ nodes: [{ id: 'a', lable: 'typo' }] });
    expect(errors[0]?.code).toBe('invalid');
  });

  it('detects groups nested inside themselves', () => {
    const errors = errorsOf({
      nodes: [],
      groups: [
        { id: 'g1', parent: 'g2' },
        { id: 'g2', parent: 'g1' },
      ],
    });
    expect(errors.some((e) => e.code === 'group-cycle')).toBe(true);
  });

  it('throws a DiagramValidationError from parseDiagram', () => {
    expect(() => parseDiagram({ nodes: [{ id: 'a' }, { id: 'a' }] })).toThrow(DiagramValidationError);
  });
});

describe('versioning', () => {
  it('treats a missing version as current', () => {
    expect(validateDiagram(minimal).ok).toBe(true);
  });

  it('accepts the current version', () => {
    expect(validateDiagram({ ...minimal, version: 1 }).ok).toBe(true);
  });

  it('refuses a newer version and says what is supported', () => {
    const errors = errorsOf({ ...minimal, version: 2 });
    expect(errors[0]?.code).toBe('unsupported-version');
    expect(errors[0]?.message).toContain('supports version 1');
  });
});

describe('layers', () => {
  it('accepts elements assigned to a hidden layer', () => {
    const result = validateDiagram({
      nodes: [{ id: 'a', layer: 'l' }],
      layers: [{ id: 'l', hidden: true }],
    });
    expect(result.ok).toBe(true);
  });
});
