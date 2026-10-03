import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api.js';
import type { Diagram, DiagramNode } from '../schema/types.js';
import { DEFAULT_METRICS, wrapText } from './text.js';
import {
  LAYOUT_VERSION,
  layoutSchema,
  type LaidOutEdge,
  type LaidOutGroup,
  type LaidOutNode,
  type Layout,
  type LayoutOptions,
  type Point,
} from './types.js';

import { ACTOR_EXTRA, DATABASE_EXTRA, ICON_SPACE, NODE_PAD_X, NODE_PAD_Y } from '../metrics.js';

export * from './types.js';
export { wrapText, textWidth, DEFAULT_METRICS, type TextMetrics, type WrappedText } from './text.js';

const MIN_NODE_WIDTH = 64;
const MIN_NODE_HEIGHT = 36;
const GROUP_LABEL_HEIGHT = 24;
const EDGE_LABEL_MAX_WIDTH = 160;
const PARALLEL_EDGE_GAP = 14;

const DEFAULTS = {
  strategy: 'layered',
  direction: 'right',
  routing: 'orthogonal',
  maxNodeWidth: 220,
  spacing: 40,
  groupPadding: 20,
  keepHiddenSpace: true,
} as const satisfies Required<LayoutOptions>;

const ALGORITHMS = { layered: 'layered', tree: 'mrtree', radial: 'radial' } as const;
const DIRECTIONS = { right: 'RIGHT', down: 'DOWN', left: 'LEFT', up: 'UP' } as const;
const ROUTING = { straight: 'POLYLINE', orthogonal: 'ORTHOGONAL', curved: 'SPLINES' } as const;

const elk = new ELK();

const round = (n: number) => Math.round(n * 100) / 100;

interface Size {
  width: number;
  height: number;
  lines: string[];
  subtitleLines: string[];
}

