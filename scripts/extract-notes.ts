// Prints the changelog notes for a version. Used by the release workflow.
import { readFileSync } from 'node:fs';
import { extractNotes } from './changelog.ts';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/extract-notes.ts <version>');
  process.exit(1);
}
const notes = extractNotes(readFileSync('CHANGELOG.md', 'utf8'), version);
if (notes === null) {
  console.error(`CHANGELOG.md has no notes for ${version}.`);
  process.exit(1);
}
console.log(notes);
