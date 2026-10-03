export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const num = (n: number): number => Math.round(n * 100) / 100;

/** Returns the href if it is safe to put in a link, otherwise undefined. */
export function safeHref(href: string): string | undefined {
  const value = href.trim();
  if (value === '') return undefined;
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (/^[#/.?]/.test(value)) return value;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return undefined;
}

/** Whether a string is safe to use as a CSS value inside a style attribute or rule. */
export function isSafeCssValue(value: string): boolean {
  return /^[^;{}<>"'\\]+$/.test(value) && !/url\s*\(|expression|@import|javascript:/i.test(value);
}

export function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function warnOnce(seen: Set<string>, message: string, report?: (message: string) => void): void {
  if (seen.has(message)) return;
  seen.add(message);
  if (report) return report(message);
  const production = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  if (!production) console.warn(`[diagrammar] ${message}`);
}
