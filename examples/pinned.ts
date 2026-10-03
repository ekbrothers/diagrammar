import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

// Nodes with x and y keep that position. The rest are laid out around them.
export const diagram = defineDiagram({
  title: 'Pinned nodes',
  nodes: [
    { id: 'client', label: 'Client', x: 0, y: 160 },
    { id: 'gateway', label: 'Gateway', role: 'primary' },
    { id: 'users', label: 'Users' },
    { id: 'billing', label: 'Billing' },
    { id: 'audit', label: 'Audit log', type: 'database', x: 520, y: 160, role: 'muted' },
  ],
  edges: [
    { id: 'e1', from: 'client', to: 'gateway' },
    { id: 'e2', from: 'gateway', to: 'users' },
    { id: 'e3', from: 'gateway', to: 'billing' },
    { id: 'e4', from: 'users', to: 'audit', style: 'dashed' },
    { id: 'e5', from: 'billing', to: 'audit', style: 'dashed' },
  ],
});

export const options: RenderDiagramOptions = { layout: { routing: 'straight' } };
