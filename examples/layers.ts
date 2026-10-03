import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Services and a hidden migration layer',
  layers: [{ id: 'migration', label: 'Migration', hidden: true }],
  groups: [
    { id: 'frontend', label: 'Frontend' },
    { id: 'services', label: 'Services' },
    { id: 'data', label: 'Data', parent: 'services' },
  ],
  nodes: [
    { id: 'web', label: 'Web', group: 'frontend', icon: 'globe' },
    { id: 'api', label: 'API', group: 'services', icon: 'server', role: 'primary' },
    { id: 'auth', label: 'Auth', group: 'services', icon: 'lock' },
    { id: 'db', label: 'Orders', type: 'database', group: 'data' },
    { id: 'legacy', label: 'Legacy DB', type: 'database', group: 'data', role: 'muted', layer: 'migration' },
  ],
  edges: [
    { id: 'e1', from: 'web', to: 'api' },
    { id: 'e2', from: 'api', to: 'auth' },
    { id: 'e3', from: 'api', to: 'db' },
    { id: 'e4', from: 'db', to: 'legacy', style: 'dashed', label: 'sync', layer: 'migration' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'down' } };
