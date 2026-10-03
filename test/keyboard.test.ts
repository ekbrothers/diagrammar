import { describe, expect, it } from 'vitest';
import { isArrowKey, nextNode, type NodeBox } from '../src/interactive/keyboard.js';

const at = (id: string, x: number, y: number): NodeBox => ({ id, x, y, element: null as unknown as SVGElement });

const nodes = [at('a', 0, 0), at('right', 100, 0), at('far-right', 300, 0), at('down', 0, 100), at('up', 0, -100), at('left', -100, 0)];
const edges = [{ from: 'a', to: 'far-right' }];

describe('isArrowKey', () => {
  it('recognises the four arrows and nothing else', () => {
    expect(isArrowKey('ArrowUp')).toBe(true);
    expect(isArrowKey('ArrowDown')).toBe(true);
    expect(isArrowKey('ArrowLeft')).toBe(true);
    expect(isArrowKey('ArrowRight')).toBe(true);
    expect(isArrowKey('Enter')).toBe(false);
  });
});

describe('nextNode', () => {
  const from = nodes[0]!;

  it('moves in the direction pressed', () => {
    expect(nextNode(from, 'ArrowDown', nodes, [])?.id).toBe('down');
    expect(nextNode(from, 'ArrowUp', nodes, [])?.id).toBe('up');
    expect(nextNode(from, 'ArrowLeft', nodes, [])?.id).toBe('left');
  });

  it('prefers a connected node over a nearer unconnected one', () => {
    expect(nextNode(from, 'ArrowRight', nodes, edges)?.id).toBe('far-right');
  });

  it('falls back to the nearest when nothing in that direction is connected', () => {
    expect(nextNode(from, 'ArrowRight', nodes, [])?.id).toBe('right');
  });

  it('ignores nodes behind the direction', () => {
    expect(nextNode(at('x', 500, 0), 'ArrowRight', nodes, [])).toBeNull();
  });

  it('ignores nodes more than 45 degrees off the direction', () => {
    const steep = [at('a', 0, 0), at('steep', 10, 200)];
    expect(nextNode(steep[0]!, 'ArrowRight', steep, [])).toBeNull();
  });

  it('never returns the node it started from', () => {
    expect(nextNode(from, 'ArrowRight', [from], [])).toBeNull();
  });

  it('treats an edge as connected in both directions', () => {
    const reversed = [{ from: 'far-right', to: 'a' }];
    expect(nextNode(from, 'ArrowRight', nodes, reversed)?.id).toBe('far-right');
  });
});
