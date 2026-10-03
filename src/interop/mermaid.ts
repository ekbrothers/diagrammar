import type { Diagram, DiagramEdge, DiagramGroup, DiagramNode } from '../schema/types.js';
import type { LayoutOptions } from '../layout/types.js';

/**
 * Reads Mermaid flowchart source into a diagram definition.
 *
 * Mermaid's own parser needs a DOM and a large dependency tree, which would undo this library's
 * no-DOM promise for a feature most consumers never call. Flowchart syntax is small and regular,
 * so it is read here directly. Anything outside that subset is reported rather than thrown, since
 * a diagram that mostly converts is more useful than a refusal; only a non-flowchart kind and
 * structurally broken source fail, because no sensible partial result exists for those.
 */

export interface MermaidNote {
  /** 1-based line in the source. */
  line: number;
  /** The construct that could not be carried across, such as "classDef". */
  construct: string;
  detail: string;
}

export interface MermaidResult {
  diagram: Diagram;
  /** Layout options implied by the source, chiefly its direction. */
  layout: LayoutOptions;
  /** Everything dropped or approximated. Empty means the conversion was complete. */
  report: MermaidNote[];
}

export class MermaidError extends Error {
  readonly line: number;
  constructor(line: number, message: string) {
    super(`Line ${line}: ${message}`);
    this.name = 'MermaidError';
    this.line = line;
  }
}

const DIRECTIONS: Record<string, LayoutOptions['direction']> = {
  LR: 'right',
  RL: 'left',
  TB: 'down',
  TD: 'down',
  BT: 'up',
};

/** Bracket pairs that wrap a node label, longest first so "[(" wins over "[". */
const SHAPES: { open: string; close: string; type?: DiagramNode['type']; exact?: boolean }[] = [
  { open: '([', close: '])', type: 'pill', exact: true },
  { open: '[(', close: ')]', type: 'database', exact: true },
  { open: '[[', close: ']]', type: 'card', exact: true },
  { open: '((', close: '))', type: 'pill', exact: true },
  { open: '{{', close: '}}' },
  { open: '>', close: ']' },
  // A plain rectangle is the default node, so it matches exactly rather than being reported.
  { open: '[', close: ']', exact: true },
  { open: '(', close: ')', type: 'pill', exact: true },
  { open: '{', close: '}' },
];

interface Parsed {
  id: string;
  label?: string;
  type?: DiagramNode['type'];
  shape?: string;
}

const stripQuotes = (text: string): string => {
  const trimmed = text.trim();
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/** Turns a Mermaid identifier into one the schema accepts, keeping it recognisable. */
function safeId(raw: string): string {
  const cleaned = raw.trim().replace(/[^\w.-]/g, '_');
  return cleaned.length > 0 ? cleaned : '_';
}

/** Reads one side of a link: an identifier, optionally followed by a bracketed label. */
function parseTerm(text: string): Parsed | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  for (const shape of SHAPES) {
    const start = trimmed.indexOf(shape.open);
    if (start <= 0) continue;
    if (!trimmed.endsWith(shape.close)) continue;
    const id = trimmed.slice(0, start).trim();
    const label = trimmed.slice(start + shape.open.length, trimmed.length - shape.close.length);
    if (id.length === 0) continue;
    const parsed: Parsed = { id, label: stripQuotes(label) };
    if (shape.type !== undefined) parsed.type = shape.type;
    if (shape.exact !== true) parsed.shape = shape.open + shape.close;
    return parsed;
  }
  return { id: trimmed };
}

/**
 * Splits a line into terms and the links between them, so `a --> b -.-> c` reads left to right.
 * Returns null when the line holds no link.
 */
