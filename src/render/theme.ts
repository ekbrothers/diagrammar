import type { z } from 'zod';
import type { roleSchema } from '../schema/types.js';
import { isSafeCssValue } from './util.js';

export type Role = z.infer<typeof roleSchema>;
export const ROLES = ['default', 'primary', 'success', 'warning', 'danger', 'muted'] as const satisfies readonly Role[];

export interface RolePalette {
  fill: string;
  stroke: string;
  text: string;
}

/** The colors for one appearance (light or dark). Values may be any CSS color or var(--host-variable). */
export interface ColorTokens {
  background: string;
  text: string;
  textMuted: string;
  edge: string;
  groupFill: string;
  groupStroke: string;
  roles: Record<Role, RolePalette>;
}

export interface Theme {
  name: string;
  fontFamily: string;
  /** Corner radius of boxes and cards, in pixels. */
  radius: number;
  /** Outline width, in pixels. */
  strokeWidth: number;
  /** CSS filter for cards, such as a drop-shadow. */
  shadow: string;
  light: ColorTokens;
  dark: ColorTokens;
}

export type ColorOverrides = Partial<Omit<ColorTokens, 'roles'>> & {
  roles?: Partial<Record<Role, Partial<RolePalette>>>;
};

export interface ThemeOverrides {
  name?: string;
  fontFamily?: string;
  radius?: number;
  strokeWidth?: number;
  shadow?: string;
  light?: ColorOverrides;
  dark?: ColorOverrides;
}

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const defaultTheme: Theme = {
  name: 'default',
  fontFamily: FONT,
  radius: 8,
  strokeWidth: 1.5,
  shadow: 'drop-shadow(0 1px 2px rgba(31, 35, 40, 0.18))',
  light: {
    background: '#ffffff',
    text: '#1f2328',
    textMuted: '#57606a',
    edge: '#57606a',
    groupFill: '#f6f8fa',
    groupStroke: '#6e7781',
    roles: {
      default: { fill: '#ffffff', stroke: '#6e7781', text: '#1f2328' },
      primary: { fill: '#ddf4ff', stroke: '#0969da', text: '#0a3069' },
      success: { fill: '#dafbe1', stroke: '#1a7f37', text: '#0f5323' },
      warning: { fill: '#fff8c5', stroke: '#9a6700', text: '#4d2d00' },
      danger: { fill: '#ffebe9', stroke: '#cf222e', text: '#82071e' },
      muted: { fill: '#f6f8fa', stroke: '#6e7781', text: '#57606a' },
    },
  },
  dark: {
    background: '#0d1117',
    text: '#e6edf3',
    textMuted: '#9ea7b3',
    edge: '#9ea7b3',
    groupFill: '#161b22',
    groupStroke: '#8b949e',
    roles: {
      default: { fill: '#161b22', stroke: '#8b949e', text: '#e6edf3' },
      primary: { fill: '#0c2d6b', stroke: '#58a6ff', text: '#cae8ff' },
      success: { fill: '#0f2d1a', stroke: '#3fb950', text: '#b7f5c4' },
      warning: { fill: '#3b2e00', stroke: '#d29922', text: '#ffe9a8' },
      danger: { fill: '#4c0b12', stroke: '#f85149', text: '#ffd1cc' },
      muted: { fill: '#161b22', stroke: '#8b949e', text: '#9ea7b3' },
    },
  },
};

