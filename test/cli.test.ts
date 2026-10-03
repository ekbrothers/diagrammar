import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { run } from '../src/cli/index.js';
import { iconName, importIcons, renderModule } from '../src/cli/import-icons.js';
import { readZip } from '../src/cli/zip.js';

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(files: Record<string, string>, method: 0 | 8 = 8): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text);
    const data = method === 8 ? deflateRawSync(raw) : raw;
    const nameBuf = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc32(raw), 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + data.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

const svg = (d: string) => `<svg viewBox="0 0 24 24"><path d="${d}" fill="#f90"/></svg>`;

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'diagrammar-cli-'));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('readZip', () => {
  it.each([8, 0] as const)('reads files compressed with method %i', (method) => {
    const entries = readZip(makeZip({ 'a/one.svg': 'hello', 'two.txt': 'world' }, method));
    expect(entries.map((e) => e.path)).toEqual(['a/one.svg', 'two.txt']);
    expect(entries[0]!.read().toString()).toBe('hello');
  });

  it('rejects data that is not a zip', () => {
    expect(() => readZip(Buffer.from('definitely not a zip file at all'))).toThrow(/not a zip/);
  });

  it('rejects a damaged directory', () => {
    const zip = makeZip({ 'a.svg': 'x' });
    zip.writeUInt32LE(0, zip.length - 22 - 46 - 5);
    expect(() => readZip(zip)).toThrow();
  });
});

describe('iconName', () => {
  it.each([
    ['Arch_Amazon-EC2_64.svg', 'amazon-ec2', 64],
    ['Res_Amazon-Simple-Storage-Service_Bucket_48.svg', 'amazon-simple-storage-service-bucket', 48],
    ['Load Balancer.svg', 'load-balancer', 0],
  ])('cleans %s', (file, name, size) => {
    expect(iconName(`some/dir/${file}`)).toEqual({ name, size });
  });

  it('applies the strip pattern before cleaning', () => {
    expect(iconName('Arch_Amazon-EC2_64.svg', /^Amazon-/i).name).toBe('ec2');
  });
});

describe('importIcons', () => {
  it('reads folders and zips, prefers the larger size, and reports what it skipped', () => {
    const folder = join(dir, 'set');
    mkdirSync(join(folder, 'nested'), { recursive: true });
    writeFileSync(join(folder, 'Arch_Thing_32.svg'), svg('M0 0h8v8z'));
    writeFileSync(join(folder, 'nested', 'Arch_Thing_64.svg'), svg('M0 0h16v16z'));
    writeFileSync(join(folder, 'Arch_Bad_64.svg'), '<svg viewBox="0 0 1 1"><script>x</script></svg>');
    writeFileSync(join(folder, 'notes.txt'), 'ignore me');
    const zipPath = join(dir, 'more.zip');
    writeFileSync(zipPath, makeZip({ 'x/Res_Zipped_48.svg': svg('M0 0h4v4z'), '__MACOSX/Res_Junk_48.svg': svg('M0 0'), 'readme.md': 'hi' }));

    const { icons, skipped } = importIcons({ inputs: [folder, zipPath] });
    expect(Object.keys(icons).sort()).toEqual(['thing', 'zipped']);
    expect(icons.thing!.body).toContain('M0 0h16v16z');
    expect(skipped.map((s) => s.path.split('/').pop())).toEqual(['Arch_Bad_64.svg']);
  });

  it('filters by path with match', () => {
    const file = join(dir, 'Arch_Only_64.svg');
    writeFileSync(file, svg('M0 0h8v8z'));
    expect(Object.keys(importIcons({ inputs: [file], match: /nothing/ }).icons)).toEqual([]);
    expect(Object.keys(importIcons({ inputs: [file], match: /only/i }).icons)).toEqual(['only']);
  });

  it('skips a single file with a name that cleans to nothing', () => {
    const file = join(dir, '___.svg');
    writeFileSync(file, svg('M0 0h8v8z'));
    expect(importIcons({ inputs: [file] }).skipped[0]!.reason).toMatch(/nothing left/);
  });
});

describe('renderModule', () => {
  it('writes a module with sorted, quoted keys and a safe identifier', () => {
    const text = renderModule('my-pack', { b: { body: '<g/>', viewBox: '0 0 1 1', color: true }, a: { body: '<g/>', viewBox: '0 0 1 1', color: true } });
    expect(text).toContain('export const my_pack');
    expect(text.indexOf('"a"')).toBeLessThan(text.indexOf('"b"'));
    expect(renderModule('1x', {})).toContain('export const _1x');
  });
});

