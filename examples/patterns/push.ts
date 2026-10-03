import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Push delivery',
  description: 'A publisher sends each event to its subscribers as it happens.',
  nodes: [
    { id: 'pub', label: 'Order service', icon: 'server' },
    { id: 'a', label: 'Email', icon: 'mail' },
    { id: 'b', label: 'Mobile app', icon: 'user' },
    { id: 'c', label: 'Webhook', icon: 'code' },
  ],
  edges: [
    { id: 'e1', from: 'pub', to: 'a', label: 'event' },
    { id: 'e2', from: 'pub', to: 'b', label: 'event' },
    { id: 'e3', from: 'pub', to: 'c', label: 'event' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
