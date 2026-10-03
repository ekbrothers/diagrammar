import type { Diagram, DiagramEdge, DiagramNode } from '../schema/types.js';
import type { LaidOutEdge, LaidOutGroup, LaidOutNode, Layout, Point } from '../layout/types.js';
import { DEFAULT_METRICS, textWidth } from '../layout/text.js';
import {
  ACTOR_EXTRA,
  DATABASE_CAP,
  EDGE_LABEL_FONT_SIZE,
  ICON_SIZE,
  ICON_SPACE,
  LABEL_FONT_SIZE,
  NODE_PAD_X,
  SUBTITLE_FONT_SIZE,
} from '../metrics.js';
import { lookupIcon, type IconMap } from './icons.js';
import {
  ROLES,
  applyTokens,
  assertSafeTheme,
  colorVariables,
  resolveTheme,
  type ColorOverrides,
  type Role,
  type Theme,
} from './theme.js';
import { esc, hash, isSafeCssValue, num, safeHref, warnOnce } from './util.js';

export * from './theme.js';
export { registerIcon, builtInIcons, type IconDefinition, type IconMap } from './icons.js';

/** Draws the outline of a custom node type. Text, icon, and status badge are added around it. */
export type NodeFrameRenderer = (node: DiagramNode, box: LaidOutNode) => string;

export interface RenderOptions {
  /** A built-in theme name or a theme object. Default: the default theme. */
  theme?: Theme | 'default' | 'high-contrast';
  /** Color overrides applied to both light and dark appearances. */
  tokens?: ColorOverrides;
  /** auto follows the host page, light and dark force one appearance. Default: auto. */
  mode?: 'auto' | 'light' | 'dark';
  /** Icons for this render, in addition to the registered and built-in ones. */
  icons?: IconMap;
  /** Frames for custom node types, keyed by the type name used in the diagram. */
  nodeTypes?: Record<string, NodeFrameRenderer>;
  /** Stable identifier used to scope styles and element ids. Set it when the same diagram appears twice on a page. */
  id?: string;
  title?: string;
  description?: string;
  /** Space around the diagram in pixels. Default: 16. */
  padding?: number;
  /** Receives development warnings such as unknown icons. Defaults to console.warn outside production. */
  onWarning?: (message: string) => void;
}

const LABEL_LINE = LABEL_FONT_SIZE * DEFAULT_METRICS.lineHeight;
const SUB_LINE = SUBTITLE_FONT_SIZE * DEFAULT_METRICS.lineHeight;
const EDGE_LABEL_LINE = EDGE_LABEL_FONT_SIZE * DEFAULT_METRICS.lineHeight;
const EDGE_LABEL_METRICS = { ...DEFAULT_METRICS, fontSize: EDGE_LABEL_FONT_SIZE };
const ARROW_LENGTH = 9;
const ARROW_HALF_WIDTH = 4.5;
const BADGE_RADIUS = 9;
const BUILT_IN_TYPES = new Set(['box', 'pill', 'card', 'database', 'actor', 'shape']);

interface Context {
  scope: string;
  theme: Theme;
  options: RenderOptions;
  nodes: Map<string, DiagramNode>;
  seenWarnings: Set<string>;
}

const decl = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

