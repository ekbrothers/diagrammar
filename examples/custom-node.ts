import { defineDiagram } from '../src/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = defineDiagram<'note'>({
  title: 'Custom node type',
  nodes: [
    { id: 'pr', label: 'Pull request', icon: 'code' },
    { id: 'entry', type: 'note', label: 'Changelog entry', width: 170 },
    { id: 'release', label: 'Release', role: 'success' },
  ],
  edges: [
    { id: 'e1', from: 'pr', to: 'entry' },
    { id: 'e2', from: 'entry', to: 'release' },
  ],
});

// A node type draws its outline. Label, icon, and status badge are added around it.
export const options: RenderDiagramOptions = {
  validate: { nodeTypes: ['note'] },
  nodeTypes: {
    note: (_node, { x, y, width, height }) => {
      const fold = 14;
      const right = x + width;
      return (
        `<path class="shape" d="M${x} ${y}H${right - fold}L${right} ${y + fold}V${y + height}H${x}Z"/>` +
        `<path class="glyph" d="M${right - fold} ${y}V${y + fold}H${right}"/>`
      );
    },
  },
};
