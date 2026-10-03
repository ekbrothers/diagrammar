# diagrammar

Polished, accessible, server-rendered SVG diagrams for the web.

You describe a diagram as data (or React components). diagrammar validates it, lays it out with [ELK](https://github.com/kieler/elkjs), and returns one self-contained SVG string. No client script, no DOM needed, and the same input always gives the same output.

Status: early development. Schema, authoring, layout, static rendering, and theming work. Interaction, animation, swimlanes, ports, and export are still ahead. See [the task list](openspec/changes/bootstrap-diagram-library/tasks.md).

## Install

```sh
npm install diagrammar
```

React is an optional peer dependency. You only need it for `diagrammar/react`.

## Use it

```ts
import { renderDiagram } from 'diagrammar/server';

const svg = await renderDiagram({
  nodes: [
    { id: 'a', label: 'Client' },
    { id: 'b', label: 'API', role: 'primary' },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b' }],
});
```

`svg` is a string. Write it to a file, inline it in HTML, or return it from a route. In React, `DiagramView` draws it and the markup is present in server-rendered HTML.

| Import | What it gives you |
| --- | --- |
| `diagrammar` | The schema, validation, and `defineDiagram()` |
| `diagrammar/react` | `<Diagram>`, `<Node>`, `<Edge>`, `<Group>`, `<Layer>`, `definitionFromElement()`, `DiagramView` |
| `diagrammar/layout` | `layoutDiagram()` for automatic layout (bundles ELK) |
| `diagrammar/render` | `renderSvg()`, themes, and icons. No ELK, so it stays small |
| `diagrammar/server` | `renderDiagram()`: validate, lay out, and render in one call |

To keep ELK out of your page bundle, compute the layout at build time and pass the saved result to `renderSvg()` or `DiagramView`.

## Examples

Every image below is generated from the code under it, in light and dark. They follow your GitHub theme. Each one is drawn with `renderDiagram(diagram, options)`.

<!-- examples:start -->

### A first diagram

Write the diagram as plain data. defineDiagram() type-checks it as you type.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/quickstart.dark.svg">
  <img alt="Release pipeline. A change moves from a developer through CI to the package registry." src="docs/examples/quickstart.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
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

const options: RenderDiagramOptions = {};
```

### Write it as React

The same model as components. They draw nothing themselves, definitionFromElement() reads them into plain data.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/react.dark.svg">
  <img alt="Web application" src="docs/examples/react.light.svg">
</picture>

```tsx
import { Diagram, Edge, Group, Node, definitionFromElement } from 'diagrammar/react';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = definitionFromElement(
  <Diagram title="Web application">
    <Node id="reader" type="actor" label="Reader" />
    <Group id="edge" label="Edge">
      <Node id="cdn" type="pill" label="CDN" icon="cloud" />
    </Group>
    <Group id="backend" label="Backend">
      <Node id="app" type="card" label="App server" subtitle="Next.js" icon="server" role="primary" />
      <Node id="db" type="database" label="Postgres" />
    </Group>
    <Edge from="reader" to="cdn" label="HTTPS" />
    <Edge from="cdn" to="app" />
    <Edge from="app" to="db" label="SQL" arrow="both" />
  </Diagram>,
);

const options: RenderDiagramOptions = { layout: { direction: 'right' } };
```

### Groups, nesting, and layers

Groups can nest. A hidden layer keeps its space (the gap under Orders), so showing it later moves nothing. Set keepHiddenSpace to false in the layout options to close the gap.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/layers.dark.svg">
  <img alt="Services and a hidden migration layer" src="docs/examples/layers.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
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

const options: RenderDiagramOptions = { layout: { direction: 'down' } };
```

### Roles and edge styles

Status is never color alone. Success, warning, and danger add a badge shape, muted nodes get a dashed outline, and edges can be solid, dashed, or dotted.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/roles.dark.svg">
  <img alt="Roles and edge styles" src="docs/examples/roles.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
  title: 'Roles and edge styles',
  nodes: [
    { id: 'source', label: 'Primary', role: 'primary', type: 'card', subtitle: 'The main path' },
    { id: 'ok', label: 'Healthy', role: 'success' },
    { id: 'slow', label: 'Degraded', role: 'warning' },
    { id: 'down', label: 'Failing', role: 'danger' },
    { id: 'off', label: 'Retired', role: 'muted' },
  ],
  edges: [
    { id: 'a', from: 'source', to: 'ok', label: 'solid' },
    { id: 'b', from: 'source', to: 'slow', style: 'dashed', label: 'dashed' },
    { id: 'c', from: 'source', to: 'down', style: 'dotted', label: 'dotted', role: 'danger' },
    { id: 'd', from: 'source', to: 'off', arrow: 'none', label: 'no arrow' },
  ],
});

const options: RenderDiagramOptions = {};
```

### Icons

Ten icons are built in. Add your own with registerIcon() or the icons option.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/icons.dark.svg">
  <img alt="Notification flow" src="docs/examples/icons.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
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
const options: RenderDiagramOptions = {
  icons: {
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  },
};
```

