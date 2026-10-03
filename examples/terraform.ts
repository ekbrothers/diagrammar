import { defineDiagram } from '../src/index.js';
import { concepts } from '../src/icons/concepts.js';
import { logos } from '../src/logos/index.js';
import { registerIconPack } from '../src/render/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

// Brand logos keep their colors; concept icons follow the text color.
registerIconPack('logo', logos);
registerIconPack('c', concepts);

export const diagram = defineDiagram({
  title: 'A Terraform run',
  description:
    'A change is pushed to GitHub, which starts a CI run. the workspace produces a plan, waits for approval, then applies it to the Snowflake warehouse and updates the state file.',
  groups: [{ id: 'cloud', label: 'Terraform Cloud' }],
  nodes: [
    { id: 'dev', label: 'Engineer', type: 'actor' },
    { id: 'repo', label: 'Infrastructure', subtitle: 'GitHub', icon: 'logo:github' },
    { id: 'ci', label: 'CI run', subtitle: 'GitHub Actions', icon: 'logo:github-actions' },
    { id: 'ws', label: 'Workspace', subtitle: 'production', group: 'cloud', icon: 'c:workspace' },
    { id: 'state', label: 'State file', group: 'cloud', icon: 'c:state-file' },
    { id: 'plan', label: 'Plan', group: 'cloud', icon: 'c:plan', role: 'warning' },
    { id: 'apply', label: 'Apply', group: 'cloud', icon: 'c:apply', role: 'primary' },
    { id: 'warehouse', label: 'Warehouse', subtitle: 'Snowflake', icon: 'logo:snowflake' },
  ],
  edges: [
    { id: 'e1', from: 'dev', to: 'repo', label: 'push' },
    { id: 'e2', from: 'repo', to: 'ci' },
    { id: 'e3', from: 'ci', to: 'ws', label: 'run' },
    { id: 'e5', from: 'ws', to: 'plan' },
    { id: 'e6', from: 'plan', to: 'apply', label: 'approved' },
    { id: 'e7', from: 'apply', to: 'warehouse' },
    { id: 'e8', from: 'apply', to: 'state', label: 'updates state', style: 'dashed' },
  ],
});

export const options: RenderDiagramOptions = { layout: { direction: 'right', spacing: 45, groupPadding: 24 } };
