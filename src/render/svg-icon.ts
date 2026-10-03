import { esc } from './util.js';
import type { IconDefinition } from './icons.js';

export class SvgIconError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SvgIconError';
  }
}

const ELEMENTS: Record<string, string> = {
  g: 'g',
  path: 'path',
  circle: 'circle',
  ellipse: 'ellipse',
  rect: 'rect',
  line: 'line',
  polyline: 'polyline',
  polygon: 'polygon',
  defs: 'defs',
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
  stop: 'stop',
  clippath: 'clipPath',
  mask: 'mask',
  use: 'use',
};

const ATTRIBUTES = [
  'd', 'fill', 'fill-opacity', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity',
  'opacity', 'transform', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height',
  'points', 'id', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
  'spreadMethod', 'fx', 'fy', 'clip-path', 'mask', 'maskUnits', 'clipPathUnits', 'color',
];
const ATTRIBUTE_BY_LOWER = new Map(ATTRIBUTES.map((a) => [a.toLowerCase(), a]));

const STYLE_PROPERTIES = new Set(
  ATTRIBUTES.filter((a) => /^(fill|stroke|opacity|stop-|clip-rule|color$)/.test(a)),
);
const ROOT_PAINT = new Set(['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'opacity', 'color']);

const reject = (what: string): never => {
  throw new SvgIconError(what);
};

function decode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function checkValue(name: string, value: string): string {
  const v = decode(value).trim();
  if (/[<>"'`\\]/.test(v) && !/^url\(#[\w.:-]+\)$/.test(v)) reject(`Attribute ${name} contains characters that are not allowed.`);
  if (/javascript:|expression|@import|data:|&/i.test(v)) reject(`Attribute ${name} has an unsafe value.`);
  const urls = v.match(/url\([^)]*\)/gi) ?? [];
  for (const u of urls) if (!/^url\(\s*#[\w.:-]+\s*\)$/i.test(u)) reject(`Attribute ${name} may only reference elements inside the same icon.`);
  if (name === 'id' && !/^[\w.:-]+$/.test(v)) reject('An id contains characters that are not allowed.');
  if (/^(d|points|transform|gradientTransform)$/.test(name) && !/^[\w\s.,+()#-]*$/.test(v)) reject(`Attribute ${name} has an unexpected value.`);
  return v;
}

function cleanStyle(css: string): string {
  const out: string[] = [];
  for (const declaration of css.split(';')) {
    const at = declaration.indexOf(':');
    if (at === -1) continue;
    const prop = declaration.slice(0, at).trim().toLowerCase();
    if (!STYLE_PROPERTIES.has(prop)) continue;
    out.push(`${prop}:${checkValue(prop, declaration.slice(at + 1))}`);
  }
  return out.join(';');
}

const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^<>"'])*)>/g;
const ATTRIBUTE = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function parseAttributes(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of raw.matchAll(ATTRIBUTE)) map.set(m[1]!, m[2] ?? m[3] ?? '');
  return map;
}

function classRules(css: string): Map<string, string> {
  const rules = new Map<string, string>();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!\[CDATA\[|\]\]>/g, '');
  if (/@/.test(text)) reject('The icon uses CSS at-rules, which are not supported. Export it with styles as attributes.');
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of m[1]!.split(',')) {
      const cls = /^\s*\.([\w-]+)\s*$/.exec(selector)?.[1];
      if (!cls) return reject(`The icon uses the CSS selector "${selector.trim()}". Only simple class selectors are supported.`);
      rules.set(cls, `${rules.get(cls) ?? ''}${m[2]};`);
    }
  }
  return rules;
}

function rebuild(body: string, rules: Map<string, string>): string {
  const out: string[] = [];
  const stack: string[] = [];
  let last = 0;
  for (const m of body.matchAll(TAG)) {
    if (body.slice(last, m.index).trim() !== '') reject('The icon contains text, which is not supported. Convert text to outlines first.');
    last = m.index + m[0].length;
    const closing = m[1] === '/';
    const lower = m[2]!.toLowerCase();
    const name = ELEMENTS[lower];
    if (!name) return reject(`The icon uses <${m[2]}>, which is not allowed. Allowed elements: ${Object.values(ELEMENTS).join(', ')}.`);
    if (closing) {
      if (stack.pop() !== name) reject('The icon markup is not balanced.');
      out.push(`</${name}>`);
      continue;
    }
    const selfClosing = /\/\s*$/.test(m[3]!);
    const attrs = parseAttributes(m[3]!);
    const parts: string[] = [];
    const style: string[] = [];
    for (const cls of (attrs.get('class') ?? '').split(/\s+/)) if (rules.has(cls)) style.push(rules.get(cls)!);
    if (attrs.has('style')) style.push(attrs.get('style')!);
    for (const [rawName, value] of attrs) {
      const attrName = rawName.toLowerCase();
      if (attrName === 'class' || attrName === 'style') continue;
      if (attrName === 'href' || attrName === 'xlink:href') {
        const target = decode(value).trim();
        if (!/^#[\w.:-]+$/.test(target)) reject('Links inside an icon may only point to elements in the same icon.');
        parts.push(`href="${esc(target)}"`);
        continue;
      }
      const canonical = ATTRIBUTE_BY_LOWER.get(attrName);
      if (!canonical) {
        if (attrName.startsWith('on')) reject(`Event handler ${rawName} is not allowed.`);
        continue;
      }
      parts.push(`${canonical}="${esc(checkValue(canonical, value))}"`);
    }
    const cleaned = cleanStyle(style.join(';'));
    if (cleaned) parts.push(`style="${esc(cleaned)}"`);
    out.push(`<${name}${parts.length > 0 ? ` ${parts.join(' ')}` : ''}${selfClosing ? '/' : ''}>`);
    if (!selfClosing) stack.push(name);
  }
  if (body.slice(last).trim() !== '') reject('The icon contains text, which is not supported. Convert text to outlines first.');
  if (stack.length > 0) reject('The icon markup is not balanced.');
  return out.join('');
}

function viewBoxOf(attrs: Map<string, string>): string {
  const box = attrs.get('viewBox') ?? attrs.get('viewbox');
  if (box) {
    const nums = box.trim().split(/[\s,]+/).map(Number);
    if (nums.length === 4 && nums.every(Number.isFinite) && nums[2]! > 0 && nums[3]! > 0) return nums.join(' ');
  }
  const w = parseFloat(attrs.get('width') ?? '');
  const h = parseFloat(attrs.get('height') ?? '');
  if (w > 0 && h > 0) return `0 0 ${w} ${h}`;
  return reject('The icon has no usable viewBox or width and height.');
}

/**
 * Turns an SVG file's text into an icon that is drawn with its own colors.
 * The markup is rebuilt from an allowlist of shapes, gradients, and clip paths, so scripts,
 * event handlers, external references, and text cannot come through. Throws SvgIconError
 * when the file uses something outside that list.
 */
export function iconFromSvg(svg: string): IconDefinition {
  const text = svg
    .replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/gi, '')
    .replace(/<(title|desc|metadata)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(title|desc|metadata)\b[^>]*\/>/gi, '')
    .replace(/<(\w+):(\w+)\b[^>]*\/>/g, '')
    .replace(/<(\w+):(\w+)\b[^>]*>[\s\S]*?<\/\1:\2\s*>/g, '');
  const root = /^\s*<svg\b((?:"[^"]*"|'[^']*'|[^<>"'])*)>([\s\S]*)<\/svg\s*>\s*$/i.exec(text);
  if (!root) return reject('Expected a single <svg> element.');
  const rootAttrs = parseAttributes(root[1]!);
  const viewBox = viewBoxOf(rootAttrs);

  let inner = root[2]!;
  const css: string[] = [];
  inner = inner.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_m, sheet: string) => {
    css.push(sheet);
    return '';
  });
  let body = rebuild(inner, classRules(css.join('\n')));

  const inherited = [...rootAttrs]
    .filter(([name]) => ROOT_PAINT.has(name.toLowerCase()))
    .map(([name, value]) => `${name.toLowerCase()}="${esc(checkValue(name, value))}"`);
  if (inherited.length > 0) body = `<g ${inherited.join(' ')}>${body}</g>`;
  if (body === '') reject('The icon has no shapes.');
  return { body, viewBox, color: true };
}

/** The part of Iconify's JSON format that diagrammar reads. See https://iconify.design. */
export interface IconifySet {
  prefix?: string;
  icons: Record<string, { body: string; width?: number; height?: number; left?: number; top?: number }>;
  aliases?: Record<string, { parent: string; rotate?: number; hFlip?: boolean; vFlip?: boolean }>;
  width?: number;
  height?: number;
}

export interface IconifyOptions {
  /** Only convert these names. Large sets have thousands of icons, so listing the ones you use keeps startup fast. */
  include?: readonly string[];
  /** Called for each icon that was skipped, with the reason. */
  onSkip?: (name: string, reason: string) => void;
}

/** Converts an Iconify icon set into icons you can pass to registerIconPack(). */
export function iconifyPack(set: IconifySet, options: IconifyOptions = {}): Record<string, IconDefinition> {
  const out: Record<string, IconDefinition> = {};
  const wanted = options.include ? new Set(options.include) : undefined;
  const convert = (name: string, source: IconifySet['icons'][string]) => {
    const width = source.width ?? set.width ?? 16;
    const height = source.height ?? set.height ?? 16;
    try {
      const icon = iconFromSvg(`<svg viewBox="${source.left ?? 0} ${source.top ?? 0} ${width} ${height}">${source.body}</svg>`);
      out[name] = icon;
    } catch (cause) {
      options.onSkip?.(name, cause instanceof Error ? cause.message : String(cause));
    }
  };
  for (const [name, source] of Object.entries(set.icons)) if (!wanted || wanted.has(name)) convert(name, source);
  for (const [name, alias] of Object.entries(set.aliases ?? {})) {
    if (wanted && !wanted.has(name)) continue;
    const parent = set.icons[alias.parent];
    if (!parent || alias.rotate || alias.hFlip || alias.vFlip) {
      options.onSkip?.(name, 'Aliases that rotate or flip another icon are not supported.');
      continue;
    }
    convert(name, parent);
  }
  return out;
}
