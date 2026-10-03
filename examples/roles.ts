import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Roles and edge styles',
  nodes: [
    { id: 'source', label: 'Primary', role: 'primary', type: 'card', subtitle: 'The main path' },
    { id: 'ok', label: 'Healthy', role: 'success' },
    { id: 'slow', label: 'Degraded', role: 'warning' },
    { id: 'down', label: 'Failing', role: 'danger' },
    { id: 'off', label: 'Retired', role: 'muted' },
  ],
  edges: [
    { id: 'a', from: 'source', to: 'ok', label: 'solid' },
    { id: 'b', from: 'source', to: 'slow', style: 'dashed', label: 'dashed' },
    { id: 'c', from: 'source', to: 'down', style: 'dotted', label: 'dotted', role: 'danger' },
    { id: 'd', from: 'source', to: 'off', arrow: 'none', label: 'no arrow' },
  ],
});

export const options: RenderDiagramOptions = {};
