import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Request and reply',
  description: 'A client sends a request to a service, which asks the database and replies.',
  nodes: [
    { id: 'client', label: 'Client', type: 'actor' },
    { id: 'svc', label: 'Service', icon: 'server' },
    { id: 'db', label: 'Database', type: 'database' },
  ],
  edges: [
    { id: 'e1', from: 'client', to: 'svc', label: 'request' },
    { id: 'e2', from: 'svc', to: 'client', label: 'response', style: 'dashed' },
    { id: 'e3', from: 'svc', to: 'db', label: 'query' },
    { id: 'e4', from: 'db', to: 'svc', label: 'rows', style: 'dashed' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
