import { describe, expect, it } from 'vitest';
import { MermaidError, fromMermaid, mermaidBlocks } from '../src/interop/mermaid.js';
import { validateDiagram } from '../src/index.js';

const convert = (source: string) => fromMermaid(source);
const ids = (source: string) => convert(source).diagram.nodes.map((n) => n.id);

describe('fromMermaid headers', () => {
  it('reads a minimal flowchart', () => {
    const { diagram } = convert('flowchart LR\n  A --> B');
    expect(diagram.nodes.map((n) => n.id)).toEqual(['A', 'B']);
    expect(diagram.edges).toEqual([{ id: 'e1', from: 'A', to: 'B' }]);
  });

  it('accepts the graph keyword', () => {
    expect(ids('graph TD\n  A --> B')).toEqual(['A', 'B']);
  });

  it('maps direction onto layout options', () => {
    expect(convert('flowchart LR\n A-->B').layout.direction).toBe('right');
    expect(convert('flowchart RL\n A-->B').layout.direction).toBe('left');
    expect(convert('flowchart TD\n A-->B').layout.direction).toBe('down');
    expect(convert('flowchart TB\n A-->B').layout.direction).toBe('down');
    expect(convert('flowchart BT\n A-->B').layout.direction).toBe('up');
  });

  it('reads a title from front matter', () => {
    expect(convert('---\ntitle: My flow\n---\nflowchart LR\n A-->B').diagram.title).toBe('My flow');
  });

  it('refuses a diagram kind that is not a flowchart', () => {
    expect(() => convert('sequenceDiagram\n  A->>B: hi')).toThrow(MermaidError);
    expect(() => convert('sequenceDiagram\n  A->>B: hi')).toThrow(/sequenceDiagram/);
    expect(() => convert('erDiagram\n  A ||--o{ B : has')).toThrow(/not supported/);
  });

  it('refuses source with no header', () => {
    expect(() => convert('A --> B')).toThrow(/flowchart/);
  });
});

describe('fromMermaid shapes', () => {
  it('maps stadium and cylinder to pill and database', () => {
    const { diagram } = convert('flowchart LR\n  A([Queue]) --> B[(Store)]');
    expect(diagram.nodes[0]).toMatchObject({ id: 'A', label: 'Queue', type: 'pill' });
    expect(diagram.nodes[1]).toMatchObject({ id: 'B', label: 'Store', type: 'database' });
  });

  it('treats a plain rectangle as the default and reports nothing', () => {
    const { diagram, report } = convert('flowchart LR\n  A[Box] --> B[Other]');
    // box is the default type, so it is left off rather than written onto every node.
    expect(diagram.nodes[0]).toMatchObject({ id: 'A', label: 'Box' });
    expect(diagram.nodes[0]?.type).toBeUndefined();
    expect(report).toEqual([]);
  });

  it('reports a shape with no matching type and still produces the node', () => {
    const { diagram, report } = convert('flowchart LR\n  A{Choice} --> B');
    expect(diagram.nodes[0]).toMatchObject({ id: 'A', label: 'Choice' });
    expect(diagram.nodes[0]?.type).toBeUndefined();
    expect(report).toContainEqual(expect.objectContaining({ line: 2, construct: 'shape' }));
  });

  it('uses the identifier as the label when there is none', () => {
    expect(convert('flowchart LR\n  Alpha --> Beta').diagram.nodes[0]?.label).toBe('Alpha');
  });

  it('strips quotes from a label', () => {
    expect(convert('flowchart LR\n  A["Quoted label"] --> B').diagram.nodes[0]?.label).toBe('Quoted label');
  });
});

describe('fromMermaid links', () => {
  it('reads a dotted labelled link', () => {
    const { diagram } = convert('flowchart LR\n  A -.->|maybe| B');
    expect(diagram.edges?.[0]).toMatchObject({ from: 'A', to: 'B', label: 'maybe', style: 'dotted' });
    expect(diagram.edges?.[0]?.arrow).toBeUndefined();
  });

  it('reads a link with no arrowhead as arrow none', () => {
    expect(convert('flowchart LR\n  A --- B').diagram.edges?.[0]?.arrow).toBe('none');
  });

  it('reads a bidirectional link', () => {
    expect(convert('flowchart LR\n  A <--> B').diagram.edges?.[0]?.arrow).toBe('both');
  });

  it('reads a chain of links on one line', () => {
    const { diagram } = convert('flowchart LR\n  A --> B --> C');
    expect(diagram.edges?.map((e) => `${e.from}-${e.to}`)).toEqual(['A-B', 'B-C']);
  });

  it('gives every edge a unique id', () => {
    const { diagram } = convert('flowchart LR\n  A --> B\n  B --> C\n  C --> A');
    const edgeIds = diagram.edges?.map((e) => e.id) ?? [];
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
  });
});

