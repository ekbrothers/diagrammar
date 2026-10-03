import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Round-robin load balancing',
  description: 'Requests go to server 1, 2, 3, then 1 again.',
  nodes: [
    { id: 'client', label: 'Clients', type: 'actor' },
    { id: 'lb', label: 'Load balancer', role: 'primary', icon: 'globe' },
    { id: 's1', label: 'Server 1', icon: 'server' },
    { id: 's2', label: 'Server 2', icon: 'server' },
    { id: 's3', label: 'Server 3', icon: 'server' },
  ],
  edges: [
    { id: 'e1', from: 'client', to: 'lb' },
    { id: 'e2', from: 'lb', to: 's1', label: '1st, 4th' },
    { id: 'e3', from: 'lb', to: 's2', label: '2nd, 5th' },
    { id: 'e4', from: 'lb', to: 's3', label: '3rd, 6th' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
