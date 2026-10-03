import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { importIcons, renderModule } from './import-icons.js';

const HELP = `diagrammar icons import <input...> --prefix <name> [options]

Turns SVG files into a module of icons you can register under a prefix.
Inputs can be SVG files, folders, or .zip archives. Icons are rebuilt from an
allowlist of shapes, so scripts and external references cannot come through.

Options
  --prefix <name>   Name for the set, such as aws. Used in the default output path.
  --out <file>      Where to write. A .json path writes JSON, anything else writes TypeScript.
                    Default: icons/<prefix>.ts
  --match <regex>   Only use files whose path matches, such as "/64/" to take one size.
  --strip <regex>   Remove this from each name first, such as "^(Amazon|AWS)-".
  --help            Show this text.

Then register the set once, and use "prefix:name" in your diagrams:
  import aws from './icons/aws';
  registerIconPack('aws', aws);   // icon: 'aws:ec2'

Check the license of any icon set before you bundle or publish it.
`;

interface Parsed {
  inputs: string[];
  flags: Map<string, string>;
  help: boolean;
}

function parse(args: string[]): Parsed {
  const inputs: string[] = [];
  const flags = new Map<string, string>();
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--help' || arg === '-h') help = true;
    else if (arg.startsWith('--')) {
      const value = args[++i];
      if (value === undefined) throw new Error(`${arg} needs a value.`);
      flags.set(arg.slice(2), value);
    } else inputs.push(arg);
  }
  return { inputs, flags, help };
}

function pattern(flags: Map<string, string>, name: string): RegExp | undefined {
  const source = flags.get(name);
  if (source === undefined) return undefined;
  try {
    return new RegExp(source, 'i');
  } catch {
    throw new Error(`--${name} is not a valid regular expression: ${source}`);
  }
}

export function run(argv: string[], log: (line: string) => void = console.log): number {
  const [command, subcommand, ...rest] = argv;
  if (command !== 'icons' || subcommand !== 'import') {
    log(HELP);
    return command === undefined || command === '--help' || command === '-h' ? 0 : 1;
  }
  try {
    const { inputs, flags, help } = parse(rest);
    if (help) {
      log(HELP);
      return 0;
    }
    const prefix = flags.get('prefix');
    if (!prefix) throw new Error('--prefix is required, for example --prefix aws.');
    if (inputs.length === 0) throw new Error('Pass at least one SVG file, folder, or zip.');

    const { icons, skipped } = importIcons({ inputs, match: pattern(flags, 'match'), strip: pattern(flags, 'strip') });
    const count = Object.keys(icons).length;
    if (count === 0) throw new Error('No icons were imported.' + (skipped.length > 0 ? ` First problem: ${skipped[0]!.reason}` : ''));

    const out = flags.get('out') ?? `icons/${prefix}.ts`;
    const text = out.endsWith('.json') ? JSON.stringify(icons, null, 2) + '\n' : renderModule(prefix, icons);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);

    log(`Wrote ${count} icons to ${out}.`);
    for (const s of skipped) log(`Skipped ${s.path}: ${s.reason}`);
    return 0;
  } catch (cause) {
    log(`Error: ${cause instanceof Error ? cause.message : String(cause)}`);
    return 1;
  }
}
