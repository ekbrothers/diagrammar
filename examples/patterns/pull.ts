import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Pull delivery',
  description: 'A worker polls a queue and gets a job or nothing.',
  nodes: [
    { id: 'worker', label: 'Worker', icon: 'server' },
    { id: 'queue', label: 'Job queue', type: 'pill', role: 'warning' },
  ],
  edges: [
    { id: 'e1', from: 'worker', to: 'queue', label: 'any work?' },
    { id: 'e2', from: 'queue', to: 'worker', label: 'a job, or nothing', style: 'dashed' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