function splitLinks(line: string): { terms: string[]; links: { raw: string; label?: string }[] } | null {
  const parts: string[] = [];
  const links: { raw: string; label?: string }[] = [];
  let buffer = '';
  let depth = 0;
  let quote: string | null = null;
  let index = 0;

  while (index < line.length) {
    const char = line[index]!;
    if (quote) {
      buffer += char;
      if (char === quote) quote = null;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      index += 1;
      continue;
    }
    if ('([{'.includes(char)) depth += 1;
    if (')]}'.includes(char)) depth -= 1;

    if (depth <= 0) {
      const rest = line.slice(index);
      // A link is a run of -, ., = and < > o x, optionally with |label| after it.
      const match = /^(<?(?:-\.-|-{2,}|={2,}|-\.)[.\-=]*[>ox]?)(\|([^|]*)\|)?/.exec(rest);
      if (match && /[-=]/.test(match[1]!)) {
        parts.push(buffer);
        buffer = '';
        links.push({ raw: match[1]!, label: match[3] === undefined ? undefined : stripQuotes(match[3]) });
        index += match[0]!.length;
        continue;
      }
    }
    buffer += char;
    index += 1;
  }
  parts.push(buffer);
  if (links.length === 0) return null;
  return { terms: parts, links };
}

function linkStyle(raw: string): { style: DiagramEdge['style']; arrow: DiagramEdge['arrow'] } {
  const dotted = raw.includes('.');
  const thick = raw.includes('=');
  const startArrow = raw.startsWith('<');
  const endArrow = /[>ox]$/.test(raw);
  return {
    style: dotted ? 'dotted' : thick ? 'solid' : 'solid',
    arrow: startArrow && endArrow ? 'both' : startArrow ? 'start' : endArrow ? 'end' : 'none',
  };
}

