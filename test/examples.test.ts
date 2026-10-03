import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildExamples, withBlock } from '../scripts/examples.ts';

const root = join(import.meta.dirname, '..');
const lf = (text: string) => text.replace(/\r\n/g, '\n');
const STALE = 'Run "npm run examples" and commit the result.';

describe('README examples', () => {
  it('has an up-to-date image for every example', async () => {
    const { files } = await buildExamples();
    expect(Object.keys(files).length).toBeGreaterThan(0);
    for (const [path, content] of Object.entries(files)) {
      expect(existsSync(join(root, path)), `${path} is missing. ${STALE}`).toBe(true);
      expect(lf(readFileSync(join(root, path), 'utf8')) === lf(content), `${path} is stale. ${STALE}`).toBe(true);
    }
  });

  it('has an up-to-date README section', async () => {
    const { block } = await buildExamples();
    const readme = lf(readFileSync(join(root, 'README.md'), 'utf8'));
    expect(withBlock(readme, block) === readme, `README.md examples are stale. ${STALE}`).toBe(true);
  });

  it('refuses to update a README without markers', () => {
    expect(() => withBlock('# nothing here', 'x')).toThrow(/markers/);
  });

  it('renders each example without script or external references', async () => {
    const { files } = await buildExamples();
    for (const [path, svg] of Object.entries(files)) {
      expect(svg, path).not.toMatch(/<script|<image|href="https?:/);
    }
  });
});