function buildCss(scope: string, theme: Theme, mode: NonNullable<RenderOptions['mode']>): string {
  const s = `.${scope}`;
  const light = decl(colorVariables(theme.light));
  const dark = decl(colorVariables(theme.dark));
  const sw = theme.strokeWidth;

  const rules: string[] = [];
  if (mode === 'dark') {
    rules.push(`${s}{${dark}}`);
  } else {
    rules.push(`${s}{${light}}`);
    if (mode === 'auto') {
      rules.push(`@media (prefers-color-scheme:dark){:root:not([data-theme="light"]):not(.light) ${s}{${dark}}}`);
      rules.push(`:is(.dark,[data-theme="dark"]) ${s}{${dark}}`);
    }
  }

  rules.push(`${s}{font-family:${theme.fontFamily};color:var(--dg-text)}`);
  for (const role of ROLES) {
    rules.push(`${s} .role-${role}{--fill:var(--dg-${role}-fill);--stroke:var(--dg-${role}-stroke);--text:var(--dg-${role}-text);--es:var(--dg-${role}-stroke)}`);
  }
  rules.push(
    `${s} text{font-family:inherit}`,
    `${s} .shape{fill:var(--fill);stroke:var(--stroke);stroke-width:${sw}px}`,
    `${s} .glyph{fill:none;stroke:var(--stroke);stroke-width:${sw}px;stroke-linecap:round;stroke-linejoin:round}`,
    `${s} .card .shape{filter:${theme.shadow}}`,
    `${s} .role-muted .shape{stroke-dasharray:5 3}`,
    `${s} .role-primary .shape{stroke-width:${num(sw * 1.7)}px}`,
    `${s} .lbl{fill:var(--text);font-size:${LABEL_FONT_SIZE}px}`,
    `${s} .card .lbl{font-weight:600}`,
    `${s} .sub{fill:var(--text);font-size:${SUBTITLE_FONT_SIZE}px}`,
    `${s} .icon{color:var(--text)}`,
    `${s} .badge{fill:var(--dg-bg);stroke:var(--stroke);stroke-width:${sw}px}`,
    `${s} .edge-line{fill:none;stroke:var(--es,var(--dg-edge));stroke-width:${sw}px;stroke-linecap:round;stroke-linejoin:round}`,
    `${s} .arrow{fill:var(--es,var(--dg-edge));stroke:none}`,
    `${s} .edge-label-box{fill:var(--dg-bg);stroke:none}`,
    `${s} .edge-label{fill:var(--dg-text);font-size:${EDGE_LABEL_FONT_SIZE}px}`,
    `${s} .group-box{fill:var(--dg-group-fill);stroke:var(--dg-group-stroke);stroke-width:1px}`,
    `${s} .group-label{fill:var(--dg-text-muted);font-size:12px;font-weight:600}`,
    `${s} a{cursor:pointer}`,
    `${s} a:focus-visible{outline:2px solid var(--dg-primary-stroke);outline-offset:3px}`,
  );
  return rules.join('\n');
}

function domId(ctx: Context, kind: string, id: string): string {
  return `${ctx.scope}-${kind}-${id.replace(/[^\w-]/g, '_')}`;
}

function frame(type: string, box: LaidOutNode, ctx: Context): string {
  const { x, y, width: w, height: h } = box;
  const r = ctx.theme.radius;
  const at = `x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"`;
  switch (type) {
    case 'pill':
      return `<rect class="shape" ${at} rx="${num(h / 2)}"/>`;
    case 'database': {
      const ry = DATABASE_CAP;
      const rx = w / 2;
      const body = `M${num(x)} ${num(y + ry)}a${num(rx)} ${ry} 0 0 1 ${num(w)} 0v${num(h - 2 * ry)}a${num(rx)} ${ry} 0 0 1 ${num(-w)} 0z`;
      const lip = `M${num(x)} ${num(y + ry)}a${num(rx)} ${ry} 0 0 0 ${num(w)} 0`;
      return `<path class="shape" d="${body}"/><path class="glyph" d="${lip}"/>`;
    }
    case 'actor': {
      const cx = x + w / 2;
      return (
        `<rect class="shape" ${at} rx="${r}"/>` +
        `<circle class="glyph" cx="${num(cx)}" cy="${num(y + 13)}" r="5.5"/>` +
        `<path class="glyph" d="M${num(cx - 10)} ${num(y + 28)}a10 9 0 0 1 20 0"/>`
      );
    }
    case 'shape': {
      const i = Math.min(h / 3, 16);
      const pts = [
        [x + i, y],
        [x + w - i, y],
        [x + w, y + h / 2],
        [x + w - i, y + h],
        [x + i, y + h],
        [x, y + h / 2],
      ];
      return `<polygon class="shape" points="${pts.map(([px, py]) => `${num(px!)},${num(py!)}`).join(' ')}"/>`;
    }
    default:
      return `<rect class="shape" ${at} rx="${r}"/>`;
  }
}

function iconMarkup(name: string, x: number, y: number, ctx: Context): string {
  const icon = lookupIcon(name, ctx.options.icons);
  if (!icon) {
    warnOnce(ctx.seenWarnings, `Icon "${name}" is not registered.`, ctx.options.onWarning);
    return (
      `<g class="icon" data-missing-icon="${esc(name)}" transform="translate(${num(x)} ${num(y)})">` +
      `<rect width="${ICON_SIZE}" height="${ICON_SIZE}" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>` +
      `<text x="${ICON_SIZE / 2}" y="${ICON_SIZE / 2}" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-size="12">?</text></g>`
    );
  }
  const parts = (icon.viewBox ?? '0 0 24 24').split(/[\s,]+/).map(Number);
  const [vx, vy, vw] = parts.length === 4 && parts.every(Number.isFinite) && parts[2]! > 0 ? parts : [0, 0, 24];
  const scale = ICON_SIZE / vw!;
  return (
    `<g class="icon" transform="translate(${num(x)} ${num(y)}) scale(${num(scale)}) translate(${-vx!} ${-vy!})" ` +
    `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.body}</g>`
  );
}

