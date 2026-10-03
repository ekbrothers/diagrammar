'use client';

import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { renderSvg } from '../render/index.js';
import type { DiagramViewProps } from '../react/index.js';
import type { DiagramNode } from '../schema/types.js';
import { collectEdges, collectNodes, isArrowKey, nextNode, type NodeBox } from './keyboard.js';
import { createViewport, type Viewport } from './viewport.js';

export type InteractiveDiagramProps = DiagramViewProps & {
  /** Called when a node is clicked, or activated with Enter or Space. Nodes with an href still navigate. */
  onNodeClick?: (node: DiagramNode, event: Event) => void;
  /** Called with the node under the pointer or keyboard focus, and with null when it leaves. */
  onNodeHover?: (node: DiagramNode | null) => void;
  /** Dim everything except the hovered node and the edges and nodes connected to it. Default true. */
  highlight?: boolean;
  /** Let the reader pan and zoom, and show the controls. Default false. */
  zoom?: boolean;
  /** Smallest and largest zoom, as a multiple of the drawn size. Default 0.25 and 8. */
  minZoom?: number;
  maxZoom?: number;
  /** Zoom on a bare wheel instead of requiring Ctrl or Cmd. Traps page scroll, so it is off by default. */
  wheelWithoutModifier?: boolean;
  /** Labels for the zoom controls, so they can be translated. */
  labels?: { zoomIn?: string; zoomOut?: string; reset?: string };
};

const PARTS = '.node, .edge, .edge-label-group';

function nodeId(target: EventTarget | null): string | null {
  const el = target instanceof Element ? target.closest('.node') : null;
  return el?.getAttribute('data-id') ?? null;
}

function setHighlight(svg: Element, id: string | null): void {
  svg.classList.remove('dim');
  const parts = [...svg.querySelectorAll(PARTS)];
  for (const part of parts) part.classList.remove('hot');
  if (id === null) return;

  const hotNodes = new Set([id]);
  const hotEdges = new Set<string>();
  for (const part of parts) {
    if (!part.classList.contains('edge')) continue;
    const from = part.getAttribute('data-from');
    const to = part.getAttribute('data-to');
    if (from !== id && to !== id) continue;
    hotEdges.add(part.getAttribute('data-id') ?? '');
    hotNodes.add(from ?? '');
    hotNodes.add(to ?? '');
  }
  for (const part of parts) {
    const hot = part.classList.contains('node')
      ? hotNodes.has(part.getAttribute('data-id') ?? '')
      : part.classList.contains('edge')
        ? hotEdges.has(part.getAttribute('data-id') ?? '')
        : hotEdges.has(part.getAttribute('data-edge') ?? '');
    if (hot) part.classList.add('hot');
  }
  svg.classList.add('dim');
}

const focusTarget = (box: NodeBox): Element => box.element.closest('a') ?? box.element;

/** One tab stop for the whole diagram. Arrow keys then move between nodes inside it. */
function setupRovingFocus(boxes: NodeBox[]): void {
  boxes.forEach((box, index) => {
    focusTarget(box).setAttribute('tabindex', index === 0 ? '0' : '-1');
  });
}

function moveFocus(boxes: NodeBox[], to: NodeBox): void {
  for (const box of boxes) focusTarget(box).setAttribute('tabindex', box.id === to.id ? '0' : '-1');
  (focusTarget(to) as SVGElement & { focus?: () => void }).focus?.();
}

/**
 * A diagram that reacts to the pointer and keyboard. The SVG is still drawn on the server, so it is
 * visible before any script runs; this component only adds interaction once it loads in the browser.
 * For plain links with no interaction, set href on a node and use DiagramView instead.
 */