describe('run', () => {
  const lines = () => {
    const out: string[] = [];
    return { out, log: (l: string) => out.push(l) };
  };

  it('shows help with no arguments and fails on an unknown command', () => {
    const a = lines();
    expect(run([], a.log)).toBe(0);
    expect(a.out[0]).toContain('icons import');
    expect(run(['nope'], lines().log)).toBe(1);
    expect(run(['icons', 'import', '--help'], lines().log)).toBe(0);
  });

  it('imports into a TypeScript module', () => {
    const input = join(dir, 'cli-in');
    mkdirSync(input);
    writeFileSync(join(input, 'Arch_Amazon-EC2_64.svg'), svg('M0 0h8v8z'));
    const out = join(dir, 'out', 'aws.ts');
    const l = lines();
    expect(run(['icons', 'import', input, '--prefix', 'aws', '--out', out, '--strip', '^Amazon-'], l.log)).toBe(0);
    expect(l.out[0]).toContain('Wrote 1 icons');
    expect(readFileSync(out, 'utf8')).toContain('"ec2"');
  });

  it('writes JSON for a .json output path', () => {
    const input = join(dir, 'cli-json.svg');
    writeFileSync(input, svg('M0 0h8v8z'));
    const out = join(dir, 'out', 'x.json');
    expect(run(['icons', 'import', input, '--prefix', 'x', '--out', out], lines().log)).toBe(0);
    expect(Object.keys(JSON.parse(readFileSync(out, 'utf8')))).toEqual(['cli-json']);
  });

  it.each([
    [['icons', 'import', 'a.svg'], /--prefix is required/],
    [['icons', 'import', '--prefix', 'x'], /at least one/],
    [['icons', 'import', 'a.svg', '--prefix'], /needs a value/],
    [['icons', 'import', 'a.svg', '--prefix', 'x', '--match', '('], /not a valid regular expression/],
  ])('reports a clear error for %j', (args, message) => {
    const l = lines();
    expect(run(args, l.log)).toBe(1);
    expect(l.out.join('\n')).toMatch(message);
  });

  it('fails when nothing could be imported', () => {
    const input = join(dir, 'bad.svg');
    writeFileSync(input, '<svg viewBox="0 0 1 1"><script>x</script></svg>');
    const l = lines();
    expect(run(['icons', 'import', input, '--prefix', 'x'], l.log)).toBe(1);
    expect(l.out.join('\n')).toContain('No icons were imported');
  });

  it('reports a missing input file', () => {
    expect(run(['icons', 'import', join(dir, 'missing.svg'), '--prefix', 'x'], lines().log)).toBe(1);
  });
});

describe('import mermaid', () => {
  const write = (name: string, text: string) => {
    const path = join(dir, name);
    writeFileSync(path, text);
    return path;
  };

  it('converts a flowchart file and reports a clean conversion', () => {
    const input = write('clean.mmd', 'flowchart LR\n  A[One] --> B[Two]\n');
    const out = join(dir, 'clean.ts');
    const lines: string[] = [];
    expect(run(['import', 'mermaid', input, '--out', out], (l) => lines.push(l))).toBe(0);
    const text = readFileSync(out, 'utf8');
    expect(text).toContain("id: \"A\"");
    expect(text).toContain('defineDiagram');
    expect(lines.join('\n')).toContain('Everything in the source was converted');
  });

  it('prints what was not converted', () => {
    const input = write('lossy.mmd', 'flowchart LR\n  A --> B\n  classDef big fill:#f9f\n');
    const lines: string[] = [];
    run(['import', 'mermaid', input, '--out', join(dir, 'lossy.ts')], (l) => lines.push(l));
    expect(lines.join('\n')).toContain('line 3, classDef');
  });

  it('writes JSON when the output ends in .json', () => {
    const input = write('json.mmd', 'flowchart LR\n  A --> B\n');
    const out = join(dir, 'out.json');
    run(['import', 'mermaid', input, '--out', out], () => {});
    expect(JSON.parse(readFileSync(out, 'utf8')).nodes).toHaveLength(2);
  });

  it('converts a fenced block in Markdown', () => {
    const input = write('one.md', '# T\n\n```mermaid\nflowchart LR\n  A --> B\n```\n');
    const out = join(dir, 'one.ts');
    expect(run(['import', 'mermaid', input, '--out', out], () => {})).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('id: "A"');
  });

  it('reports the count and converts the chosen block when Markdown has several', () => {
    const input = write('many.md', '```mermaid\nflowchart LR\n  A --> B\n```\n\n```mermaid\nflowchart LR\n  C --> D\n```\n');
    const lines: string[] = [];
    const out = join(dir, 'many.ts');
    run(['import', 'mermaid', input, '--block', '2', '--out', out], (l) => lines.push(l));
    expect(lines.join('\n')).toContain('has 2 mermaid blocks');
    expect(readFileSync(out, 'utf8')).toContain('id: "C"');
  });

  it('refuses a block number outside the range', () => {
    const input = write('two.md', '```mermaid\nflowchart LR\n  A --> B\n```\n');
    const lines: string[] = [];
    expect(run(['import', 'mermaid', input, '--block', '5'], (l) => lines.push(l))).toBe(1);
    expect(lines.join('\n')).toContain('--block must be between 1 and 1');
  });

  it('refuses a diagram kind that is not a flowchart', () => {
    const input = write('seq.mmd', 'sequenceDiagram\n  A->>B: hi\n');
    const lines: string[] = [];
    expect(run(['import', 'mermaid', input], (l) => lines.push(l))).toBe(1);
    expect(lines.join('\n')).toContain('Only flowcharts');
  });

  it('refuses Markdown with no mermaid block', () => {
    const input = write('none.md', '# Nothing here\n');
    const lines: string[] = [];
    expect(run(['import', 'mermaid', input], (l) => lines.push(l))).toBe(1);
    expect(lines.join('\n')).toContain('no ```mermaid code block');
  });

  it('needs a file', () => {
    const lines: string[] = [];
    expect(run(['import', 'mermaid'], (l) => lines.push(l))).toBe(1);
    expect(lines.join('\n')).toContain('Pass a .mmd or Markdown file');
  });

  it('shows its own help', () => {
    const lines: string[] = [];
    expect(run(['import', 'mermaid', '--help'], (l) => lines.push(l))).toBe(0);
    expect(lines.join('\n')).toContain('import mermaid');
  });

  it('shows the command list when given no command', () => {
    const lines: string[] = [];
    expect(run([], (l) => lines.push(l))).toBe(0);
    expect(lines.join('\n')).toContain('icons import');
    expect(lines.join('\n')).toContain('import mermaid');
  });
});
