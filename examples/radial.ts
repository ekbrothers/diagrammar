import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Event bus',
  nodes: [
    { id: 'bus', label: 'Event bus', type: 'card', role: 'primary' },
    { id: 'orders', label: 'Orders' },
    { id: 'billing', label: 'Billing' },
    { id: 'search', label: 'Search' },
    { id: 'email', label: 'Email' },
    { id: 'audit', label: 'Audit', role: 'muted' },
  ],
  edges: ['orders', 'billing', 'search', 'email', 'audit'].map((id) => ({
    id: `bus-${id}`,
    from: 'bus',
    to: id,
    arrow: 'none' as const,
  })),
});

export const options: RenderDiagramOptions = { layout: { strategy: 'radial', routing: 'straight' } };
