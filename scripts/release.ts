// Usage: npm run release -- <patch|minor|major|x.y.z>
// Bumps the version, dates the changelog, commits, and tags. It never pushes:
// pushing the tag is what publishes, so that step stays with a person.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { nextVersion, promoteUnreleased } from './changelog.ts';

const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' }).trim();

const bump = process.argv[2];
if (!bump) {
  console.error('Usage: npm run release -- <patch|minor|major|x.y.z>');
  process.exit(1);
}

if (run('git', ['status', '--porcelain']) !== '') {
  console.error('The working tree has uncommitted changes. Commit or stash them first.');
  process.exit(1);
}
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'main') {
  console.error(`Releases are cut from main, but the current branch is ${branch}.`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string; repository?: { url?: string } };
const version = nextVersion(pkg.version, bump);
const repoUrl = (pkg.repository?.url ?? '').replace(/^git\+/, '').replace(/\.git$/, '');
if (repoUrl === '') {
  console.error('package.json needs a repository.url so the changelog links can be written.');
  process.exit(1);
}

const changelog = promoteUnreleased(readFileSync('CHANGELOG.md', 'utf8'), version, new Date().toISOString().slice(0, 10), repoUrl);

console.log(`Checking the build before releasing ${version}...`);
run('npm', ['run', 'check']);

writeFileSync('CHANGELOG.md', changelog);
run('npm', ['version', version, '--no-git-tag-version']);
run('git', ['add', 'CHANGELOG.md', 'package.json', 'package-lock.json']);
run('git', ['commit', '-m', `Release ${version}`]);
run('git', ['tag', '-a', `v${version}`, '-m', `v${version}`]);

console.log(`\nTagged v${version}. To publish:\n  git push origin main --follow-tags`);
