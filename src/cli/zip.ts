import { inflateRawSync } from 'node:zlib';

export interface ZipEntry {
  path: string;
  read(): Buffer;
}

const MAX_ENTRY_BYTES = 4 * 1024 * 1024;

/** Lists the files in a zip archive held in memory. Handles stored and deflated entries. */
export function readZip(data: Buffer): ZipEntry[] {
  let end = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 22 - 0xffff); i--) {
    if (data.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error('This is not a zip file (no end-of-archive record).');
  const count = data.readUInt16LE(end + 10);
  let at = data.readUInt32LE(end + 16);
  if (count === 0xffff || at === 0xffffffff) throw new Error('Zip64 archives are not supported. Unzip the file and pass the folder instead.');

  const entries: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (data.readUInt32LE(at) !== 0x02014b50) throw new Error('The zip file is damaged.');
    const method = data.readUInt16LE(at + 10);
    const compressed = data.readUInt32LE(at + 20);
    const size = data.readUInt32LE(at + 24);
    const nameLength = data.readUInt16LE(at + 28);
    const extraLength = data.readUInt16LE(at + 30);
    const commentLength = data.readUInt16LE(at + 32);
    const local = data.readUInt32LE(at + 42);
    const path = data.toString('utf8', at + 46, at + 46 + nameLength).replace(/\\/g, '/');
    at += 46 + nameLength + extraLength + commentLength;
    if (path.endsWith('/')) continue;

    entries.push({
      path,
      read() {
        if (size > MAX_ENTRY_BYTES) throw new Error(`${path} is larger than ${MAX_ENTRY_BYTES} bytes.`);
        if (data.readUInt32LE(local) !== 0x04034b50) throw new Error('The zip file is damaged.');
        const start = local + 30 + data.readUInt16LE(local + 26) + data.readUInt16LE(local + 28);
        const raw = data.subarray(start, start + compressed);
        if (method === 0) return raw;
        if (method === 8) return inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES });
        throw new Error(`${path} uses an unsupported compression method (${method}).`);
      },
    });
  }
  return entries;
}
