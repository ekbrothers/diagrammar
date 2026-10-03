import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Circuit breaker',
  description: 'Calls pass through a breaker. When it is open they go to a fallback.',
  nodes: [
    { id: 'client', label: 'Caller', type: 'actor' },
    { id: 'cb', label: 'Circuit breaker', role: 'warning' },
    { id: 'svc', label: 'Payments API', role: 'danger' },
    { id: 'fb', label: 'Cached answer', role: 'muted' },
  ],
  edges: [
    { id: 'e1', from: 'client', to: 'cb' },
    { id: 'e2', from: 'cb', to: 'svc', label: 'closed: call through' },
    { id: 'e3', from: 'cb', to: 'fb', label: 'open: fall back', style: 'dashed' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
