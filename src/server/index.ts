import { parseDiagram, type ValidateOptions } from '../schema/validate.js';
import { layoutDiagram } from '../layout/index.js';
import type { LayoutOptions } from '../layout/types.js';
import { renderSvg, type RenderOptions } from '../render/index.js';

export interface RenderDiagramOptions extends RenderOptions {
  layout?: LayoutOptions;
  validate?: ValidateOptions;
}

/** Validates a diagram, lays it out, and returns the SVG. Runs in Node with no DOM. */
export async function renderDiagram(input: unknown, options: RenderDiagramOptions = {}): Promise<string> {
  const { layout: layoutOptions, validate, ...render } = options;
  const diagram = parseDiagram(input, validate);
  const layout = await layoutDiagram(diagram, layoutOptions);
  return renderSvg(diagram, layout, render);
}

export { renderPng, type RenderPngOptions } from './png.js';