function badge(role: Role, x: number, y: number): string {
  const R = BADGE_RADIUS;
  let shape: string;
  let mark: string;
  if (role === 'success') {
    shape = `<circle class="badge" r="${R - 1}"/>`;
    mark = '<path class="glyph" d="M-3.5 0.5 -1 3 3.5 -2.5"/>';
  } else if (role === 'warning') {
    shape = `<path class="badge" d="M0 -${R} ${R} ${R - 2}H-${R}z"/>`;
    mark = '<path class="glyph" d="M0 -3V1.5M0 4.3h.01"/>';
  } else {
    shape = `<rect class="badge" x="-6.5" y="-6.5" width="13" height="13" rx="2" transform="rotate(45)"/>`;
    mark = '<path class="glyph" d="M-2.8 -2.8 2.8 2.8M2.8 -2.8-2.8 2.8"/>';
  }
  return `<g class="role-badge" data-role="${role}" transform="translate(${num(x)} ${num(y)})">${shape}${mark}</g>`;
}

function nodeStyle(node: DiagramNode, ctx: Context): string {
  const parts: string[] = [];
  const colors = node.colors ?? {};
  for (const [key, prop] of [['fill', '--fill'], ['stroke', '--stroke'], ['text', '--text']] as const) {
    const value = colors[key];
    if (value === undefined) continue;
    if (isSafeCssValue(value)) parts.push(`${prop}:${value}`);
    else warnOnce(ctx.seenWarnings, `Node "${node.id}" has an unsafe ${key} color and it was ignored.`, ctx.options.onWarning);
  }
  return parts.length > 0 ? ` style="${esc(parts.join(';'))}"` : '';
}

function renderNode(box: LaidOutNode, ctx: Context): string {
  const node = ctx.nodes.get(box.id);
  if (!node) return '';
  const role = node.role ?? 'default';
  const type = node.type ?? 'box';
  const custom = ctx.options.nodeTypes?.[type];
  let outline: string;
  if (custom) {
    outline = custom(node, box);
  } else {
    if (!BUILT_IN_TYPES.has(type)) {
      warnOnce(ctx.seenWarnings, `Node type "${type}" has no renderer, so "${node.id}" is drawn as a box.`, ctx.options.onWarning);
    }
    outline = frame(type, box, ctx);
  }

  const { x, y, width: w, height: h } = box;
  const hasIcon = Boolean(node.icon) && type !== 'actor';
  const zoneTop = type === 'actor' ? y + ACTOR_EXTRA : type === 'database' ? y + 2 * DATABASE_CAP : y;
  const zoneBottom = type === 'database' ? y + h - DATABASE_CAP : y + h;
  const zoneHeight = zoneBottom - zoneTop;

  const left = x + NODE_PAD_X + (hasIcon ? ICON_SPACE : 0);
  const cx = (left + (x + w - NODE_PAD_X)) / 2;
  const gap = box.lines.length > 0 && box.subtitleLines.length > 0 ? 4 : 0;
  const blockHeight = box.lines.length * LABEL_LINE + gap + box.subtitleLines.length * SUB_LINE;
  let cursor = zoneTop + (zoneHeight - blockHeight) / 2;

  let text = '';
  if (box.lines.length > 0) {
    const tspans = box.lines
      .map((line, i) => `<tspan x="${num(cx)}" y="${num(cursor + i * LABEL_LINE + LABEL_LINE / 2)}">${esc(line)}</tspan>`)
      .join('');
    text += `<text class="lbl" text-anchor="middle" dominant-baseline="central">${tspans}</text>`;
    cursor += box.lines.length * LABEL_LINE + gap;
  }
  if (box.subtitleLines.length > 0) {
    const tspans = box.subtitleLines
      .map((line, i) => `<tspan x="${num(cx)}" y="${num(cursor + i * SUB_LINE + SUB_LINE / 2)}">${esc(line)}</tspan>`)
      .join('');
    text += `<text class="sub" text-anchor="middle" dominant-baseline="central">${tspans}</text>`;
  }

  const icon = hasIcon ? iconMarkup(node.icon!, x + NODE_PAD_X, zoneTop + (zoneHeight - ICON_SIZE) / 2, ctx) : '';
  const mark = role === 'success' || role === 'warning' || role === 'danger' ? badge(role, x + w, y) : '';
  const tip = node.detail ? `<title>${esc(node.detail)}</title>` : '';

  const classes = `node type-${type.replace(/[^\w-]/g, '_')} role-${role}${type === 'card' ? ' card' : ''}`;
  const group = `<g class="${classes}" id="${esc(domId(ctx, 'n', node.id))}" data-id="${esc(node.id)}"${nodeStyle(node, ctx)}>${tip}${outline}${icon}${text}${mark}</g>`;

  const href = node.href === undefined ? undefined : safeHref(node.href);
  if (node.href !== undefined && href === undefined) {
    warnOnce(ctx.seenWarnings, `Node "${node.id}" has a link that is not allowed and it was ignored.`, ctx.options.onWarning);
  }
  if (href === undefined) return group;
  const target = href.startsWith('#') && ctx.nodes.has(href.slice(1)) ? `#${domId(ctx, 'n', href.slice(1))}` : href;
  return `<a href="${esc(target)}">${group}</a>`;
}

