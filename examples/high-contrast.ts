import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'High-contrast theme',
  nodes: [
    { id: 'req', label: 'Request', role: 'primary' },
    { id: 'ok', label: 'Served', role: 'success' },
    { id: 'retry', label: 'Retried', role: 'warning' },
    { id: 'fail', label: 'Rejected', role: 'danger' },
  ],
  edges: [
    { id: 'e1', from: 'req', to: 'ok' },
    { id: 'e2', from: 'req', to: 'retry', style: 'dashed' },
    { id: 'e3', from: 'req', to: 'fail', style: 'dotted' },
  ],
});

export const options: RenderDiagramOptions = { theme: 'high-contrast' };
