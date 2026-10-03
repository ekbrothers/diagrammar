import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractNotes, hasUnreleasedChanges, nextVersion, promoteUnreleased } from '../scripts/changelog.ts';

const REPO = 'https://github.com/ekbrothers/diagrammar';

const released = `# Changelog

## [Unreleased]

### Added

- Something new.

## [0.1.0] - 2026-01-01

### Added

- First release.

[Unreleased]: ${REPO}/compare/v0.1.0...HEAD
[0.1.0]: ${REPO}/releases/tag/v0.1.0
`;

describe('extractNotes', () => {
  it('returns the body of one version', () => {
    expect(extractNotes(released, '0.1.0')).toBe('### Added\n\n- First release.');
  });

  it('returns null for a missing version', () => {
    expect(extractNotes(released, '9.9.9')).toBeNull();
  });

  it('returns null for an empty section', () => {
    expect(extractNotes('## [Unreleased]\n\n## [0.1.0] - x\n\n- a\n', 'Unreleased')).toBeNull();
  });

  it('handles Windows line endings', () => {
    expect(extractNotes(released.replace(/\n/g, '\r\n'), '0.1.0')).toBe('### Added\n\n- First release.');
  });
});

describe('hasUnreleasedChanges', () => {
  it('is true when entries exist', () => {
    expect(hasUnreleasedChanges(released)).toBe(true);
  });

  it('is false when only headings exist', () => {
    expect(hasUnreleasedChanges('## [Unreleased]\n\n### Added\n\n## [0.1.0] - x\n')).toBe(false);
  });

  it('is false with no Unreleased section', () => {
    expect(hasUnreleasedChanges('# Changelog\n')).toBe(false);
  });
});

describe('promoteUnreleased', () => {
  it('dates the new version and leaves an empty Unreleased section', () => {
    const out = promoteUnreleased(released, '0.2.0', '2026-02-02', REPO);
    expect(out).toContain('## [Unreleased]\n\n## [0.2.0] - 2026-02-02\n\n### Added\n\n- Something new.');
    expect(hasUnreleasedChanges(out)).toBe(false);
    expect(extractNotes(out, '0.2.0')).toBe('### Added\n\n- Something new.');
    expect(extractNotes(out, '0.1.0')).toBe('### Added\n\n- First release.');
  });

  it('rewrites the compare links', () => {
    const out = promoteUnreleased(released, '0.2.0', '2026-02-02', REPO);
    expect(out).toContain(`[Unreleased]: ${REPO}/compare/v0.2.0...HEAD`);
    expect(out).toContain(`[0.2.0]: ${REPO}/compare/v0.1.0...v0.2.0`);
    expect(out).toContain(`[0.1.0]: ${REPO}/releases/tag/v0.1.0`);
  });

  it('writes a tag link for the very first release', () => {
    const first = '# Changelog\n\n## [Unreleased]\n\n### Added\n\n- Hello.\n';
    const out = promoteUnreleased(first, '0.1.0', '2026-01-01', REPO);
    expect(out).toContain(`[Unreleased]: ${REPO}/compare/v0.1.0...HEAD`);
    expect(out).toContain(`[0.1.0]: ${REPO}/releases/tag/v0.1.0`);
  });

  it('refuses an empty Unreleased section', () => {
    expect(() => promoteUnreleased('## [Unreleased]\n\n### Added\n', '0.1.0', 'd', REPO)).toThrow(/empty/);
  });

  it('refuses a changelog with no Unreleased section', () => {
    expect(() => promoteUnreleased('# Changelog\n', '0.1.0', 'd', REPO)).toThrow(/Unreleased/);
  });

  it('refuses a version that already exists', () => {
    expect(() => promoteUnreleased(released, '0.1.0', 'd', REPO)).toThrow(/already/);
  });
});

describe('nextVersion', () => {
  it('bumps patch, minor, and major', () => {
    expect(nextVersion('1.2.3', 'patch')).toBe('1.2.4');
    expect(nextVersion('1.2.3', 'minor')).toBe('1.3.0');
    expect(nextVersion('1.2.3', 'major')).toBe('2.0.0');
  });

  it('accepts an explicit version', () => {
    expect(nextVersion('0.0.0', '0.1.0')).toBe('0.1.0');
  });

  it('rejects unknown bumps and unparseable versions', () => {
    expect(() => nextVersion('1.2.3', 'huge')).toThrow(/Unknown bump/);
    expect(() => nextVersion('nope', 'patch')).toThrow(/Cannot parse/);
  });
});

describe('the real CHANGELOG.md', () => {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');

  it('has unreleased entries that a release could promote', () => {
    expect(hasUnreleasedChanges(changelog)).toBe(true);
    expect(() => promoteUnreleased(changelog, '0.1.0', '2026-01-01', REPO)).not.toThrow();
  });
});