function pathData(points: Point[], routing: LaidOutEdge['routing']): string {
  const p = points.map((pt) => `${num(pt.x)} ${num(pt.y)}`);
  if (routing !== 'curved' || points.length < 3) return `M${p.join('L')}`;
  let d = `M${p[0]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    d += `Q${num(a.x)} ${num(a.y)} ${num((a.x + b.x) / 2)} ${num((a.y + b.y) / 2)}`;
  }
  const last = points[points.length - 1]!;
  return `${d}L${num(last.x)} ${num(last.y)}`;
}

function arrowHead(tip: Point, from: Point): string {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const ux = dx / len;
  const uy = dy / len;
  const bx = tip.x - ux * ARROW_LENGTH;
  const by = tip.y - uy * ARROW_LENGTH;
  const nx = -uy * ARROW_HALF_WIDTH;
  const ny = ux * ARROW_HALF_WIDTH;
  return `<path class="arrow" d="M${num(tip.x)} ${num(tip.y)}L${num(bx + nx)} ${num(by + ny)}L${num(bx - nx)} ${num(by - ny)}z"/>`;
}

const DASH: Record<string, string> = { dashed: ' stroke-dasharray="6 4"', dotted: ' stroke-dasharray="0.1 5"' };

function edgeSummary(edge: DiagramEdge | undefined, laid: LaidOutEdge, ctx: Context): string {
  const name = (id: string) => ctx.nodes.get(id)?.label || id;
  const base = `${name(laid.from)} to ${name(laid.to)}`;
  return edge?.label ? `${base}: ${edge.label}` : base;
}

function renderEdge(edge: DiagramEdge | undefined, laid: LaidOutEdge, ctx: Context): string {
  const arrow = edge?.arrow ?? 'end';
  const pts = laid.points;
  let heads = '';
  if (arrow === 'end' || arrow === 'both') heads += arrowHead(pts[pts.length - 1]!, pts[pts.length - 2]!);
  if (arrow === 'start' || arrow === 'both') heads += arrowHead(pts[0]!, pts[1]!);
  const role = edge?.role && edge.role !== 'default' ? ` role-${edge.role}` : '';
  const line = `<path class="edge-line"${DASH[edge?.style ?? 'solid'] ?? ''} d="${pathData(pts, laid.routing)}"/>`;
  return `<g class="edge${role}" data-id="${esc(laid.id)}"><title>${esc(edgeSummary(edge, laid, ctx))}</title>${line}${heads}</g>`;
}

interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
}

function labelBox(edge: DiagramEdge | undefined, laid: LaidOutEdge): LabelBox | undefined {
  const lines = laid.labelLines ?? (edge?.label ? [edge.label] : []);
  if (lines.length === 0 || !laid.labelPosition) return undefined;
  const width = Math.max(...lines.map((l) => textWidth(l, EDGE_LABEL_METRICS))) + 10;
  const height = lines.length * EDGE_LABEL_LINE + 4;
  return { x: laid.labelPosition.x - width / 2, y: laid.labelPosition.y - height / 2, width, height, lines };
}

function renderLabel(box: LabelBox): string {
  const cx = box.x + box.width / 2;
  const top = box.y + 2;
  const tspans = box.lines
    .map((line, i) => `<tspan x="${num(cx)}" y="${num(top + i * EDGE_LABEL_LINE + EDGE_LABEL_LINE / 2)}">${esc(line)}</tspan>`)
    .join('');
  return (
    `<rect class="edge-label-box" x="${num(box.x)}" y="${num(box.y)}" width="${num(box.width)}" height="${num(box.height)}" rx="3"/>` +
    `<text class="edge-label" text-anchor="middle" dominant-baseline="central">${tspans}</text>`
  );
}

function renderGroup(group: LaidOutGroup, ctx: Context): string {
  const label = group.label
    ? `<text class="group-label" x="${num(group.x + 10)}" y="${num(group.y + 15)}" dominant-baseline="central">${esc(group.label)}</text>`
    : '';
  return (
    `<g class="group" id="${esc(domId(ctx, 'g', group.id))}" data-id="${esc(group.id)}">` +
    `<rect class="group-box" x="${num(group.x)}" y="${num(group.y)}" width="${num(group.width)}" height="${num(group.height)}" rx="${ctx.theme.radius}"/>${label}</g>`
  );
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function include(b: Bounds, x: number, y: number, w = 0, h = 0): void {
  b.minX = Math.min(b.minX, x);
  b.minY = Math.min(b.minY, y);
  b.maxX = Math.max(b.maxX, x + w);
  b.maxY = Math.max(b.maxY, y + h);
}

/**
 * Draws a laid-out diagram as one self-contained SVG string. The output depends only on its
 * inputs, so server and client renders match, and it needs no browser or client script.
 */
export function renderSvg(diagram: Diagram, layout: Layout, options: RenderOptions = {}): string {
  const theme = applyTokens(resolveTheme(options.theme), options.tokens);
  assertSafeTheme(theme);
  const mode = options.mode ?? 'auto';
  const padding = options.padding ?? 16;
  const requested = options.id?.replace(/[^\w-]/g, '_');
  const scope = `dg-${requested || hash(JSON.stringify([diagram, layout]))}`;
  const ctx: Context = {
    scope,
    theme,
    options,
    nodes: new Map(diagram.nodes.map((n) => [n.id, n])),
    seenWarnings: new Set(),
  };
  const edges = new Map((diagram.edges ?? []).map((e) => [e.id, e]));

  const bounds: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const g of layout.groups) include(bounds, g.x, g.y, g.width, g.height);
  for (const n of layout.nodes) include(bounds, n.x - BADGE_RADIUS, n.y - BADGE_RADIUS, n.width + BADGE_RADIUS * 2, n.height + BADGE_RADIUS);
  for (const e of layout.edges) for (const p of e.points) include(bounds, p.x, p.y);

  const labels = layout.edges.flatMap((e) => {
    const box = labelBox(edges.get(e.id), e);
    if (box) include(bounds, box.x, box.y, box.width, box.height);
    return box ? [box] : [];
  });

  if (!Number.isFinite(bounds.minX)) Object.assign(bounds, { minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const vx = bounds.minX - padding;
  const vy = bounds.minY - padding;
  const width = num(bounds.maxX - bounds.minX + padding * 2);
  const height = num(bounds.maxY - bounds.minY + padding * 2);

  const groups = [...layout.groups].sort((a, b) => a.depth - b.depth).map((g) => renderGroup(g, ctx)).join('');
  const edgeMarkup = layout.edges.map((e) => renderEdge(edges.get(e.id), e, ctx)).join('');
  const nodes = layout.nodes.map((n) => renderNode(n, ctx)).join('');

  const title = options.title ?? diagram.title;
  const description = options.description ?? diagram.description;
  const hasLinks = nodes.includes('<a href=');
  const labelledBy = [title ? `${scope}-title` : '', description ? `${scope}-desc` : ''].filter(Boolean).join(' ');
  const aria = (hasLinks ? ' role="group"' : ' role="img"') + (labelledBy ? ` aria-labelledby="${labelledBy}"` : '');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="${scope}" viewBox="${num(vx)} ${num(vy)} ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto"${aria}>` +
    (title ? `<title id="${scope}-title">${esc(title)}</title>` : '') +
    (description ? `<desc id="${scope}-desc">${esc(description)}</desc>` : '') +
    `<style>${buildCss(scope, theme, mode)}</style>` +
    `<g class="groups">${groups}</g><g class="edges">${edgeMarkup}</g><g class="edge-labels">${labels.map(renderLabel).join('')}</g><g class="nodes">${nodes}</g></svg>`
  );
}
