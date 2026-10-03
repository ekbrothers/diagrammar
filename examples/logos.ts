import { defineDiagram } from '../src/index.js';
import { logos } from '../src/logos/index.js';
import { iconFromSvg, registerIcon, registerIconPack } from '../src/render/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

// Logos keep their own colors. Bundled ones are registered under a prefix of your choice.
registerIconPack('logo', logos);

// Your own logo: iconFromSvg() rebuilds the file from safe shapes and rejects scripts and external links.
registerIcon(
  'acme',
  iconFromSvg(`
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f59e0b"/>
          <stop offset="1" stop-color="#ef4444"/>
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#g)"/>
      <path d="M9 22 16 8l7 14h-4l-3-6-3 6z" fill="#fff"/>
    </svg>`),
);

export const diagram = defineDiagram({
  title: 'A stack drawn with logos',
  description: 'A browser talks to a Next.js app, which uses Postgres, Redis, Stripe, and an in-house service.',
  nodes: [
    { id: 'web', label: 'Storefront', subtitle: 'React', icon: 'logo:react' },
    { id: 'app', label: 'App', subtitle: 'Next.js', icon: 'logo:nextjs', role: 'primary' },
    { id: 'db', label: 'Orders', subtitle: 'PostgreSQL', icon: 'logo:postgresql' },
    { id: 'cache', label: 'Sessions', subtitle: 'Redis', icon: 'logo:redis' },
    { id: 'pay', label: 'Payments', subtitle: 'Stripe', icon: 'logo:stripe' },
    { id: 'rules', label: 'Pricing rules', subtitle: 'In-house', icon: 'acme' },
  ],
  edges: [
    { id: 'e1', from: 'web', to: 'app' },
    { id: 'e2', from: 'app', to: 'db' },
    { id: 'e3', from: 'app', to: 'cache' },
    { id: 'e4', from: 'app', to: 'pay' },
    { id: 'e5', from: 'app', to: 'rules' },
  ],
});

export const options: RenderDiagramOptions = {};
