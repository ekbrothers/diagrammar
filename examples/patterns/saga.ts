import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Saga with compensation',
  description: 'Order, payment, and stock steps, with a refund and cancellation when a step fails.',
  nodes: [
    { id: 'order', label: 'Create order' },
    { id: 'pay', label: 'Charge card' },
    { id: 'ship', label: 'Reserve stock' },
    { id: 'done', label: 'Confirmed', role: 'success' },
    { id: 'refund', label: 'Refund', role: 'danger' },
    { id: 'cancel', label: 'Cancel order', role: 'danger' },
  ],
  edges: [
    { id: 'e1', from: 'order', to: 'pay' },
    { id: 'e2', from: 'pay', to: 'ship' },
    { id: 'e3', from: 'ship', to: 'done' },
    { id: 'e4', from: 'ship', to: 'refund', label: 'out of stock', style: 'dashed' },
    { id: 'e5', from: 'refund', to: 'cancel', style: 'dashed' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
