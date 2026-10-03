import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Org chart',
  nodes: [
    { id: 'ceo', label: 'CEO', type: 'card', role: 'primary' },
    { id: 'eng', label: 'Engineering' },
    { id: 'ops', label: 'Operations' },
    { id: 'web', label: 'Web', role: 'muted' },
    { id: 'infra', label: 'Infrastructure', role: 'muted' },
    { id: 'support', label: 'Support', role: 'muted' },
  ],
  edges: [
    { id: 'e1', from: 'ceo', to: 'eng', arrow: 'none' },
    { id: 'e2', from: 'ceo', to: 'ops', arrow: 'none' },
    { id: 'e3', from: 'eng', to: 'web', arrow: 'none' },
    { id: 'e4', from: 'eng', to: 'infra', arrow: 'none' },
    { id: 'e5', from: 'ops', to: 'support', arrow: 'none' },
  ],
});

export const options: RenderDiagramOptions = {
  layout: { strategy: 'tree', direction: 'down', routing: 'straight' },
};
