const UNRELEASED = '## [Unreleased]';

/** Returns the body of one version's section, or null if there is none. */
export function extractNotes(changelog: string, version: string): string | null {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## ['));
  const section = (end === -1 ? rest : rest.slice(0, end)).filter((l) => !/^\[[^\]]+\]: /.test(l));
  const body = section.join('\n').trim();
  return body === '' ? null : body;
}

/** Whether the Unreleased section has anything in it besides empty headings. */
export function hasUnreleasedChanges(changelog: string): boolean {
  const body = extractNotes(changelog, 'Unreleased');
  if (body === null) return false;
  return body.split('\n').some((l) => l.trim() !== '' && !l.startsWith('###'));
}

/**
 * Moves the Unreleased entries under a new dated version heading, leaves a fresh
 * empty Unreleased section, and updates the compare links at the bottom.
 */
export function promoteUnreleased(changelog: string, version: string, date: string, repoUrl: string): string {
  if (!changelog.includes(UNRELEASED)) throw new Error('CHANGELOG.md has no "## [Unreleased]" section.');
  if (!hasUnreleasedChanges(changelog)) throw new Error('The Unreleased section of CHANGELOG.md is empty.');
  if (changelog.includes(`## [${version}]`)) throw new Error(`CHANGELOG.md already has a section for ${version}.`);

  const previous = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+[^\]]*)\]/gm)][0]?.[1];
  let out = changelog.replace(UNRELEASED, `${UNRELEASED}\n\n## [${version}] - ${date}`);

  const unreleasedLink = `[Unreleased]: ${repoUrl}/compare/v${version}...HEAD`;
  const versionLink = previous
    ? `[${version}]: ${repoUrl}/compare/v${previous}...v${version}`
    : `[${version}]: ${repoUrl}/releases/tag/v${version}`;

  if (/^\[Unreleased\]:.*$/m.test(out)) {
    out = out.replace(/^\[Unreleased\]:.*$/m, `${unreleasedLink}\n${versionLink}`);
  } else {
    out = `${out.trimEnd()}\n\n${unreleasedLink}\n${versionLink}\n`;
  }
  return out;
}

/** Next version for a bump keyword, or the explicit version if one is given. */
export function nextVersion(current: string, bump: string): string {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(current);
  if (!match) throw new Error(`Cannot parse current version "${current}".`);
  const [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Unknown bump "${bump}". Use patch, minor, major, or an explicit x.y.z version.`);
}
