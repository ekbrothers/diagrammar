import { z } from 'zod';

export const LAYOUT_VERSION = 1;

export interface LayoutOptions {
  /** Layout algorithm. Default: layered. */
  strategy?: 'layered' | 'tree' | 'radial';
  /** Flow direction for layered and tree layouts. Default: right. */
  direction?: 'right' | 'down' | 'left' | 'up';
  /** Edge routing. Default: orthogonal. */
  routing?: 'straight' | 'orthogonal' | 'curved';
  /** Widest a node may be before its label wraps. Default: 220. */
  maxNodeWidth?: number;
  /** Space between nodes. Default: 40. */
  spacing?: number;
  /** Space inside a group around its contents. Default: 20. */
  groupPadding?: number;
  /** Lay out hidden layers too, then omit them, so visible elements do not move. Default: true. */
  keepHiddenSpace?: boolean;
}

const pointSchema = z.strictObject({ x: z.number(), y: z.number() });
const boxFields = { x: z.number(), y: z.number(), width: z.number(), height: z.number() };

export const laidOutNodeSchema = z.strictObject({
  id: z.string(),
  ...boxFields,
  lines: z.array(z.string()),
  subtitleLines: z.array(z.string()),
  pinned: z.boolean(),
});

export const laidOutGroupSchema = z.strictObject({
  id: z.string(),
  ...boxFields,
  label: z.string().optional(),
  parent: z.string().optional(),
  depth: z.number().int().nonnegative(),
});

export const laidOutEdgeSchema = z.strictObject({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  points: z.array(pointSchema).min(2),
  labelPosition: pointSchema.optional(),
  labelLines: z.array(z.string()).optional(),
  routing: z.enum(['straight', 'orthogonal', 'curved']),
});

export const layoutSchema = z.strictObject({
  version: z.literal(LAYOUT_VERSION),
  width: z.number(),
  height: z.number(),
  nodes: z.array(laidOutNodeSchema),
  groups: z.array(laidOutGroupSchema),
  edges: z.array(laidOutEdgeSchema),
});

export type Point = z.infer<typeof pointSchema>;
export type LaidOutNode = z.infer<typeof laidOutNodeSchema>;
export type LaidOutGroup = z.infer<typeof laidOutGroupSchema>;
export type LaidOutEdge = z.infer<typeof laidOutEdgeSchema>;
export type Layout = z.infer<typeof layoutSchema>;
