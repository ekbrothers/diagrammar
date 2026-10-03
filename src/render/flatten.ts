import { ROLES, colorVariables, type Theme } from './theme.js';

/**
 * Rewrites CSS that relies on custom properties into CSS that does not.
 *
 * Rasterizers and older SVG viewers implement CSS selectors but not custom properties, so a
 * diagram drawn with var() paints as black. Role colors arrive through variables that a
 * .role-* rule sets, which means the value depends on an ancestor and cannot be substituted in
 * place. Each rule that reads one of those is therefore repeated once per role, with the role
 * class prepended to the selector, and only then are the values substituted.
 */

const ROLE_SCOPED = ['--fill', '--stroke', '--text', '--es'];

function substitute(value: string, vars: Map<string, string>): string {
  // var(--name) and var(--name, fallback), innermost first so nested fallbacks resolve.
  let out = value;
  for (let pass = 0; pass < 10; pass += 1) {
    const next = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (whole, name: string, fallback?: string) => {
      const found = vars.get(name);
      if (found !== undefined) return found;
      if (fallback !== undefined) return fallback.trim();
      return whole;
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

interface Rule {
  selector: string;
  body: string;
}

function parseRules(css: string): (Rule | string)[] {
  const out: (Rule | string)[] = [];
  let index = 0;
  while (index < css.length) {
    const open = css.indexOf('{', index);
    if (open === -1) break;
    const selector = css.slice(index, open).trim();
    if (selector.startsWith('@')) {
      // A media block holds nested rules; keep it whole and let the caller drop it.
      let depth = 1;
      let cursor = open + 1;
      while (cursor < css.length && depth > 0) {
        if (css[cursor] === '{') depth += 1;
        else if (css[cursor] === '}') depth -= 1;
        cursor += 1;
      }
      out.push(css.slice(index, cursor));
      index = cursor;
      continue;
    }
    const close = css.indexOf('}', open);
    if (close === -1) break;
    out.push({ selector, body: css.slice(open + 1, close).trim() });
    index = close + 1;
  }
  return out;
}

/**
 * Resolves every var() in a stylesheet produced for one appearance.
 *
 * `scope` is the diagram's scope class, and `theme`/`appearance` supply the palette. Media
 * blocks are dropped, since a flattened stylesheet describes exactly one appearance.
 */
export function flattenCss(css: string, scope: string, theme: Theme, appearance: 'light' | 'dark'): string {
  const base = new Map(Object.entries(colorVariables(theme[appearance])));
  // An element with no role class still has to paint, so the role-scoped names fall back to the
  // default palette, matching what a browser resolves through the .role-default rule.
  base.set('--fill', base.get('--dg-default-fill') ?? '');
  base.set('--stroke', base.get('--dg-default-stroke') ?? '');
  base.set('--text', base.get('--dg-default-text') ?? '');
  base.set('--es', base.get('--dg-edge') ?? '');

  const roleVars = new Map<string, Map<string, string>>();
  for (const role of ROLES) {
    const vars = new Map(base);
    vars.set('--fill', base.get(`--dg-${role}-fill`) ?? '');
    vars.set('--stroke', base.get(`--dg-${role}-stroke`) ?? '');
    vars.set('--text', base.get(`--dg-${role}-text`) ?? '');
    vars.set('--es', base.get(`--dg-${role}-stroke`) ?? '');
    roleVars.set(role, vars);
  }

  const out: string[] = [];
  for (const rule of parseRules(css)) {
    if (typeof rule === 'string') continue; // media block: one appearance only
    const { selector, body } = rule;

    // Drop declarations that only define custom properties; nothing reads them after this.
    const declarations = body
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && !d.startsWith('--'));
    if (declarations.length === 0) continue;

    const text = declarations.join(';');
    const needsRole = ROLE_SCOPED.some((name) => text.includes(`var(${name}`));
    if (!needsRole) {
      out.push(`${selector}{${substitute(text, base)}}`);
      continue;
    }

    // An element with no role class matches none of the role rules below, so emit the
    // unroled case first using each variable's own fallback.
    out.push(`${selector}{${substitute(text, base)}}`);

    for (const role of ROLES) {
      const vars = roleVars.get(role);
      if (!vars) continue;
      // Insert the role class after the scope class so it still matches a descendant element.
      const scoped = selector
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const marker = `.${scope}`;
          return trimmed.startsWith(marker)
            ? `${marker}.role-${role}${trimmed.slice(marker.length)}, ${marker} .role-${role}${trimmed.slice(marker.length)}`
            : `.role-${role} ${trimmed}`;
        })
        .join(', ');
      out.push(`${scoped}{${substitute(text, vars)}}`);
    }
  }
  return out.join('\n');
}

/**
 * Rewrites inline styles so they survive flattening.
 *
 * A per-node color override arrives as a custom property on the node group, which the flattened
 * stylesheet can no longer read. Each one is turned into a nested rule targeting that node's id,
 * which outranks the role rule and so keeps the author's color. Returns the rewritten markup and
 * the extra rules to append to the stylesheet.
 */
export function flattenInlineStyles(
  markup: string,
  theme: Theme,
  appearance: 'light' | 'dark',
): { markup: string; css: string } {
  const base = new Map(Object.entries(colorVariables(theme[appearance])));
  const extra: string[] = [];

  const out = markup.replace(/<g class="(node[^"]*)" id="([^"]+)"([^>]*?) style="([^"]*)"/g, (whole, cls: string, id: string, rest: string, style: string) => {
    const vars = new Map<string, string>();
    const kept: string[] = [];
    for (const part of style.split(';')) {
      const [rawName, ...rest] = part.split(':');
      const name = rawName?.trim() ?? '';
      const value = rest.join(':').trim();
      if (name.startsWith('--') && value.length > 0) vars.set(name, substitute(value, base));
      else if (part.trim().length > 0) kept.push(part.trim());
    }
    if (vars.size === 0) return whole;

    const selector = `#${id.replace(/["\\]/g, '')}`;
    const fill = vars.get('--fill');
    const stroke = vars.get('--stroke');
    const text = vars.get('--text');
    if (fill !== undefined || stroke !== undefined) {
      const decls = [fill !== undefined ? `fill:${fill}` : '', stroke !== undefined ? `stroke:${stroke}` : '']
        .filter(Boolean)
        .join(';');
      extra.push(`${selector} .shape{${decls}}`);
    }
    if (stroke !== undefined) extra.push(`${selector} .glyph{stroke:${stroke}}`);
    if (text !== undefined) {
      extra.push(`${selector} .lbl,${selector} .sub{fill:${text}}`);
      extra.push(`${selector} .icon{color:${text}}`);
    }
    const style2 = kept.length > 0 ? ` style="${kept.join(';')}"` : '';
    return `<g class="${cls}" id="${id}"${rest}${style2}`;
  });

  return { markup: out, css: extra.join('\n') };
}
