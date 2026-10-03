import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { examples, type Example } from '../examples/index.ts';
import { renderDiagram } from '../src/server/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const README_START = '<!-- examples:start -->';
export const README_END = '<!-- examples:end -->';

const IMPORTS: [string, string][] = [
  ["'../src/index.js'", "'diagrammar'"],
  ["'../src/server/index.js'", "'diagrammar/server'"],
  ["'../src/react/index.js'", "'diagrammar/react'"],
  ["'../src/render/index.js'", "'diagrammar/render'"],
];

const lf = (text: string) => text.replace(/\r\n/g, '\n');

function snippet(example: Example): string {
  let code = lf(readFileSync(join(root, 'examples', example.file), 'utf8'));
  for (const [from, to] of IMPORTS) code = code.split(from).join(to);
  return code.replace(/^export /gm, '').trim();
}

const render = (example: Example, mode: 'light' | 'dark') =>
  renderDiagram(example.diagram, { ...example.options, mode, background: true, id: `${example.slug}-${mode}` });

function altText(example: Example): string {
  const { title, description } = example.diagram as { title?: string; description?: string };
  return [title ?? example.title, description].filter(Boolean).join('. ');
}

function section(example: Example): string {
  const base = `docs/examples/${example.slug}`;
  const alt = altText(example).replace(/"/g, '&quot;');
  return [
    `### ${example.title}`,
    '',
    example.blurb,
    '',
    '<picture>',
    `  <source media="(prefers-color-scheme: dark)" srcset="${base}.dark.svg">`,
    `  <img alt="${alt}" src="${base}.light.svg">`,
    '</picture>',
    '',
    '```' + (example.file.endsWith('x') ? 'tsx' : 'ts'),
    snippet(example),
    '```',
  ].join('\n');
}

export async function buildExamples(): Promise<{ files: Record<string, string>; block: string }> {
  const files: Record<string, string> = {};
  for (const example of examples) {
    files[`docs/examples/${example.slug}.light.svg`] = (await render(example, 'light')) + '\n';
    files[`docs/examples/${example.slug}.dark.svg`] = (await render(example, 'dark')) + '\n';
  }
  const block = [README_START, '', examples.map(section).join('\n\n'), '', README_END].join('\n');
  return { files, block };
}

/** Replaces the generated block in the README text. Throws if the markers are missing. */
export function withBlock(readme: string, block: string): string {
  const text = lf(readme);
  const start = text.indexOf(README_START);
  const end = text.indexOf(README_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README.md needs ${README_START} and ${README_END} markers around the examples.`);
  }
  return text.slice(0, start) + block + text.slice(end + README_END.length);
}

export async function main(): Promise<void> {
  const { files, block } = await buildExamples();
  mkdirSync(join(root, 'docs', 'examples'), { recursive: true });
  for (const [path, content] of Object.entries(files)) writeFileSync(join(root, path), content);
  const readmePath = join(root, 'README.md');
  writeFileSync(readmePath, withBlock(readFileSync(readmePath, 'utf8'), block));
  console.log(`Wrote ${Object.keys(files).length} images and updated README.md.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
