import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { parseDiagram, type ValidateOptions } from '../schema/validate.js';
import type {
  Diagram as DiagramDefinition,
  DiagramEdge,
  DiagramGroup,
  DiagramLayer,
  DiagramNode,
} from '../schema/types.js';

export type NodeProps = DiagramNode;
export type EdgeProps = Omit<DiagramEdge, 'id'> & { id?: string };
export type GroupProps = Omit<DiagramGroup, 'parent'> & { children?: ReactNode };
export type LayerProps = DiagramLayer & { children?: ReactNode };
export type DiagramProps = Omit<DiagramDefinition, 'nodes' | 'edges' | 'groups' | 'layers'> & {
  children?: ReactNode;
};

// These components only describe a diagram. They draw nothing themselves;
// definitionFromElement() reads their props and the renderer draws the result.
export function Diagram(props: DiagramProps): null {
  void props;
  return null;
}
export function Node(props: NodeProps): null {
  void props;
  return null;
}
export function Edge(props: EdgeProps): null {
  void props;
  return null;
}
export function Group(props: GroupProps): null {
  void props;
  return null;
}
export function Layer(props: LayerProps): null {
  void props;
  return null;
}

interface Context {
  group?: string;
  layer?: string;
}

interface Collected {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  layers: DiagramLayer[];
}

function describe(element: ReactElement): string {
  const type = element.type;
  if (typeof type === 'string') return `<${type}>`;
  if (typeof type === 'function') return `<${type.name || 'Anonymous'}>`;
  return 'an unknown element';
}

function walk(children: ReactNode, ctx: Context, out: Collected, edgeCounts: Map<string, number>): void {
  Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (!isValidElement(child)) {
      if (typeof child === 'string' && child.trim() === '') return;
      throw new Error(
        `Diagrams can only contain <Node>, <Edge>, <Group>, and <Layer>, but found text ("${String(child).slice(0, 30)}"). Put labels in the label prop.`,
      );
    }
    const element = child as ReactElement<Record<string, unknown> & { children?: ReactNode }>;

    if (element.type === Fragment) {
      walk(element.props.children, ctx, out, edgeCounts);
      return;
    }

    if (element.type === Node) {
      const props = element.props as unknown as NodeProps;
      out.nodes.push({
        ...props,
        group: props.group ?? ctx.group,
        layer: props.layer ?? ctx.layer,
      });
      return;
    }

    if (element.type === Edge) {
      const props = element.props as unknown as EdgeProps;
      const base = props.id ?? `${props.from}->${props.to}`;
      const count = (edgeCounts.get(base) ?? 0) + 1;
      edgeCounts.set(base, count);
      out.edges.push({
        ...props,
        id: props.id ?? (count === 1 ? base : `${base}#${count}`),
        layer: props.layer ?? ctx.layer,
      });
      return;
    }

    if (element.type === Group) {
      const { children: inner, ...props } = element.props as unknown as GroupProps;
      out.groups.push({ ...props, parent: ctx.group, layer: props.layer ?? ctx.layer });
      walk(inner, { ...ctx, group: props.id }, out, edgeCounts);
      return;
    }

    if (element.type === Layer) {
      const { children: inner, ...props } = element.props as unknown as LayerProps;
      out.layers.push(props);
      walk(inner, { ...ctx, layer: props.id }, out, edgeCounts);
      return;
    }

    throw new Error(
      `Diagrams can only contain <Node>, <Edge>, <Group>, and <Layer>, but found ${describe(element)}. Wrap custom components so they return those elements directly, or call them as functions.`,
    );
  });
}

function dropUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Reads a <Diagram> element tree and returns the equivalent plain definition,
 * validated. The result matches what an author would write by hand.
 */
export function definitionFromElement(element: ReactElement, options: ValidateOptions = {}): DiagramDefinition {
  if (!isValidElement(element) || element.type !== Diagram) {
    throw new Error('definitionFromElement() expects a <Diagram> element.');
  }
  const { children, ...rest } = element.props as DiagramProps;
  const out: Collected = { nodes: [], edges: [], groups: [], layers: [] };
  walk(children, {}, out, new Map());

  const definition: DiagramDefinition = {
    ...dropUndefined(rest),
    nodes: out.nodes.map(dropUndefined),
  };
  if (out.edges.length > 0) definition.edges = out.edges.map(dropUndefined);
  if (out.groups.length > 0) definition.groups = out.groups.map(dropUndefined);
  if (out.layers.length > 0) definition.layers = out.layers.map(dropUndefined);
  return parseDiagram(definition, options);
}
