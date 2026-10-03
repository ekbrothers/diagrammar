import { defineDiagram } from '../../src/index.js';
import type { RenderDiagramOptions } from '../../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Static site behind a CDN',
  description: 'A build pipeline uploads to storage. Visitors are served by the CDN, which fetches from storage on a miss.',
  nodes: [
    { id: 'ci', label: 'Build pipeline', icon: 'code' },
    { id: 'store', label: 'Storage bucket', icon: 'box' },
    { id: 'cdn', label: 'CDN', icon: 'globe', role: 'primary' },
    { id: 'user', label: 'Visitors', type: 'actor' },
  ],
  edges: [
    { id: 'e1', from: 'ci', to: 'store', label: 'upload' },
    { id: 'e2', from: 'cdn', to: 'store', label: 'on a miss', style: 'dashed' },
    { id: 'e3', from: 'user', to: 'cdn' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
