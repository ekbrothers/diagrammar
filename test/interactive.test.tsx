// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { layoutDiagram } from '../src/layout/index.js';
import { InteractiveDiagram } from '../src/interactive/index.js';
import type { Diagram } from '../src/index.js';
import type { Layout } from '../src/layout/types.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const diagram: Diagram = {
  title: 'Flow',
  nodes: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
    { id: 'd', label: 'D', href: 'https://example.com/d' },
  ],
  edges: [
    { id: 'ab', from: 'a', to: 'b', label: 'goes' },
    { id: 'cd', from: 'c', to: 'd' },
  ],
};

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
});

async function mount(props: Partial<Parameters<typeof InteractiveDiagram>[0]> = {}) {
  const layout: Layout = await layoutDiagram(diagram);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(<InteractiveDiagram diagram={diagram} layout={layout} id="t" {...props} />));
  return host.firstElementChild as HTMLElement;
}

const node = (el: HTMLElement, id: string) => el.querySelector(`.node[data-id="${id}"]`)!;
const fire = (target: Element, type: string, init: EventInit = { bubbles: true }) => act(() => void target.dispatchEvent(new Event(type, { bubbles: true, ...init })));

describe('InteractiveDiagram', () => {
  it('renders the same markup on the server', async () => {
    const layout = await layoutDiagram(diagram);
    expect(renderToStaticMarkup(<InteractiveDiagram diagram={diagram} layout={layout} id="t" />)).toContain('<svg');
  });

  it('highlights a hovered node with its neighbors and clears on leave', async () => {
    const el = await mount();
    const svg = el.querySelector('svg')!;
    fire(node(el, 'a'), 'mouseover');
    expect(svg.classList.contains('dim')).toBe(true);
    const hot = [...el.querySelectorAll('.hot')].map((n) => n.getAttribute('data-id') ?? n.getAttribute('data-edge'));
    expect(hot.sort()).toEqual(['a', 'ab', 'ab', 'b']);
    expect(node(el, 'c').classList.contains('hot')).toBe(false);
    fire(el, 'mouseleave', { bubbles: false });
    expect(svg.classList.contains('dim')).toBe(false);
    expect(el.querySelectorAll('.hot')).toHaveLength(0);
  });

  it('reports hover and focus through onNodeHover', async () => {
    const onNodeHover = vi.fn();
    const el = await mount({ onNodeHover });
    fire(node(el, 'b'), 'mouseover');
    expect(onNodeHover).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'b' }));
    fire(node(el, 'b'), 'mouseover');
    expect(onNodeHover).toHaveBeenCalledTimes(1);
    fire(el, 'focusout');
    expect(onNodeHover).toHaveBeenLastCalledWith(null);
    fire(node(el, 'c'), 'focusin');
    expect(onNodeHover).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'c' }));
  });

  it('skips highlighting when highlight is false', async () => {
    const el = await mount({ highlight: false });
    fire(node(el, 'a'), 'mouseover');
    expect(el.querySelector('svg')!.classList.contains('dim')).toBe(false);
  });

  it('calls onNodeClick for clicks and for Enter and Space, and makes nodes focusable', async () => {
    const onNodeClick = vi.fn();
    const el = await mount({ onNodeClick });
    expect(node(el, 'a').getAttribute('tabindex')).toBe('0');
    expect(node(el, 'a').getAttribute('role')).toBe('button');
    expect(node(el, 'd').getAttribute('tabindex')).toBeNull();

    fire(node(el, 'a'), 'click');
    expect(onNodeClick).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), expect.anything());

    const key = (target: Element, k: string) => act(() => void target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })));
    key(node(el, 'b'), 'Enter');
    key(node(el, 'c'), ' ');
    key(node(el, 'a'), 'x');
    key(node(el, 'd'), 'Enter');
    expect(onNodeClick.mock.calls.map((c) => c[0].id)).toEqual(['a', 'b', 'c']);

    fire(el.querySelector('svg')!, 'click');
    expect(onNodeClick).toHaveBeenCalledTimes(3);
  });

  it('keeps working after the diagram changes', async () => {
    const onNodeHover = vi.fn();
    const el = await mount({ onNodeHover });
    const layout = await layoutDiagram(diagram);
    act(() => root!.render(<InteractiveDiagram diagram={diagram} layout={layout} id="other" onNodeHover={onNodeHover} />));
    fire(node(el, 'a'), 'mouseover');
    expect(onNodeHover).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });
});

describe('InteractiveDiagram keyboard navigation', () => {
  /**
   * jsdom has no layout engine, so getBBox returns nothing and every node sits at the origin.
   * Positions are read when the component mounts, so the stub has to be in place before that.
   * It reads the laid-out position straight off the rendered element.
   */
  function stubLayoutEngine(layout: Layout) {
    const positions = new Map(layout.nodes.map((n) => [n.id, n]));
    const proto = Object.getPrototypeOf(document.createElementNS('http://www.w3.org/2000/svg', 'g')) as {
      getBBox?: () => DOMRect;
    };
    proto.getBBox = function getBBox(this: SVGElement): DOMRect {
      const laid = positions.get(this.getAttribute('data-id') ?? '');
      const { x = 0, y = 0, width = 0, height = 0 } = laid ?? {};
      return { x, y, width, height } as DOMRect;
    };
  }

  it('gives the diagram a single tab stop', async () => {
    const el = await mount();
    const stops = [...el.querySelectorAll('[tabindex="0"]')];
    expect(stops).toHaveLength(1);
    expect(el.querySelectorAll('[tabindex="-1"]').length).toBeGreaterThan(0);
  });

  it('moves focus along an edge with an arrow key', async () => {
    stubLayoutEngine(await layoutDiagram(diagram));
    const el = await mount();
    const a = node(el, 'a') as SVGElement & { focus: () => void };
    a.focus = () => undefined;
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    act(() => void a.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(node(el, 'b').getAttribute('tabindex')).toBe('0');
    expect(node(el, 'a').getAttribute('tabindex')).toBe('-1');
  });

  it('leaves other keys to the page', async () => {
    const el = await mount();
    const a = node(el, 'a');
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => void a.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
  });

  it('jumps to the first and last node with Home and End', async () => {
    stubLayoutEngine(await layoutDiagram(diagram));
    const el = await mount();
    const a = node(el, 'a') as SVGElement & { focus: () => void };
    a.focus = () => undefined;
    act(() => void a.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })));
    expect(node(el, 'd').closest('a')!.getAttribute('tabindex')).toBe('0');
  });
});

describe('InteractiveDiagram zoom', () => {
  it('shows no controls by default', async () => {
    const el = await mount();
    expect(el.querySelector('.dg-zoom-controls')).toBeNull();
  });

  it('shows labelled controls when zoom is on', async () => {
    const el = await mount({ zoom: true });
    const labels = [...el.querySelectorAll('.dg-zoom-controls button')].map((b) => b.getAttribute('aria-label'));
    expect(labels).toEqual(['Zoom out', 'Fit diagram', 'Zoom in']);
  });

  it('uses supplied labels', async () => {
    const el = await mount({ zoom: true, labels: { zoomIn: 'Agrandir' } });
    expect(el.querySelector('[aria-label="Agrandir"]')).not.toBeNull();
  });
});
