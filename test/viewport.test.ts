// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createViewport } from '../src/interactive/viewport.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function makeSvg(viewBox = '0 0 400 200'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  // jsdom gives every element a zero-sized box, so supply one the maths can use.
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) });
  document.body.append(svg);
  return svg;
}

const box = (svg: SVGSVGElement) => (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createViewport', () => {
  it('returns null when there is no usable viewBox', () => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    expect(createViewport(svg)).toBeNull();
    svg.setAttribute('viewBox', 'nonsense');
    expect(createViewport(svg)).toBeNull();
    svg.setAttribute('viewBox', '0 0 0 0');
    expect(createViewport(svg)).toBeNull();
  });

  it('starts at a zoom of one', () => {
    expect(createViewport(makeSvg())?.zoom()).toBe(1);
  });

  it('zooms in by shrinking the viewBox', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    vp.zoomBy(2);
    expect(vp.zoom()).toBe(2);
    expect(box(svg)[2]).toBe(200);
  });

  it('stops at the zoom limits', () => {
    const svg = makeSvg();
    const vp = createViewport(svg, { minZoom: 0.5, maxZoom: 3 })!;
    vp.zoomBy(100);
    expect(vp.zoom()).toBe(3);
    vp.zoomBy(0.0001);
    expect(vp.zoom()).toBe(0.5);
  });

  it('keeps the zoom anchor fixed', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    vp.zoomBy(2, 0, 0); // top left corner
    const [x, y] = box(svg);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });

  it('pans by moving the viewBox against the drag', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    vp.panBy(40, 20);
    const [x, y] = box(svg);
    expect(x).toBe(-40);
    expect(y).toBe(-20);
  });

  it('reset and fit return to the original view', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    vp.zoomBy(4);
    vp.panBy(50, 50);
    vp.reset();
    expect(box(svg)).toEqual([0, 0, 400, 200]);
    vp.zoomBy(4);
    vp.fit();
    expect(box(svg)).toEqual([0, 0, 400, 200]);
  });

  it('reports the zoom through onChange', () => {
    const onChange = vi.fn();
    createViewport(makeSvg(), { onChange })!.zoomBy(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('leaves a bare wheel to the page', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    const event = new WheelEvent('wheel', { deltaY: -100, cancelable: true });
    svg.dispatchEvent(event);
    expect(vp.zoom()).toBe(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('zooms on a wheel with a modifier', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    const event = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true });
    svg.dispatchEvent(event);
    expect(vp.zoom()).toBeGreaterThan(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('claims a bare wheel only when asked to', () => {
    const svg = makeSvg();
    const vp = createViewport(svg, { wheelWithoutModifier: true })!;
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
    expect(vp.zoom()).toBeGreaterThan(1);
  });

  it('ignores a one-finger touch so the page keeps scrolling', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    const down = new Event('pointerdown') as PointerEvent & { pointerType: string; button: number; clientX: number; clientY: number; pointerId: number };
    Object.assign(down, { pointerType: 'touch', button: 0, clientX: 0, clientY: 0, pointerId: 1 });
    svg.dispatchEvent(down);
    const move = new Event('pointermove') as PointerEvent & { clientX: number; clientY: number; pointerId: number };
    Object.assign(move, { clientX: 50, clientY: 50, pointerId: 1 });
    svg.dispatchEvent(move);
    expect(box(svg)).toEqual([0, 0, 400, 200]);
    expect(vp.zoom()).toBe(1);
  });

  it('pans on a mouse drag', () => {
    const svg = makeSvg();
    createViewport(svg)!;
    const down = new Event('pointerdown') as PointerEvent & Record<string, unknown>;
    Object.assign(down, { pointerType: 'mouse', button: 0, clientX: 100, clientY: 100, pointerId: 2 });
    svg.dispatchEvent(down);
    const move = new Event('pointermove') as PointerEvent & Record<string, unknown>;
    Object.assign(move, { clientX: 140, clientY: 120, pointerId: 2 });
    svg.dispatchEvent(move);
    expect(box(svg)[0]).toBe(-40);
  });

  it('restores the original viewBox and stops listening when destroyed', () => {
    const svg = makeSvg();
    const vp = createViewport(svg)!;
    vp.zoomBy(3);
    vp.destroy();
    expect(box(svg)).toEqual([0, 0, 400, 200]);
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true }));
    expect(box(svg)).toEqual([0, 0, 400, 200]);
  });
});
