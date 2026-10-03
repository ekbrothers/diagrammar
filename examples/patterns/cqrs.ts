import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'CQRS',
  description: 'Commands write to one database, and queries read from a separate, denormalized one.',
  nodes: [
    { id: 'client', label: 'Client', type: 'actor' },
    { id: 'cmd', label: 'Command API', icon: 'code' },
    { id: 'w', label: 'Write store', type: 'database' },
    { id: 'q', label: 'Query API', icon: 'code' },
    { id: 'r', label: 'Read store', type: 'database', role: 'success' },
  ],
  edges: [
    { id: 'e1', from: 'client', to: 'cmd', label: 'commands' },
    { id: 'e2', from: 'cmd', to: 'w' },
    { id: 'e3', from: 'w', to: 'r', label: 'events', style: 'dashed' },
    { id: 'e4', from: 'client', to: 'q', label: 'queries' },
    { id: 'e5', from: 'q', to: 'r' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