/** Converts Mermaid flowchart source into a diagram definition. */
export function fromMermaid(source: string): MermaidResult {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const report: MermaidNote[] = [];
  const nodes = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];
  const groups: DiagramGroup[] = [];
  const stack: string[] = [];
  const idMap = new Map<string, string>();
  const layout: LayoutOptions = {};

  let started = false;
  let title: string | undefined;
  let subgraphCount = 0;
  let edgeCount = 0;
  const openedAt: number[] = [];

  const resolve = (raw: string, line: number): string => {
    const existing = idMap.get(raw);
    if (existing !== undefined) return existing;
    let id = safeId(raw);
    if (id !== raw) report.push({ line, construct: 'identifier', detail: `"${raw}" became "${id}" so it can be used as an id.` });
    // Keep ids unique after cleaning, in case two raw names clean to the same thing.
    let suffix = 2;
    const taken = new Set(idMap.values());
    while (taken.has(id)) {
      id = `${safeId(raw)}_${suffix}`;
      suffix += 1;
    }
    idMap.set(raw, id);
    return id;
  };

  const addNode = (parsed: Parsed, line: number): string => {
    const id = resolve(parsed.id, line);
    const existing = nodes.get(id);
    const group = stack[stack.length - 1];
    if (existing) {
      // A later declaration with a label wins, matching how Mermaid renders it.
      if (parsed.label !== undefined) existing.label = parsed.label;
      if (parsed.type !== undefined) existing.type = parsed.type;
      if (group !== undefined && existing.group === undefined) existing.group = group;
      return id;
    }
    if (parsed.shape !== undefined) {
      report.push({ line, construct: 'shape', detail: `"${parsed.shape}" has no matching node type, so the default was used.` });
    }
    const node: DiagramNode = { id };
    if (parsed.label !== undefined && parsed.label.length > 0) node.label = parsed.label;
    else if (parsed.label === undefined) node.label = parsed.id;
    if (parsed.type !== undefined) node.type = parsed.type;
    if (group !== undefined) node.group = group;
    nodes.set(id, node);
    return id;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const withoutComment = lines[index]!.replace(/%%.*$/, '');
    const line = withoutComment.trim();
    if (line.length === 0) continue;

    if (!started) {
      const header = /^(flowchart|graph)\b\s*([A-Za-z]{2})?/.exec(line);
      if (header) {
        started = true;
        const direction = header[2] ? DIRECTIONS[header[2].toUpperCase()] : undefined;
        if (direction) layout.direction = direction;
        else if (header[2]) report.push({ line: lineNumber, construct: 'direction', detail: `"${header[2]}" is not a known direction.` });
        continue;
      }
      const kind = /^(\w+)/.exec(line)?.[1];
      if (kind && /^(sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|gantt|pie|journey|mindmap|timeline|quadrantChart|gitGraph|requirementDiagram|c4context)$/i.test(kind)) {
        throw new MermaidError(lineNumber, `"${kind}" is not supported. Only flowcharts can be converted.`);
      }
      if (/^---\s*$/.test(line)) {
        // Front matter: read a title if there is one, skip the rest.
        for (index += 1; index < lines.length && !/^---\s*$/.test(lines[index]!.trim()); index += 1) {
          const found = /^title:\s*(.+)$/.exec(lines[index]!.trim());
          if (found) title = stripQuotes(found[1]!);
        }
        continue;
      }
      throw new MermaidError(lineNumber, 'expected a "flowchart" or "graph" header.');
    }

    if (/^subgraph\b/i.test(line)) {
      const rest = line.replace(/^subgraph\s*/i, '').trim();
      const bracket = /^([^[]+)\[([^\]]*)\]$/.exec(rest);
      const rawId = bracket ? bracket[1]!.trim() : rest;
      const label = bracket ? stripQuotes(bracket[2]!) : stripQuotes(rest);
      subgraphCount += 1;
      const id = rawId.length > 0 ? resolve(rawId, lineNumber) : `subgraph_${subgraphCount}`;
      const group: DiagramGroup = { id };
      if (label.length > 0) group.label = label;
      const parent = stack[stack.length - 1];
      if (parent !== undefined) group.parent = parent;
      groups.push(group);
      stack.push(id);
      openedAt.push(lineNumber);
      continue;
    }

    if (/^end\b/i.test(line)) {
      if (stack.length === 0) throw new MermaidError(lineNumber, '"end" without a matching "subgraph".');
      stack.pop();
      openedAt.pop();
      continue;
    }

    if (/^direction\b/i.test(line)) {
      report.push({ line: lineNumber, construct: 'direction', detail: 'A direction inside a subgraph is not supported.' });
      continue;
    }

    const unsupported = /^(classDef|class|style|linkStyle|click|accTitle|accDescr)\b/i.exec(line);
    if (unsupported) {
      report.push({ line: lineNumber, construct: unsupported[1]!, detail: 'Styling and behaviour directives are not converted.' });
      continue;
    }

    const split = splitLinks(line);
    if (split) {
      const parsedTerms = split.terms.map((term) => parseTerm(term));
      for (let position = 0; position < split.links.length; position += 1) {
        const from = parsedTerms[position];
        const to = parsedTerms[position + 1];
        if (!from || !to) {
          report.push({ line: lineNumber, construct: 'link', detail: 'A link was missing one of its ends.' });
          continue;
        }
        const fromId = addNode(from, lineNumber);
        const toId = addNode(to, lineNumber);
        const link = split.links[position]!;
        const { style, arrow } = linkStyle(link.raw);
        edgeCount += 1;
        const edge: DiagramEdge = { id: `e${edgeCount}`, from: fromId, to: toId };
        if (link.label !== undefined && link.label.length > 0) edge.label = link.label;
        if (style !== 'solid') edge.style = style;
        if (arrow !== 'end') edge.arrow = arrow;
        edges.push(edge);
      }
      continue;
    }

    const term = parseTerm(line);
    if (term && /^[\w.-]/.test(line)) {
      addNode(term, lineNumber);
      continue;
    }
    report.push({ line: lineNumber, construct: 'line', detail: `Could not be read: ${line}` });
  }

  if (!started) throw new MermaidError(1, 'expected a "flowchart" or "graph" header.');
  if (stack.length > 0) throw new MermaidError(openedAt[openedAt.length - 1] ?? 1, 'a "subgraph" was never closed with "end".');

  const diagram: Diagram = { nodes: [...nodes.values()] };
  if (title !== undefined) diagram.title = title;
  if (edges.length > 0) diagram.edges = edges;
  if (groups.length > 0) diagram.groups = groups;
  return { diagram, layout, report };
}

/** Pulls Mermaid sources out of fenced code blocks in Markdown. */
export function mermaidBlocks(markdown: string): string[] {
  const out: string[] = [];
  const fence = /^[ \t]*```+\s*mermaid\s*$([\s\S]*?)^[ \t]*```+\s*$/gm;
  let match = fence.exec(markdown);
  while (match !== null) {
    out.push(match[1]!.replace(/^\n/, ''));
    match = fence.exec(markdown);
  }
  return out;
}