### Tree layout

For hierarchies. Straight routing keeps the lines short.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/tree.dark.svg">
  <img alt="Org chart" src="docs/examples/tree.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
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

const options: RenderDiagramOptions = {
  layout: { strategy: 'tree', direction: 'down', routing: 'straight' },
};
```

### Radial layout

A hub in the middle with everything else around it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/radial.dark.svg">
  <img alt="Event bus" src="docs/examples/radial.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
  title: 'Event bus',
  nodes: [
    { id: 'bus', label: 'Event bus', type: 'card', role: 'primary' },
    { id: 'orders', label: 'Orders' },
    { id: 'billing', label: 'Billing' },
    { id: 'search', label: 'Search' },
    { id: 'email', label: 'Email' },
    { id: 'audit', label: 'Audit', role: 'muted' },
  ],
  edges: ['orders', 'billing', 'search', 'email', 'audit'].map((id) => ({
    id: `bus-${id}`,
    from: 'bus',
    to: id,
    arrow: 'none' as const,
  })),
});

const options: RenderDiagramOptions = { layout: { strategy: 'radial', routing: 'straight' } };
```

### Pinned nodes

Give a node x and y and it stays put. The automatic layout works around it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/pinned.dark.svg">
  <img alt="Pinned nodes" src="docs/examples/pinned.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

// Nodes with x and y keep that position. The rest are laid out around them.
const diagram = defineDiagram({
  title: 'Pinned nodes',
  nodes: [
    { id: 'client', label: 'Client', x: 0, y: 160 },
    { id: 'gateway', label: 'Gateway', role: 'primary' },
    { id: 'users', label: 'Users' },
    { id: 'billing', label: 'Billing' },
    { id: 'audit', label: 'Audit log', type: 'database', x: 520, y: 160, role: 'muted' },
  ],
  edges: [
    { id: 'e1', from: 'client', to: 'gateway' },
    { id: 'e2', from: 'gateway', to: 'users' },
    { id: 'e3', from: 'gateway', to: 'billing' },
    { id: 'e4', from: 'users', to: 'audit', style: 'dashed' },
    { id: 'e5', from: 'billing', to: 'audit', style: 'dashed' },
  ],
});

const options: RenderDiagramOptions = { layout: { routing: 'straight' } };
```

### Custom theme and per-node colors

Extend the default theme with your own tokens, or color a single node. Both light and dark appearances are covered.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/theme.dark.svg">
  <img alt="Custom theme and per-node colors" src="docs/examples/theme.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import { defaultTheme, extendTheme } from 'diagrammar/render';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
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

const options: RenderDiagramOptions = { theme: violet };
```

### High-contrast theme

A built-in theme that meets WCAG AAA text contrast in both appearances.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/high-contrast.dark.svg">
  <img alt="High-contrast theme" src="docs/examples/high-contrast.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram({
  title: 'High-contrast theme',
  nodes: [
    { id: 'req', label: 'Request', role: 'primary' },
    { id: 'ok', label: 'Served', role: 'success' },
    { id: 'retry', label: 'Retried', role: 'warning' },
    { id: 'fail', label: 'Rejected', role: 'danger' },
  ],
  edges: [
    { id: 'e1', from: 'req', to: 'ok' },
    { id: 'e2', from: 'req', to: 'retry', style: 'dashed' },
    { id: 'e3', from: 'req', to: 'fail', style: 'dotted' },
  ],
});

const options: RenderDiagramOptions = { theme: 'high-contrast' };
```

### Custom node types

Draw your own outline for a node type. Text, icon, and status badge are added for you.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/examples/custom-node.dark.svg">
  <img alt="Custom node type" src="docs/examples/custom-node.light.svg">
</picture>

```ts
import { defineDiagram } from 'diagrammar';
import type { RenderDiagramOptions } from 'diagrammar/server';

const diagram = defineDiagram<'note'>({
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
const options: RenderDiagramOptions = {
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
```

<!-- examples:end -->

The sources are in [examples/](examples), and `npm run examples` regenerates the images and this section.

## Goals

- Rich diagrams: groups, swimlanes, ports, icons, labeled edges, custom element types.
- Server-rendered SVG, so content is visible and indexable without client scripts.
- A static path that ships no JavaScript, with interaction and animation loaded only where wanted.
- Automatic layout (ELK) with manual overrides, precomputable at build time.
- Theming with design tokens, light and dark modes, and accessibility built in.
- Export to SVG and PNG, and clean printing.

## How this project is developed

Behavior is specified with [OpenSpec](https://github.com/Fission-AI/OpenSpec) before it's implemented.

- `openspec/specs/` holds the current requirements.
- `openspec/changes/` holds proposed changes: a proposal, a design, delta specs, and a task list.

To propose a change, add one under `openspec/changes/`, then run `npx @fission-ai/openspec validate <change-name>`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