export const highContrastTheme: Theme = {
  name: 'high-contrast',
  fontFamily: FONT,
  radius: 4,
  strokeWidth: 2.5,
  shadow: 'none',
  light: {
    background: '#ffffff',
    text: '#000000',
    textMuted: '#1f2328',
    edge: '#000000',
    groupFill: '#ffffff',
    groupStroke: '#000000',
    roles: {
      default: { fill: '#ffffff', stroke: '#000000', text: '#000000' },
      primary: { fill: '#e6f1ff', stroke: '#003a8c', text: '#000000' },
      success: { fill: '#e3f7e8', stroke: '#0b4f1c', text: '#000000' },
      warning: { fill: '#fff4c2', stroke: '#5c3a00', text: '#000000' },
      danger: { fill: '#ffe5e3', stroke: '#8c0010', text: '#000000' },
      muted: { fill: '#f0f0f0', stroke: '#3d3d3d', text: '#000000' },
    },
  },
  dark: {
    background: '#000000',
    text: '#ffffff',
    textMuted: '#e6e6e6',
    edge: '#ffffff',
    groupFill: '#000000',
    groupStroke: '#ffffff',
    roles: {
      default: { fill: '#000000', stroke: '#ffffff', text: '#ffffff' },
      primary: { fill: '#001a40', stroke: '#79b8ff', text: '#ffffff' },
      success: { fill: '#00240d', stroke: '#56d364', text: '#ffffff' },
      warning: { fill: '#2e2000', stroke: '#f0b72f', text: '#ffffff' },
      danger: { fill: '#3d0008', stroke: '#ff7b72', text: '#ffffff' },
      muted: { fill: '#1a1a1a', stroke: '#c9c9c9', text: '#ffffff' },
    },
  },
};

const themes: Record<string, Theme> = { default: defaultTheme, 'high-contrast': highContrastTheme };

export function resolveTheme(theme: Theme | 'default' | 'high-contrast' | undefined): Theme {
  if (theme === undefined) return defaultTheme;
  if (typeof theme === 'string') {
    const found = themes[theme];
    if (!found) throw new Error(`Unknown theme "${theme}". Built-in themes are: ${Object.keys(themes).join(', ')}.`);
    return found;
  }
  return theme;
}

function mergeColors(base: ColorTokens, overrides: ColorOverrides | undefined): ColorTokens {
  if (!overrides) return base;
  const roles = { ...base.roles };
  for (const role of ROLES) {
    const patch = overrides.roles?.[role];
    if (patch) roles[role] = { ...roles[role], ...patch };
  }
  const { roles: _roles, ...rest } = overrides;
  void _roles;
  return { ...base, ...rest, roles };
}

/** Builds a theme from a base theme and token overrides. Overrides in `light` or `dark` apply to that appearance only. */
export function extendTheme(base: Theme, overrides: ThemeOverrides): Theme {
  const { light, dark, ...rest } = overrides;
  return { ...base, ...rest, light: mergeColors(base.light, light), dark: mergeColors(base.dark, dark) };
}

/** Applies the same color overrides to both appearances. */
export function applyTokens(theme: Theme, tokens: ColorOverrides | undefined): Theme {
  return tokens ? extendTheme(theme, { light: tokens, dark: tokens }) : theme;
}

/** CSS custom properties for one appearance. */
export function colorVariables(colors: ColorTokens): Record<string, string> {
  const vars: Record<string, string> = {
    '--dg-bg': colors.background,
    '--dg-text': colors.text,
    '--dg-text-muted': colors.textMuted,
    '--dg-edge': colors.edge,
    '--dg-group-fill': colors.groupFill,
    '--dg-group-stroke': colors.groupStroke,
  };
  for (const role of ROLES) {
    const palette = colors.roles[role];
    vars[`--dg-${role}-fill`] = palette.fill;
    vars[`--dg-${role}-stroke`] = palette.stroke;
    vars[`--dg-${role}-text`] = palette.text;
  }
  return vars;
}

/** Throws if any token value could escape its CSS declaration. */
export function assertSafeTheme(theme: Theme): void {
  const values: [string, string][] = [
    ['fontFamily', theme.fontFamily],
    ['shadow', theme.shadow],
    ...(['light', 'dark'] as const).flatMap((mode) =>
      Object.entries(colorVariables(theme[mode])).map(([k, v]) => [`${mode} ${k}`, v] as [string, string]),
    ),
  ];
  for (const [name, value] of values) {
    if (!isSafeCssValue(value) && !(name === 'fontFamily' && /^[^;{}<>\\]+$/.test(value))) {
      throw new Error(`Theme token "${name}" has an unsafe value: ${value}`);
    }
  }
}
