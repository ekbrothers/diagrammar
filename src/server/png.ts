import { renderDiagram, type RenderDiagramOptions } from './index.js';

export interface RenderPngOptions extends Omit<RenderDiagramOptions, 'mode' | 'flatten'> {
  /** Pixel multiplier. 2 gives a 2x image for high-density screens. Default: 1. */
  scale?: number;
  /** Which appearance to draw. A PNG cannot follow the viewer, so there is no auto. Default: light. */
  mode?: 'light' | 'dark';
  /** Directories to search for fonts, in addition to the system ones. */
  fontDirs?: string[];
  /** Use only the fonts in fontDirs, so output does not vary with the machine. Default: false. */
  fontDirsOnly?: boolean;
}

interface ResvgModule {
  Resvg: new (
    svg: string,
    options?: {
      fitTo?: { mode: 'zoom'; value: number } | { mode: 'width'; value: number };
      font?: { fontDirs?: string[]; loadSystemFonts?: boolean };
    },
  ) => { render: () => { asPng: () => Buffer | Uint8Array } };
}

let resvg: ResvgModule | undefined;

async function load(): Promise<ResvgModule> {
  if (resvg) return resvg;
  try {
    resvg = (await import('@resvg/resvg-js')) as unknown as ResvgModule;
    return resvg;
  } catch {
    throw new Error(
      'PNG export needs the optional @resvg/resvg-js package. Install it with: npm install @resvg/resvg-js',
    );
  }
}

/**
 * Validates a diagram, lays it out, and returns a PNG.
 *
 * The SVG is drawn with custom properties resolved, because rasterizers read CSS classes but not
 * variables. Text is drawn with fonts found on the machine; pass fontDirs with fontDirsOnly to
 * make the output the same everywhere.
 */
export async function renderPng(input: unknown, options: RenderPngOptions = {}): Promise<Uint8Array> {
  const { scale = 1, mode = 'light', fontDirs, fontDirsOnly = false, ...rest } = options;
  if (!(scale > 0) || !Number.isFinite(scale)) throw new Error(`renderPng: scale must be a positive number, got ${scale}.`);

  const svg = await renderDiagram(input, { ...rest, mode, flatten: true });

  // Scale from a whole-pixel base width, so 2x is exactly twice 1x. Scaling the fractional SVG
  // width directly rounds each size on its own and can land a pixel short.
  const declared = Number(/\bwidth="([\d.]+)"/.exec(svg)?.[1]);
  const base = Number.isFinite(declared) ? Math.round(declared) : undefined;

  const { Resvg } = await load();
  const image = new Resvg(svg, {
    fitTo: base === undefined ? { mode: 'zoom', value: scale } : { mode: 'width', value: Math.max(1, Math.round(base * scale)) },
    font: { fontDirs, loadSystemFonts: !fontDirsOnly },
  }).render();
  return new Uint8Array(image.asPng());
}
