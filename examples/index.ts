import type { RenderDiagramOptions } from '../src/server/index.js';
import * as quickstart from './quickstart.ts';
import * as react from './react.tsx';
import * as layers from './layers.ts';
import * as roles from './roles.ts';
import * as icons from './icons.ts';
import * as logosExample from './logos.ts';
import * as cloud from './cloud.ts';
import * as terraform from './terraform.ts';
import * as tree from './tree.ts';
import * as radial from './radial.ts';
import * as pinned from './pinned.ts';
import * as theme from './theme.ts';
import * as highContrast from './high-contrast.ts';
import * as customNode from './custom-node.ts';

export interface Example {
  slug: string;
  title: string;
  blurb: string;
  /** The source file, relative to the examples folder. It is shown in the README. */
  file: string;
  diagram: unknown;
  options: RenderDiagramOptions;
}

export const examples: Example[] = [
  {
    slug: 'quickstart',
    title: 'A first diagram',
    blurb: 'Write the diagram as plain data. defineDiagram() type-checks it as you type.',
    file: 'quickstart.ts',
    ...quickstart,
  },
  {
    slug: 'react',
    title: 'Write it as React',
    blurb: 'The same model as components. They draw nothing themselves, definitionFromElement() reads them into plain data.',
    file: 'react.tsx',
    ...react,
  },
  {
    slug: 'layers',
    title: 'Groups, nesting, and layers',
    blurb: 'Groups can nest. A hidden layer keeps its space (the gap under Orders), so showing it later moves nothing. Set keepHiddenSpace to false in the layout options to close the gap.',
    file: 'layers.ts',
    ...layers,
  },
  {
    slug: 'roles',
    title: 'Roles and edge styles',
    blurb: 'Status is never color alone. Success, warning, and danger add a badge shape, muted nodes get a dashed outline, and edges can be solid, dashed, or dotted.',
    file: 'roles.ts',
    ...roles,
  },
  {
    slug: 'icons',
    title: 'Icons',
    blurb: 'Ten icons are built in. Add your own with registerIcon() or the icons option.',
    file: 'icons.ts',
    ...icons,
  },
  {
    slug: 'logos',
    title: 'Logos',
    blurb: 'Logos keep their own colors instead of following the text color. A few popular ones come bundled (diagrammar/logos), and iconFromSvg() turns your own SVG file into an icon after removing anything unsafe.',
    file: 'logos.ts',
    ...logosExample,
  },
  {
    slug: 'cloud',
    title: 'Cloud diagrams',
    blurb: 'Nested groups work as regions, VPCs, and subnets. Icons come from a pack you register under a prefix (aws:ec2). Vendor icon sets are not bundled; import the official ones with the command in the code.',
    file: 'cloud.ts',
    ...cloud,
  },
  {
    slug: 'terraform',
    title: 'Infrastructure as code',
    blurb: 'Brand logos and concept icons together. A plan, an apply, and a state file have no vendor logo, so diagrammar draws them.',
    file: 'terraform.ts',
    ...terraform,
  },
  {
    slug: 'tree',
    title: 'Tree layout',
    blurb: 'For hierarchies. Straight routing keeps the lines short.',
    file: 'tree.ts',
    ...tree,
  },
  {
    slug: 'radial',
    title: 'Radial layout',
    blurb: 'A hub in the middle with everything else around it.',
    file: 'radial.ts',
    ...radial,
  },
  {
    slug: 'pinned',
    title: 'Pinned nodes',
    blurb: 'Give a node x and y and it stays put. The automatic layout works around it.',
    file: 'pinned.ts',
    ...pinned,
  },
  {
    slug: 'theme',
    title: 'Custom theme and per-node colors',
    blurb: 'Extend the default theme with your own tokens, or color a single node. Both light and dark appearances are covered.',
    file: 'theme.ts',
    ...theme,
  },
  {
    slug: 'high-contrast',
    title: 'High-contrast theme',
    blurb: 'A built-in theme that meets WCAG AAA text contrast in both appearances.',
    file: 'high-contrast.ts',
    ...highContrast,
  },
  {
    slug: 'custom-node',
    title: 'Custom node types',
    blurb: 'Draw your own outline for a node type. Text, icon, and status badge are added for you.',
    file: 'custom-node.ts',
    ...customNode,
  },
];
