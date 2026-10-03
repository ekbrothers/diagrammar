import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Notification flow',
  nodes: [
    { id: 'app', label: 'App', icon: 'code' },
    { id: 'queue', label: 'Queue', icon: 'bell', type: 'pill', role: 'warning' },
    { id: 'mail', label: 'Email', icon: 'mail' },
    { id: 'push', label: 'Push', icon: 'cloud' },
  ],
  edges: [
    { id: 'e1', from: 'app', to: 'queue' },
    { id: 'e2', from: 'queue', to: 'mail' },
    { id: 'e3', from: 'queue', to: 'push' },
  ],
});

// Icons are SVG on a 24 by 24 grid. Register one for every render, or pass them per render as here.
export const options: RenderDiagramOptions = {
  icons: {
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  },
};
