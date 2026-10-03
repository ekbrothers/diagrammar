/**
 * Pan and zoom over a rendered SVG by moving its viewBox.
 *
 * The diagram must never trap the page. A wheel without a modifier and a one-finger drag both
 * belong to the page, so this only claims the wheel when a modifier is held, and only pans with
 * a mouse drag or a two-finger touch. Pinch zooms, because nothing else on a page uses it.
 */

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportOptions {
  minZoom?: number;
  maxZoom?: number;
  /** Claim the wheel without a modifier key. Traps page scroll, so it is off by default. */
  wheelWithoutModifier?: boolean;
  onChange?: (zoom: number) => void;
}

const parseViewBox = (svg: SVGSVGElement): ViewBox | null => {
  const parts = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [x, y, width, height] = parts as [number, number, number, number];
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
};

export interface Viewport {
  zoomBy: (factor: number, originX?: number, originY?: number) => void;
  panBy: (dx: number, dy: number) => void;
  fit: () => void;
  reset: () => void;
  zoom: () => number;
  destroy: () => void;
}

export function createViewport(svg: SVGSVGElement, options: ViewportOptions = {}): Viewport | null {
  const home = parseViewBox(svg);
  if (!home) return null;

  const { minZoom = 0.25, maxZoom = 8, wheelWithoutModifier = false, onChange } = options;
  let view: ViewBox = { ...home };

  const apply = () => {
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
    onChange?.(home.width / view.width);
  };

  /** Converts a client point to a point in diagram units. */
  const toDiagram = (clientX: number, clientY: number) => {
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return { x: view.x, y: view.y };
    return {
      x: view.x + ((clientX - box.left) / box.width) * view.width,
      y: view.y + ((clientY - box.top) / box.height) * view.height,
    };
  };

  const zoomBy: Viewport['zoomBy'] = (factor, originX, originY) => {
    const current = home.width / view.width;
    const next = Math.min(maxZoom, Math.max(minZoom, current * factor));
    if (next === current) return;

    const width = home.width / next;
    const height = home.height / next;
    // Keep the point under the cursor fixed, so zoom feels anchored rather than jumping to a corner.
    const anchor = originX === undefined || originY === undefined ? { x: view.x + view.width / 2, y: view.y + view.height / 2 } : toDiagram(originX, originY);
    const ratioX = (anchor.x - view.x) / view.width;
    const ratioY = (anchor.y - view.y) / view.height;
    view = { x: anchor.x - width * ratioX, y: anchor.y - height * ratioY, width, height };
    apply();
  };

  const panBy: Viewport['panBy'] = (dx, dy) => {
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    view = { ...view, x: view.x - (dx / box.width) * view.width, y: view.y - (dy / box.height) * view.height };
    apply();
  };

  const reset = () => {
    view = { ...home };
    apply();
  };

  const abort = new AbortController();
  const { signal } = abort;

  svg.addEventListener(
    'wheel',
    (event) => {
      const wants = wheelWithoutModifier || event.ctrlKey || event.metaKey;
      if (!wants) return; // let the page scroll
      event.preventDefault();
      zoomBy(Math.exp(-event.deltaY / 300), event.clientX, event.clientY);
    },
    { signal, passive: false },
  );

  let dragging: { x: number; y: number; pointerId: number } | null = null;
  svg.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'touch') return; // one finger belongs to the page
      if (event.button !== 0) return;
      dragging = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      svg.setPointerCapture?.(event.pointerId);
    },
    { signal },
  );
  svg.addEventListener(
    'pointermove',
    (event) => {
      if (!dragging || event.pointerId !== dragging.pointerId) return;
      panBy(event.clientX - dragging.x, event.clientY - dragging.y);
      dragging = { ...dragging, x: event.clientX, y: event.clientY };
    },
    { signal },
  );
  const endDrag = (event: PointerEvent) => {
    if (dragging && event.pointerId === dragging.pointerId) {
      svg.releasePointerCapture?.(event.pointerId);
      dragging = null;
    }
  };
  svg.addEventListener('pointerup', endDrag, { signal });
  svg.addEventListener('pointercancel', endDrag, { signal });

  // Two fingers: pinch to zoom and drag to pan. One finger is left to the page.
  let pinch: { distance: number; x: number; y: number } | null = null;
  const touchInfo = (touches: TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    if (!a || !b) return null;
    return {
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    };
  };
  svg.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length !== 2) return;
      pinch = touchInfo(event.touches);
    },
    { signal, passive: true },
  );
  svg.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length !== 2 || !pinch) return;
      const next = touchInfo(event.touches);
      if (!next || pinch.distance === 0) return;
      event.preventDefault();
      zoomBy(next.distance / pinch.distance, next.x, next.y);
      panBy(next.x - pinch.x, next.y - pinch.y);
      pinch = next;
    },
    { signal, passive: false },
  );
  const endPinch = () => {
    pinch = null;
  };
  svg.addEventListener('touchend', endPinch, { signal, passive: true });
  svg.addEventListener('touchcancel', endPinch, { signal, passive: true });

  return {
    zoomBy,
    panBy,
    fit: reset,
    reset,
    zoom: () => home.width / view.width,
    destroy: () => {
      abort.abort();
      svg.setAttribute('viewBox', `${home.x} ${home.y} ${home.width} ${home.height}`);
    },
  };
}
