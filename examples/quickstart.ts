import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Release pipeline',
  description: 'A change moves from a developer through CI to the package registry.',
  nodes: [
    { id: 'dev', type: 'actor', label: 'Developer' },
    { id: 'ci', type: 'card', label: 'CI', subtitle: 'Typecheck, lint, test', icon: 'code', role: 'primary' },
    { id: 'build', label: 'Build' },
    { id: 'registry', type: 'database', label: 'npm registry', role: 'success' },
  ],
  edges: [
    { id: 'push', from: 'dev', to: 'ci', label: 'git push' },
    { id: 'pass', from: 'ci', to: 'build', label: 'green' },
    { id: 'publish', from: 'build', to: 'registry', label: 'publish' },
  ],
});

export const options: RenderDiagramOptions = {};
