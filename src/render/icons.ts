/**
 * An icon is SVG markup drawn on a 24 by 24 grid, in outline style. It is inserted as-is,
 * so only register markup you trust. Strokes should use currentColor.
 */
export interface IconDefinition {
  body: string;
  viewBox?: string;
}

export type IconMap = Record<string, string | IconDefinition>;

export const builtInIcons: Record<string, IconDefinition> = {
  box: { body: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>' },
  database: {
    body: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  },
  server: {
    body: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  },
  user: { body: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>' },
  cloud: { body: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z"/>' },
  globe: { body: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>' },
  lock: { body: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
  code: { body: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>' },
  mail: { body: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>' },
  file: { body: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>' },
};

const registered: Record<string, IconDefinition> = {};

const normalize = (icon: string | IconDefinition): IconDefinition => (typeof icon === 'string' ? { body: icon } : icon);

/** Registers an icon for every diagram rendered afterwards. */
export function registerIcon(name: string, icon: string | IconDefinition): void {
  registered[name] = normalize(icon);
}

export function lookupIcon(name: string, local?: IconMap): IconDefinition | undefined {
  const own = local?.[name];
  return own ? normalize(own) : (registered[name] ?? builtInIcons[name]);
}
