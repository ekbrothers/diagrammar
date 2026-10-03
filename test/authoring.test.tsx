import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  defineDiagram,
  DiagramSourceError,
  DiagramValidationError,
  loadDiagram,
  parseDiagram,
  type Diagram,
} from '../src/index.js';
import { Diagram as DiagramEl, Edge, Group, Layer, Node, definitionFromElement } from '../src/react/index.js';

const plain: Diagram = {
  title: 'Request flow',
  nodes: [
    { id: 'web', label: 'Web', group: 'edge' },
    { id: 'api', label: 'API' },
  ],
  edges: [
    { id: 'web->api', from: 'web', to: 'api', label: 'HTTPS' },
  ],
  groups: [{ id: 'edge', label: 'Edge' }],
};

describe('component authoring', () => {
  it('produces the same definition as the plain data form', () => {
    const fromComponents = definitionFromElement(
      <DiagramEl title="Request flow">
        <Group id="edge" label="Edge">
          <Node id="web" label="Web" />
        </Group>
        <Node id="api" label="API" />
        <Edge from="web" to="api" label="HTTPS" />
      </DiagramEl>,
    );
    expect(fromComponents).toEqual(parseDiagram(plain));
  });

  it('accepts fragments, nulls, and false', () => {
    const def = definitionFromElement(
      <DiagramEl>
        <>
          <Node id="a" />
          {null}
          {false}
          {'  '}
        </>
        <Node id="b" />
      </DiagramEl>,
    );
    expect(def.nodes.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('nests groups and records the parent', () => {
    const def = definitionFromElement(
      <DiagramEl>
        <Group id="outer">
          <Group id="inner">
            <Node id="n" />
          </Group>
        </Group>
      </DiagramEl>,
    );
    expect(def.groups).toEqual([{ id: 'outer' }, { id: 'inner', parent: 'outer' }]);
    expect(def.nodes[0]?.group).toBe('inner');
  });

  it('assigns elements inside a Layer to that layer', () => {
    const def = definitionFromElement(
      <DiagramEl>
        <Layer id="extra" hidden>
          <Node id="a" />
          <Node id="b" layer="other" />
        </Layer>
        <Layer id="other" />
        <Edge from="a" to="b" />
      </DiagramEl>,
    );
    expect(def.layers).toEqual([{ id: 'extra', hidden: true }, { id: 'other' }]);
    expect(def.nodes.map((n) => n.layer)).toEqual(['extra', 'other']);
  });

  it('numbers parallel edges so ids stay unique', () => {
    const def = definitionFromElement(
      <DiagramEl>
        <Node id="a" />
        <Node id="b" />
        <Edge from="a" to="b" />
        <Edge from="a" to="b" />
        <Edge from="a" to="b" id="named" />
      </DiagramEl>,
    );
    expect(def.edges?.map((e) => e.id)).toEqual(['a->b', 'a->b#2', 'named']);
  });

  it('reports validation problems with the usual error', () => {
    expect(() =>
      definitionFromElement(
        <DiagramEl>
          <Node id="a" />
          <Edge from="a" to="nowhere" />
        </DiagramEl>,
      ),
    ).toThrow(DiagramValidationError);
  });

  it('explains what to do about stray text', () => {
    expect(() =>
      definitionFromElement(
        <DiagramEl>
          <Node id="a" />
          Hello
        </DiagramEl>,
      ),
    ).toThrow(/label prop/);
  });

  it('names the element it does not understand', () => {
    const Custom = () => null;
    expect(() =>
      definitionFromElement(
        <DiagramEl>
          <Custom />
        </DiagramEl>,
      ),
    ).toThrow(/<Custom>/);
    expect(() =>
      definitionFromElement(
        <DiagramEl>
          <div />
        </DiagramEl>,
      ),
    ).toThrow(/<div>/);
  });

  it('requires a Diagram root', () => {
    expect(() => definitionFromElement(<Node id="a" />)).toThrow(/<Diagram>/);
  });

  it('renders nothing itself', () => {
    expect(DiagramEl({})).toBeNull();
    expect(Node({ id: 'a' })).toBeNull();
    expect(Edge({ from: 'a', to: 'b' })).toBeNull();
    expect(Group({ id: 'g' })).toBeNull();
    expect(Layer({ id: 'l' })).toBeNull();
  });
});

describe('data authoring', () => {
  it('loads a definition object', () => {
    expect(loadDiagram(plain)).toEqual(plain);
  });

  it('loads a definition that came from JSON on disk or in a database', () => {
    expect(loadDiagram(JSON.parse(JSON.stringify(plain)))).toEqual(plain);
  });
});

describe('content embedding', () => {
  it('loads a definition passed as one string', () => {
    expect(loadDiagram(JSON.stringify(plain))).toEqual(plain);
  });

  it('survives a trip through an attribute-style string', () => {
    const attribute = JSON.stringify(plain).replace(/"/g, '&quot;').replace(/&quot;/g, '"');
    expect(loadDiagram(attribute)).toEqual(plain);
  });

  it('explains malformed JSON', () => {
    expect(() => loadDiagram('{nodes: []}')).toThrow(DiagramSourceError);
    expect(() => loadDiagram('{nodes: []}')).toThrow(/not valid JSON/);
  });

  it('still validates the content of a valid string', () => {
    expect(() => loadDiagram('{"nodes":[{"id":"a"},{"id":"a"}]}')).toThrow(DiagramValidationError);
  });
});

describe('typed authoring', () => {
  it('accepts built-in node types', () => {
    const d = defineDiagram({ nodes: [{ id: 'a', type: 'card' }] });
    expect(d.nodes[0]?.type).toBe('card');
  });

  it('accepts custom types only when declared', () => {
    const d = defineDiagram<'queue'>({ nodes: [{ id: 'a', type: 'queue' }] });
    expectTypeOf(d.nodes[0]?.type).toEqualTypeOf<
      'box' | 'pill' | 'card' | 'database' | 'actor' | 'shape' | 'queue' | undefined
    >();
  });

  it('rejects an undeclared node type at compile time', () => {
    // @ts-expect-error "queue" is not a built-in type and was not registered
    defineDiagram({ nodes: [{ id: 'a', type: 'queue' }] });
  });

  it('reports an unknown node type at validation time, with the choices', () => {
    expect(() => parseDiagram({ nodes: [{ id: 'a', type: 'queue' }] })).toThrow(/Available types: box, pill/);
  });

  it('lets a registered custom type through validation', () => {
    expect(() => parseDiagram({ nodes: [{ id: 'a', type: 'queue' }] }, { nodeTypes: ['queue'] })).not.toThrow();
  });
});
