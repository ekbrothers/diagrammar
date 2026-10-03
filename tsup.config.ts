import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync } from 'node:fs';

// The bundler drops the directive, and Next.js needs it to treat the file as a client component.
function markClient(): void {
  for (const file of ['dist/interactive.js', 'dist/interactive.cjs']) {
    const code = readFileSync(file, 'utf8');
    if (!code.startsWith('"use client"')) writeFileSync(file, `"use client";
${code}`);
  }
}

const shared = {
  format: ['esm', 'cjs'] as ('esm' | 'cjs')[],
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom'],
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.tsx',
      interactive: 'src/interactive/index.tsx',
      layout: 'src/layout/index.ts',
      render: 'src/render/index.ts',
      server: 'src/server/index.ts',
      logos: 'src/logos/index.ts',
    },
    dts: true,
    clean: true,
    onSuccess: async () => markClient(),
  },
  {
    entry: { cli: 'src/cli/bin.ts' },
    format: ['esm'],
    platform: 'node',
    sourcemap: false,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