describe('fromMermaid subgraphs', () => {
  it('maps a subgraph to a group holding its nodes', () => {
    const { diagram } = convert('flowchart TD\n  subgraph s [Prod]\n    A\n  end');
    expect(diagram.groups).toEqual([{ id: 's', label: 'Prod' }]);
    expect(diagram.nodes[0]?.group).toBe('s');
  });

  it('nests groups and puts a node in the innermost one', () => {
    const source = 'flowchart TD\n  subgraph outer [Outer]\n    subgraph inner [Inner]\n      A\n    end\n  end';
    const { diagram } = convert(source);
    expect(diagram.groups).toEqual([{ id: 'outer', label: 'Outer' }, { id: 'inner', label: 'Inner', parent: 'outer' }]);
    expect(diagram.nodes[0]?.group).toBe('inner');
  });

  it('fails on a subgraph that is never closed, naming where it opened', () => {
    const error = (() => {
      try {
        convert('flowchart TD\n  subgraph s [S]\n    A --> B');
      } catch (e) {
        return e as MermaidError;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(MermaidError);
    expect(error?.line).toBe(2);
  });

  it('fails on an end with no subgraph', () => {
    expect(() => convert('flowchart TD\n  end')).toThrow(/without a matching/);
  });
});

describe('fromMermaid reporting', () => {
  it('reports styling directives with their line numbers', () => {
    const { report } = convert('flowchart LR\n  A --> B\n  classDef big fill:#f9f\n  style A fill:#bbf');
    expect(report).toContainEqual(expect.objectContaining({ line: 3, construct: 'classDef' }));
    expect(report).toContainEqual(expect.objectContaining({ line: 4, construct: 'style' }));
  });

  it('is empty when everything converted', () => {
    expect(convert('flowchart LR\n  A[One] --> B[Two]').report).toEqual([]);
  });

  it('ignores comments', () => {
    const { diagram, report } = convert('flowchart LR\n  %% just a note\n  A --> B');
    expect(diagram.nodes).toHaveLength(2);
    expect(report).toEqual([]);
  });
});

describe('fromMermaid identifiers', () => {
  it('keeps the later label when an identifier is declared twice', () => {
    const { diagram } = convert('flowchart TD\n  A[First]\n  A[Second]\n  A --> B');
    expect(diagram.nodes.filter((n) => n.id === 'A')).toHaveLength(1);
    expect(diagram.nodes.find((n) => n.id === 'A')?.label).toBe('Second');
  });

  it('rewrites an identifier that cannot be used as an id, and updates its edges', () => {
    const { diagram, report } = convert('flowchart TD\n  my node --> other');
    expect(diagram.nodes[0]?.id).toBe('my_node');
    expect(diagram.edges?.[0]?.from).toBe('my_node');
    expect(report).toContainEqual(expect.objectContaining({ construct: 'identifier' }));
  });
});

describe('fromMermaid output', () => {
  const sources = [
    'flowchart LR\n  A --> B',
    'flowchart TD\n  subgraph s [S]\n    A([Q]) -.->|x| B[(D)]\n  end\n  B --> C',
    'graph BT\n  one --- two\n  two ==> three',
    'flowchart LR\n  A{Choice} --> B[[Sub]]\n  classDef x fill:#fff',
  ];

  it('always produces a definition that validates', () => {
    for (const source of sources) {
      const { diagram } = convert(source);
      const result = validateDiagram(diagram);
      expect(result.ok, `${source} -> ${result.ok ? '' : JSON.stringify(result.errors)}`).toBe(true);
    }
  });
});

describe('mermaidBlocks', () => {
  it('finds fenced mermaid blocks in Markdown', () => {
    const md = '# T\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n```mermaid\ngraph TD\n  C --> D\n```\n';
    const blocks = mermaidBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('A --> B');
  });

  it('ignores other code fences', () => {
    expect(mermaidBlocks('```ts\nconst a = 1;\n```')).toEqual([]);
  });

  it('returns nothing when there are no fences', () => {
    expect(mermaidBlocks('plain text')).toEqual([]);
  });
});
