import { defineDiagram } from '../src/index.js';
import { defaultTheme, extendTheme } from '../src/render/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram({
  title: 'Custom theme and per-node colors',
  nodes: [
    { id: 'brief', label: 'Brief', type: 'card', role: 'primary' },
    { id: 'design', label: 'Design' },
    { id: 'build', label: 'Build', colors: { fill: '#be185d', stroke: '#9d174d', text: '#ffffff' } },
    { id: 'ship', label: 'Ship', role: 'success' },
  ],
  edges: [
    { id: 'e1', from: 'brief', to: 'design' },
    { id: 'e2', from: 'design', to: 'build' },
    { id: 'e3', from: 'build', to: 'ship' },
  ],
});

// Overrides in light or dark apply to that appearance only. Values can be var(--your-token) too.
const violet = extendTheme(defaultTheme, {
  name: 'violet',
  radius: 14,
  light: { roles: { primary: { fill: '#ede9fe', stroke: '#6d28d9', text: '#2e1065' } } },
  dark: { roles: { primary: { fill: '#2e1065', stroke: '#a78bfa', text: '#ede9fe' } } },
});

export const options: RenderDiagramOptions = { theme: violet };
