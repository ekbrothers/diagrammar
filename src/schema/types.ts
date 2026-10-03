import { z } from 'zod';

export const SCHEMA_VERSION = 1;
export const SUPPORTED_VERSIONS = [1] as const;

export const BUILT_IN_NODE_TYPES = ['box', 'pill', 'card', 'database', 'actor', 'shape'] as const;
export type BuiltInNodeType = (typeof BUILT_IN_NODE_TYPES)[number];

export const roleSchema = z.enum(['default', 'primary', 'success', 'warning', 'danger', 'muted']);
export const edgeStyleSchema = z.enum(['solid', 'dashed', 'dotted']);
export const arrowSchema = z.enum(['end', 'start', 'both', 'none']);

const idSchema = z.string().min(1);

export const nodeSchema = z.strictObject({
  id: idSchema,
  type: z.string().min(1).optional(),
  label: z.string().optional(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  role: roleSchema.optional(),
  group: idSchema.optional(),
  layer: idSchema.optional(),
  href: z.string().optional(),
  detail: z.string().optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const edgeSchema = z.strictObject({
  id: idSchema,
  from: idSchema,
  to: idSchema,
  fromPort: z.string().optional(),
  toPort: z.string().optional(),
  label: z.string().optional(),
  style: edgeStyleSchema.optional(),
  arrow: arrowSchema.optional(),
  role: roleSchema.optional(),
  layer: idSchema.optional(),
});

export const groupSchema = z.strictObject({
  id: idSchema,
  label: z.string().optional(),
  parent: idSchema.optional(),
  layer: idSchema.optional(),
  collapsed: z.boolean().optional(),
});

export const layerSchema = z.strictObject({
  id: idSchema,
  label: z.string().optional(),
  hidden: z.boolean().optional(),
});

export const diagramSchema = z.strictObject({
  version: z.number().int().positive().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema).optional(),
  groups: z.array(groupSchema).optional(),
  layers: z.array(layerSchema).optional(),
});

export type DiagramNode = z.infer<typeof nodeSchema>;
export type DiagramEdge = z.infer<typeof edgeSchema>;
export type DiagramGroup = z.infer<typeof groupSchema>;
export type DiagramLayer = z.infer<typeof layerSchema>;
export type Diagram = z.infer<typeof diagramSchema>;

export type TypedNode<Custom extends string = never> = Omit<DiagramNode, 'type'> & {
  type?: BuiltInNodeType | Custom;
};
export type TypedDiagram<Custom extends string = never> = Omit<Diagram, 'nodes'> & {
  nodes: TypedNode<Custom>[];
};
