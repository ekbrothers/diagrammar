import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { mermaidBlocks, type MermaidResult } from '../interop/mermaid.js';

/** Reads a Mermaid file, or picks one fenced block out of a Markdown file. */
export function readSource(path: string, which?: number): { source: string; blocks: number } {
  const text = readFileSync(path, 'utf8');
  const isMarkdown = ['.md', '.markdown', '.mdx'].includes(extname(path).toLowerCase());
  if (!isMarkdown) return { source: text, blocks: 1 };

  const blocks = mermaidBlocks(text);
  if (blocks.length === 0) throw new Error(`${path} has no \`\`\`mermaid code block.`);
  const index = which ?? 1;
  if (index < 1 || index > blocks.length) {
    throw new Error(`${path} has ${blocks.length} mermaid blocks, so --block must be between 1 and ${blocks.length}.`);
  }
  return { source: blocks[index - 1]!, blocks: blocks.length };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Prints a value as source, leaving keys unquoted where they can be, so the file reads as code. */
function literal(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const inner = '  '.repeat(indent + 1);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((item) => `${inner}${literal(item, indent + 1)}`).join(',\n')},\n${pad}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '{}';
    const parts = entries.map(([key, v]) => `${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${literal(v, indent + 1)}`);
    // Keep a short object on one line; nodes and edges read better as a list than as a block each.
    const single = `{ ${parts.join(', ')} }`;
    if (single.length + pad.length <= 100 && !single.includes('\n')) return single;
    return `{\n${parts.map((part) => `${inner}${part}`).join(',\n')},\n${pad}}`;
  }
  return JSON.stringify(value);
}

/** Writes the definition as a TypeScript module, so the result is editable rather than opaque. */
export function renderDiagramModule(result: MermaidResult, from: string): string {
  const { diagram, layout, report } = result;
  const lines: string[] = [`// Converted from ${from} by diagrammar import mermaid.`];
  if (report.length > 0) {
    lines.push('//', '// These parts of the source were not carried across:');
    for (const note of report) lines.push(`//   line ${note.line}, ${note.construct}: ${note.detail}`);
  }
  lines.push(`import { defineDiagram } from 'diagrammar';`, '', `export const diagram = defineDiagram(${literal(diagram)});`, '');
  if (Object.keys(layout).length > 0) lines.push(`export const layout = ${literal(layout)};`, '');
  return lines.join('\n');
}
