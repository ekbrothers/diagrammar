# Contributing

Thanks for helping out.

## Propose behavior changes first

New features and behavior changes start as an OpenSpec change, not a pull request with code.

1. Create a folder under `openspec/changes/<short-name>/` with `proposal.md`, `design.md` (if the decision isn't obvious), `tasks.md`, and delta specs under `specs/<capability>/spec.md`.
2. Run `npx @fission-ai/openspec validate <short-name>` and fix any errors.
3. Open a pull request with the change for discussion.
4. Implement it once the change is accepted.

Bug fixes that restore documented behavior can skip this step.

## Rules

- Requirements describe behavior, not implementation, and use SHALL or MUST.
- Every requirement has at least one scenario.
- Don't commit private or personal data. This is a public repository.
- A new element type ships with docs and a runnable example in the same change.
- A new runtime dependency needs its license, size impact, and reason recorded in the change.

## Conduct

Be kind and assume good intent.

## Releasing

Maintainers cut releases from `main`. Add each user-visible change to the `Unreleased` section of `CHANGELOG.md` as you go.

1. Run `npm run release -- patch` (or `minor`, `major`, or an explicit `x.y.z`). It checks the tree is clean, runs the full check, dates the changelog, bumps the version, and creates the commit and the `vX.Y.Z` tag. It never pushes.
2. Push with `git push origin main --follow-tags`.
3. The Release workflow confirms the tag matches `package.json`, reruns the checks, publishes to npm with provenance, and creates the GitHub release from the changelog.

The workflow needs an `NPM_TOKEN` repository secret (an npm automation token). Releases use Node 22.18+ or 24 locally, because the scripts run TypeScript directly.
