import { diagramSchema, SCHEMA_VERSION, SUPPORTED_VERSIONS, type Diagram } from './types.js';

export type IssueCode =
  | 'invalid'
  | 'unsupported-version'
  | 'duplicate-id'
  | 'unknown-endpoint'
  | 'unknown-group'
  | 'unknown-layer'
  | 'group-cycle';

export interface DiagramIssue {
  code: IssueCode;
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; diagram: Diagram }
  | { ok: false; errors: DiagramIssue[] };

function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.reduce<string>((out, part) => {
    if (typeof part === 'number') return `${out}[${part}]`;
    return out ? `${out}.${String(part)}` : String(part);
  }, '');
}

function checkVersion(input: unknown): DiagramIssue | null {
  if (typeof input !== 'object' || input === null || !('version' in input)) return null;
  const version = (input as { version: unknown }).version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
  if ((SUPPORTED_VERSIONS as readonly number[]).includes(version)) return null;
  const plural = SUPPORTED_VERSIONS.length > 1 ? 's' : '';
  return {
    code: 'unsupported-version',
    path: 'version',
    message: `Diagram version ${version} is not supported. This library supports version${plural} ${SUPPORTED_VERSIONS.join(', ')}.`,
  };
}

function checkReferences(diagram: Diagram): DiagramIssue[] {
  const issues: DiagramIssue[] = [];
  const nodes = diagram.nodes;
  const edges = diagram.edges ?? [];
  const groups = diagram.groups ?? [];
  const layers = diagram.layers ?? [];

  const seen = new Map<string, string>();
  const claim = (id: string, path: string) => {
    const first = seen.get(id);
    if (first === undefined) {
      seen.set(id, path);
      return;
    }
    issues.push({
      code: 'duplicate-id',
      path: `${path}.id`,
      message: `Identifier "${id}" is used by both ${first} and ${path}. Identifiers must be unique across nodes, edges, groups, and layers.`,
    });
  };
  nodes.forEach((n, i) => claim(n.id, `nodes[${i}]`));
  edges.forEach((e, i) => claim(e.id, `edges[${i}]`));
  groups.forEach((g, i) => claim(g.id, `groups[${i}]`));
  layers.forEach((l, i) => claim(l.id, `layers[${i}]`));

  const nodeIds = new Set(nodes.map((n) => n.id));
  const groupIds = new Set(groups.map((g) => g.id));
  const layerIds = new Set(layers.map((l) => l.id));

  edges.forEach((e, i) => {
    for (const field of ['from', 'to'] as const) {
      if (!nodeIds.has(e[field])) {
        issues.push({
          code: 'unknown-endpoint',
          path: `edges[${i}].${field}`,
          message: `Edge "${e.id}" ${field} refers to "${e[field]}", which is not a node.`,
        });
      }
    }
  });

  const checkGroup = (ref: string | undefined, path: string, owner: string) => {
    if (ref !== undefined && !groupIds.has(ref)) {
      issues.push({ code: 'unknown-group', path, message: `${owner} refers to group "${ref}", which does not exist.` });
    }
  };
  const checkLayer = (ref: string | undefined, path: string, owner: string) => {
    if (ref !== undefined && !layerIds.has(ref)) {
      issues.push({ code: 'unknown-layer', path, message: `${owner} refers to layer "${ref}", which does not exist.` });
    }
  };

  nodes.forEach((n, i) => {
    checkGroup(n.group, `nodes[${i}].group`, `Node "${n.id}"`);
    checkLayer(n.layer, `nodes[${i}].layer`, `Node "${n.id}"`);
  });
  edges.forEach((e, i) => checkLayer(e.layer, `edges[${i}].layer`, `Edge "${e.id}"`));
  groups.forEach((g, i) => {
    checkGroup(g.parent, `groups[${i}].parent`, `Group "${g.id}"`);
    checkLayer(g.layer, `groups[${i}].layer`, `Group "${g.id}"`);
  });

  const parentOf = new Map(groups.map((g) => [g.id, g.parent] as const));
  groups.forEach((g, i) => {
    const visited = new Set<string>([g.id]);
    let cursor = g.parent;
    while (cursor !== undefined && groupIds.has(cursor)) {
      if (visited.has(cursor)) {
        issues.push({
          code: 'group-cycle',
          path: `groups[${i}].parent`,
          message: `Group "${g.id}" is nested inside itself through "${cursor}".`,
        });
        break;
      }
      visited.add(cursor);
      cursor = parentOf.get(cursor);
    }
  });

  return issues;
}

export function validateDiagram(input: unknown): ValidationResult {
  const versionIssue = checkVersion(input);
  if (versionIssue) return { ok: false, errors: [versionIssue] };

  const parsed = diagramSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({
        code: 'invalid' as const,
        path: formatPath(issue.path),
        message: issue.message,
      })),
    };
  }

  const errors = checkReferences(parsed.data);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, diagram: parsed.data };
}

export class DiagramValidationError extends Error {
  readonly issues: DiagramIssue[];
  constructor(issues: DiagramIssue[]) {
    super(`Invalid diagram:\n${issues.map((i) => `  ${i.path || '(root)'}: ${i.message}`).join('\n')}`);
    this.name = 'DiagramValidationError';
    this.issues = issues;
  }
}

export function parseDiagram(input: unknown): Diagram {
  const result = validateDiagram(input);
  if (!result.ok) throw new DiagramValidationError(result.errors);
  return result.diagram;
}

export function diagramVersion(diagram: Diagram): number {
  return diagram.version ?? SCHEMA_VERSION;
}