function sizeNode(node: DiagramNode, maxWidth: number): Size {
  const iconSpace = node.icon && node.type !== 'actor' ? ICON_SPACE : 0;
  const extra = node.type === 'actor' ? ACTOR_EXTRA : node.type === 'database' ? DATABASE_EXTRA : 0;
  const limit = (node.width ?? maxWidth) - NODE_PAD_X * 2 - iconSpace;
  const label = wrapText(node.label ?? '', limit, DEFAULT_METRICS);
  const subtitle = wrapText(node.subtitle ?? '', limit, { ...DEFAULT_METRICS, fontSize: 12 });
  const gap = label.lines.length > 0 && subtitle.lines.length > 0 ? 4 : 0;

  const contentWidth = Math.max(label.width, subtitle.width);
  const contentHeight = label.height + gap + subtitle.height;
  return {
    width: node.width ?? Math.max(MIN_NODE_WIDTH, contentWidth + NODE_PAD_X * 2 + iconSpace),
    height: node.height ?? Math.max(MIN_NODE_HEIGHT, contentHeight + NODE_PAD_Y * 2) + extra,
    lines: label.lines,
    subtitleLines: subtitle.lines,
  };
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clipToBox(box: Box, toward: Point): Point {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale = Math.min(
    dx === 0 ? Infinity : box.width / 2 / Math.abs(dx),
    dy === 0 ? Infinity : box.height / 2 / Math.abs(dy),
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function routeSimple(a: Box, b: Box, routing: LaidOutEdge['routing']): Point[] {
  const ac = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const bc = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  if (routing !== 'orthogonal') return [clipToBox(a, bc), clipToBox(b, ac)];

  const dx = bc.x - ac.x;
  const dy = bc.y - ac.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const start = { x: dx >= 0 ? a.x + a.width : a.x, y: ac.y };
    const end = { x: dx >= 0 ? b.x : b.x + b.width, y: bc.y };
    const midX = (start.x + end.x) / 2;
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  }
  const start = { x: ac.x, y: dy >= 0 ? a.y + a.height : a.y };
  const end = { x: bc.x, y: dy >= 0 ? b.y : b.y + b.height };
  const midY = (start.y + end.y) / 2;
  return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
}

function midpoint(points: Point[]): Point {
  const total = points.slice(1).reduce((sum, p, i) => {
    const prev = points[i] as Point;
    return sum + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);
  let remaining = total / 2;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= length && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return points[0] as Point;
}

export async function layoutDiagram(diagram: Diagram, options: LayoutOptions = {}): Promise<Layout> {
  const opts = { ...DEFAULTS, ...options };
  const groups = diagram.groups ?? [];
  const edges = diagram.edges ?? [];
  const layerHidden = new Set((diagram.layers ?? []).filter((l) => l.hidden).map((l) => l.id));
  const isHidden = (layer: string | undefined) => layer !== undefined && layerHidden.has(layer);

  const nodeSource = opts.keepHiddenSpace ? diagram.nodes : diagram.nodes.filter((n) => !isHidden(n.layer));
  const nodeIdsKept = new Set(nodeSource.map((n) => n.id));
  const edgeSource = opts.keepHiddenSpace
    ? edges
    : edges.filter((e) => !isHidden(e.layer) && nodeIdsKept.has(e.from) && nodeIdsKept.has(e.to));
  const groupSource = opts.keepHiddenSpace ? groups : groups.filter((g) => !isHidden(g.layer));

  const sizes = new Map(nodeSource.map((n) => [n.id, sizeNode(n, opts.maxNodeWidth)] as const));
  const pinned = (n: DiagramNode) => n.x !== undefined && n.y !== undefined;
  const allPinned = nodeSource.length > 0 && nodeSource.every(pinned);

  const boxes = new Map<string, Box>();
  const groupBoxes = new Map<string, Box>();
  const elkEdgePoints = new Map<string, Point[]>();
  const elkLabelPositions = new Map<string, Point>();

  if (!allPinned && nodeSource.length > 0) {
    const padding = `[top=${opts.groupPadding + GROUP_LABEL_HEIGHT},left=${opts.groupPadding},bottom=${opts.groupPadding},right=${opts.groupPadding}]`;
    const knownGroups = new Set(groupSource.map((g) => g.id));

    const makeGroup = (id: string): ElkNode => ({
      id,
      layoutOptions: { 'elk.padding': padding },
      children: [
        ...groupSource.filter((g) => g.parent === id).map((g) => makeGroup(g.id)),
        ...nodeSource.filter((n) => n.group === id).map(makeLeaf),
      ],
    });
    const makeLeaf = (n: DiagramNode): ElkNode => {
      const size = sizes.get(n.id) as Size;
      return { id: n.id, width: size.width, height: size.height };
    };

    const root: ElkNode = {
      id: '__root__',
      layoutOptions: {
        'elk.algorithm': `org.eclipse.elk.${ALGORITHMS[opts.strategy]}`,
        'elk.direction': DIRECTIONS[opts.direction],
        'elk.edgeRouting': ROUTING[opts.routing],
        'elk.spacing.nodeNode': String(opts.spacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(opts.spacing * 1.25),
        'elk.spacing.edgeNode': String(opts.spacing / 2),
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.json.shapeCoords': 'ROOT',
        'elk.json.edgeCoords': 'ROOT',
        'elk.padding': '[top=0,left=0,bottom=0,right=0]',
      },
      children: [
        ...groupSource.filter((g) => !g.parent || !knownGroups.has(g.parent)).map((g) => makeGroup(g.id)),
        ...nodeSource.filter((n) => !n.group || !knownGroups.has(n.group)).map(makeLeaf),
      ],
      edges: edgeSource.map((e): ElkExtendedEdge => {
        const label = e.label ? wrapText(e.label, EDGE_LABEL_MAX_WIDTH, { ...DEFAULT_METRICS, fontSize: 12 }) : null;
        return {
          id: e.id,
          sources: [e.from],
          targets: [e.to],
          ...(label ? { labels: [{ text: e.label as string, width: label.width + 8, height: label.height + 4 }] } : {}),
        };
      }),
    };

    const result = await elk.layout(root);

    const visit = (node: ElkNode, depth: number) => {
      for (const child of node.children ?? []) {
        const box = { x: child.x ?? 0, y: child.y ?? 0, width: child.width ?? 0, height: child.height ?? 0 };
        if (sizes.has(child.id)) boxes.set(child.id, box);
        else {
          groupBoxes.set(child.id, box);
          visit(child, depth + 1);
        }
      }
    };
    visit(result, 0);

    for (const edge of result.edges ?? []) {
      const section = edge.sections?.[0];
      if (!section) continue;
      elkEdgePoints.set(edge.id, [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]);
      const label = edge.labels?.[0];
      if (label?.x !== undefined && label.y !== undefined) {
        elkLabelPositions.set(edge.id, {
          x: label.x + (label.width ?? 0) / 2,
          y: label.y + (label.height ?? 0) / 2,
        });
      }
    }
  }

  // Pins override whatever the engine decided.
  const pins = nodeSource.filter(pinned);
  const touched = new Set<string>();
  for (const n of pins) {
    const size = sizes.get(n.id) as Size;
    boxes.set(n.id, { x: n.x as number, y: n.y as number, width: size.width, height: size.height });
    touched.add(n.id);
  }

  if (pins.length > 0) {
    // Move unpinned nodes out from under pinned ones along the flow direction.
    const axis = opts.direction === 'right' || opts.direction === 'left' ? 'x' : 'y';
    const sign = opts.direction === 'right' || opts.direction === 'down' ? 1 : -1;
    const margin = opts.spacing / 2;
    for (const n of nodeSource) {
      if (pinned(n)) continue;
      const box = boxes.get(n.id);
      if (!box) continue;
      for (let guard = 0; guard < 50; guard++) {
        const hit = pins.map((p) => boxes.get(p.id) as Box).find(
          (p) =>
            box.x < p.x + p.width + margin &&
            box.x + box.width + margin > p.x &&
            box.y < p.y + p.height + margin &&
            box.y + box.height + margin > p.y,
        );
        if (!hit) break;
        const size = axis === 'x' ? 'width' : 'height';
        box[axis] = sign === 1 ? hit[axis] + hit[size] + margin : hit[axis] - box[size] - margin;
      }
    }

    // Groups must still contain their members.
    const depthOf = (id: string): number => {
      const parent = groupSource.find((g) => g.id === id)?.parent;
      return parent ? 1 + depthOf(parent) : 0;
    };
    const ordered = [...groupSource].sort((a, b) => depthOf(b.id) - depthOf(a.id));
    for (const g of ordered) {
      const members: Box[] = [
        ...nodeSource.filter((n) => n.group === g.id).map((n) => boxes.get(n.id) as Box),
        ...groupSource.filter((c) => c.parent === g.id).map((c) => groupBoxes.get(c.id)).filter((b): b is Box => !!b),
      ];
      if (members.length === 0) continue;
      const pad = opts.groupPadding;
      const minX = Math.min(...members.map((b) => b.x)) - pad;
      const minY = Math.min(...members.map((b) => b.y)) - pad - GROUP_LABEL_HEIGHT;
      const maxX = Math.max(...members.map((b) => b.x + b.width)) + pad;
      const maxY = Math.max(...members.map((b) => b.y + b.height)) + pad;
      groupBoxes.set(g.id, { x: minX, y: minY, width: maxX - minX, height: maxY - minY });
    }
  }

  // Edges: keep the engine's route unless a pin moved one of its ends.
  let laidEdges: LaidOutEdge[] = edgeSource.flatMap((e) => {
    const a = boxes.get(e.from);
    const b = boxes.get(e.to);
    if (!a || !b) return [];
    const fromEngine = elkEdgePoints.get(e.id);
    const reroute = !fromEngine || touched.has(e.from) || touched.has(e.to);
    const points = reroute ? routeSimple(a, b, opts.routing) : fromEngine;
    const label = e.label
      ? wrapText(e.label, EDGE_LABEL_MAX_WIDTH, { ...DEFAULT_METRICS, fontSize: 12 })
      : null;
    const labelPosition = label ? (reroute ? midpoint(points) : (elkLabelPositions.get(e.id) ?? midpoint(points))) : undefined;
    return [
      {
        id: e.id,
        from: e.from,
        to: e.to,
        points,
        ...(labelPosition ? { labelPosition, labelLines: label?.lines } : {}),
        routing: opts.routing,
      },
    ];
  });

  // Edges between the same two nodes must not draw on top of each other.
  const byPair = new Map<string, LaidOutEdge[]>();
  for (const edge of laidEdges) {
    const key = [edge.from, edge.to].sort().join(' ');
    byPair.set(key, [...(byPair.get(key) ?? []), edge]);
  }
  for (const siblings of byPair.values()) {
    if (siblings.length < 2) continue;
    siblings.forEach((edge, i) => {
      const first = edge.points[0] as Point;
      const last = edge.points[edge.points.length - 1] as Point;
      const dx = last.x - first.x;
      const dy = last.y - first.y;
      const length = Math.hypot(dx, dy) || 1;
      const offset = (i - (siblings.length - 1) / 2) * PARALLEL_EDGE_GAP;
      const shift = { x: (-dy / length) * offset, y: (dx / length) * offset };
      const flip = edge.from > edge.to ? -1 : 1;
      edge.points = edge.points.map((p) => ({ x: p.x + shift.x * flip, y: p.y + shift.y * flip }));
      if (edge.labelPosition) edge.labelPosition = { x: edge.labelPosition.x + shift.x * flip, y: edge.labelPosition.y + shift.y * flip };
    });
  }

  // Hidden layers are laid out (so the rest does not move) but not returned.
  const keepNode = (n: DiagramNode) => !isHidden(n.layer);
  const visibleNodes = nodeSource.filter(keepNode);
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const edgeLayer = new Map(edgeSource.map((e) => [e.id, e.layer] as const));
  laidEdges = laidEdges.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to) && !isHidden(edgeLayer.get(e.id)),
  );

  const depthOf = (id: string): number => {
    const parent = groupSource.find((g) => g.id === id)?.parent;
    return parent ? 1 + depthOf(parent) : 0;
  };
  let laidGroups: LaidOutGroup[] = groupSource
    .filter((g) => !isHidden(g.layer) && groupBoxes.has(g.id))
    .map((g) => ({
      id: g.id,
      ...(groupBoxes.get(g.id) as Box),
      ...(g.label !== undefined ? { label: g.label } : {}),
      ...(g.parent !== undefined ? { parent: g.parent } : {}),
      depth: depthOf(g.id),
    }));
  let laidNodes: LaidOutNode[] = visibleNodes.flatMap((n) => {
    const box = boxes.get(n.id);
    if (!box) return [];
    const size = sizes.get(n.id) as Size;
    return [{ id: n.id, ...box, lines: size.lines, subtitleLines: size.subtitleLines, pinned: pinned(n) }];
  });

  // Normalize so the drawing starts at the origin.
  const xs = [
    ...laidNodes.flatMap((n) => [n.x, n.x + n.width]),
    ...laidGroups.flatMap((g) => [g.x, g.x + g.width]),
    ...laidEdges.flatMap((e) => e.points.map((p) => p.x)),
  ];
  const ys = [
    ...laidNodes.flatMap((n) => [n.y, n.y + n.height]),
    ...laidGroups.flatMap((g) => [g.y, g.y + g.height]),
    ...laidEdges.flatMap((e) => e.points.map((p) => p.y)),
  ];
  const minX = xs.length ? Math.min(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  // Pinned coordinates are the author's; only shift when nothing is pinned.
  const dx = pins.length > 0 ? 0 : -minX;
  const dy = pins.length > 0 ? 0 : -minY;
  const moveBox = <T extends Box>(b: T): T => ({ ...b, x: round(b.x + dx), y: round(b.y + dy) });
  const movePoint = (p: Point): Point => ({ x: round(p.x + dx), y: round(p.y + dy) });

  laidNodes = laidNodes.map((n) => ({ ...moveBox(n), width: round(n.width), height: round(n.height) }));
  laidGroups = laidGroups.map((g) => ({ ...moveBox(g), width: round(g.width), height: round(g.height) }));
  laidEdges = laidEdges.map((e) => ({
    ...e,
    points: e.points.map(movePoint),
    ...(e.labelPosition ? { labelPosition: movePoint(e.labelPosition) } : {}),
  }));

  const maxX = xs.length ? Math.max(...xs) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  return {
    version: LAYOUT_VERSION,
    width: round(maxX + dx),
    height: round(maxY + dy),
    nodes: laidNodes,
    groups: laidGroups,
    edges: laidEdges,
  };
}

/** Validates a layout computed earlier, for example at build time and stored as JSON. */
export function parseLayout(input: unknown): Layout {
  return layoutSchema.parse(input);
}
