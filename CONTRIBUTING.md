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
