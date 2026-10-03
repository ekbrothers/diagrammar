'use client';

import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { renderSvg } from '../render/index.js';
import type { DiagramViewProps } from '../react/index.js';
import type { DiagramNode } from '../schema/types.js';

export type InteractiveDiagramProps = DiagramViewProps & {
  /** Called when a node is clicked, or activated with Enter or Space. Nodes with an href still navigate. */
  onNodeClick?: (node: DiagramNode, event: Event) => void;
  /** Called with the node under the pointer or keyboard focus, and with null when it leaves. */
  onNodeHover?: (node: DiagramNode | null) => void;
  /** Dim everything except the hovered node and the edges and nodes connected to it. Default true. */
  highlight?: boolean;
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

/**
 * A diagram that reacts to the pointer and keyboard. The SVG is still drawn on the server, so it is
 * visible before any script runs; this component only adds hover highlighting and click callbacks
 * once it loads in the browser. For plain links, set href on a node and use DiagramView instead.
 */
export function InteractiveDiagram({
  diagram,
  layout,
  className,
  onNodeClick,
  onNodeHover,
  highlight = true,
  ...options
}: InteractiveDiagramProps): ReactElement {
  const host = useRef<HTMLDivElement>(null);
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
    el.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if ((e.target as Element).closest('a')) return;
        if (nodeId(e.target) === null) return;
        e.preventDefault();
        activate(e);
      },
      { signal },
    );

    if (clickable) {
      for (const node of svg.querySelectorAll('.node')) {
        if (node.closest('a')) continue;
        node.setAttribute('tabindex', '0');
        node.setAttribute('role', 'button');
        (node as SVGElement).style.cursor = 'pointer';
      }
    }
    return () => {
      abort.abort();
      setHighlight(svg, null);
    };
  }, [html, highlight, clickable]);

  return <div ref={host} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
