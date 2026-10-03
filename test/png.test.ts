import { describe, expect, it } from 'vitest';
import { renderPng } from '../src/server/index.js';
import type { Diagram } from '../src/schema/types.js';

const diagram: Diagram = {
  title: 'PNG',
  nodes: [
    { id: 'a', label: 'Alpha', role: 'primary' },
    { id: 'b', label: 'Beta', type: 'database' },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b', label: 'writes' }],
};

// The rasterizer is an optional native dependency, so these only run where it installed.
const available = await import('@resvg/resvg-js').then(
  () => true,
  () => false,
);
const whenAvailable = available ? describe : describe.skip;

/** Width and height from the PNG IHDR chunk, which starts at a fixed offset. */
function size(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

whenAvailable('renderPng', () => {
  it('returns a PNG', async () => {
    const png = await renderPng(diagram);
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('doubles the pixel dimensions at 2x', async () => {
    const one = size(await renderPng(diagram, { scale: 1 }));
    const two = size(await renderPng(diagram, { scale: 2 }));
    expect(two.width).toBe(one.width * 2);
    expect(two.height).toBe(one.height * 2);
  });

  it('draws light and dark differently', async () => {
    const light = await renderPng(diagram, { mode: 'light', background: true });
    const dark = await renderPng(diagram, { mode: 'dark', background: true });
    expect(Buffer.from(light).equals(Buffer.from(dark))).toBe(false);
  });

  it('is deterministic', async () => {
    const a = await renderPng(diagram);
    const b = await renderPng(diagram);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it('draws something, not an empty canvas', async () => {
    const png = await renderPng(diagram, { background: true });
    // A blank image compresses far smaller than one with shapes and text.
    expect(png.length).toBeGreaterThan(2000);
  });

  it('rejects a scale that is not a positive number', async () => {
    await expect(renderPng(diagram, { scale: 0 })).rejects.toThrow(/scale/);
    await expect(renderPng(diagram, { scale: Number.NaN })).rejects.toThrow(/scale/);
  });

  it('reports an invalid diagram rather than drawing it', async () => {
    await expect(renderPng({ nodes: [{ id: 'a' }], edges: [{ id: 'e', from: 'a', to: 'missing' }] })).rejects.toThrow();
  });
});
