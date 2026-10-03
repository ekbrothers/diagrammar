import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Publish and subscribe',
  description: 'One publisher, one topic, three independent subscribers.',
  nodes: [
    { id: 'pub', label: 'Checkout', icon: 'server' },
    { id: 'topic', label: 'orders topic', type: 'pill', role: 'primary' },
    { id: 'billing', label: 'Billing' },
    { id: 'ship', label: 'Shipping' },
    { id: 'stats', label: 'Analytics', role: 'muted' },
  ],
  edges: [
    { id: 'e1', from: 'pub', to: 'topic', label: 'publish' },
    { id: 'e2', from: 'topic', to: 'billing' },
    { id: 'e3', from: 'topic', to: 'ship' },
    { id: 'e4', from: 'topic', to: 'stats' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
