import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Fan-out and fan-in',
  description: 'A splitter hands work to three workers and an aggregator combines the results.',
  nodes: [
    { id: 'split', label: 'Splitter', role: 'primary' },
    { id: 'w1', label: 'Worker 1' },
    { id: 'w2', label: 'Worker 2' },
    { id: 'w3', label: 'Worker 3' },
    { id: 'agg', label: 'Aggregator', role: 'success' },
  ],
  edges: [
    { id: 'e1', from: 'split', to: 'w1' },
    { id: 'e2', from: 'split', to: 'w2' },
    { id: 'e3', from: 'split', to: 'w3' },
    { id: 'e4', from: 'w1', to: 'agg' },
    { id: 'e5', from: 'w2', to: 'agg' },
    { id: 'e6', from: 'w3', to: 'agg' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