export function InteractiveDiagram({
  diagram,
  layout,
  className,
  onNodeClick,
  onNodeHover,
  highlight = true,
  zoom = false,
  minZoom,
  maxZoom,
  wheelWithoutModifier,
  labels,
  ...options
}: InteractiveDiagramProps): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const viewport = useRef<Viewport | null>(null);
  const handlers = useRef({ onNodeClick, onNodeHover, nodes: diagram.nodes });
  handlers.current = { onNodeClick, onNodeHover, nodes: diagram.nodes };
  const html = useMemo(() => renderSvg(diagram, layout, options), [diagram, layout, JSON.stringify(options)]);
  const clickable = onNodeClick !== undefined;

  useEffect(() => {
    const el = host.current;
    const svg = el?.querySelector('svg');
    if (!el || !svg) return;
    const find = (id: string | null) => (id === null ? undefined : handlers.current.nodes.find((n) => n.id === id));

    const abort = new AbortController();
    const { signal } = abort;
    let current: string | null = null;
    const hover = (id: string | null) => {
      if (id === current) return;
      current = id;
      if (highlight) setHighlight(svg, id);
      handlers.current.onNodeHover?.(find(id) ?? null);
    };

    el.addEventListener('mouseover', (e) => hover(nodeId(e.target)), { signal });
    el.addEventListener('mouseleave', () => hover(null), { signal });
    el.addEventListener('focusin', (e) => hover(nodeId(e.target)), { signal });
    el.addEventListener('focusout', () => hover(null), { signal });

    const activate = (e: Event) => {
      const node = find(nodeId(e.target));
      if (node) handlers.current.onNodeClick?.(node, e);
    };
    el.addEventListener('click', activate, { signal });

    const boxes = collectNodes(svg);
    const edges = collectEdges(svg);
    setupRovingFocus(boxes);

    el.addEventListener(
      'keydown',
      (e) => {
        const id = nodeId(e.target);
        if (id === null) return;

        if (isArrowKey(e.key)) {
          const from = boxes.find((b) => b.id === id);
          const to = from ? nextNode(from, e.key, boxes, edges) : null;
          if (to) {
            e.preventDefault();
            moveFocus(boxes, to);
          }
          return;
        }
        if (e.key === 'Home' || e.key === 'End') {
          const to = e.key === 'Home' ? boxes[0] : boxes[boxes.length - 1];
          if (to) {
            e.preventDefault();
            moveFocus(boxes, to);
          }
          return;
        }
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if ((e.target as Element).closest('a')) return; // a link activates itself
        e.preventDefault();
        activate(e);
      },
      { signal },
    );

    for (const box of boxes) {
      if (box.element.closest('a')) continue;
      if (clickable) {
        box.element.setAttribute('role', 'button');
        box.element.style.cursor = 'pointer';
      }
    }

    viewport.current = zoom ? createViewport(svg, { minZoom, maxZoom, wheelWithoutModifier }) : null;

    return () => {
      abort.abort();
      setHighlight(svg, null);
      viewport.current?.destroy();
      viewport.current = null;
    };
  }, [html, highlight, clickable, zoom, minZoom, maxZoom, wheelWithoutModifier]);

  const control = (label: string, glyph: string, action: () => void) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={action}
      style={{ width: 28, height: 28, lineHeight: '26px', cursor: 'pointer' }}
    >
      {glyph}
    </button>
  );

  return (
    <div ref={host} className={className} style={zoom ? { position: 'relative' } : undefined}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {zoom ? (
        <div
          className="dg-zoom-controls"
          style={{ position: 'absolute', insetInlineEnd: 8, insetBlockEnd: 8, display: 'flex', gap: 4 }}
        >
          {control(labels?.zoomOut ?? 'Zoom out', '−', () => viewport.current?.zoomBy(1 / 1.3))}
          {control(labels?.reset ?? 'Fit diagram', '□', () => viewport.current?.reset())}
          {control(labels?.zoomIn ?? 'Zoom in', '+', () => viewport.current?.zoomBy(1.3))}
        </div>
      ) : null}
    </div>
  );
}

export { createViewport, type Viewport, type ViewportOptions } from './viewport.js';
