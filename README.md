# diagrammar

Polished, accessible, server-rendered SVG diagrams for the web.

Status: specification stage. Nothing is implemented yet. The behavior the library must have is written down as requirements in [openspec/changes/bootstrap-diagram-library](openspec/changes/bootstrap-diagram-library).

## Goals

- Rich diagrams: groups, swimlanes, ports, icons, labeled edges, custom element types.
- Server-rendered SVG, so content is visible and indexable without client scripts.
- A static path that ships no JavaScript, with interaction and animation loaded only where wanted.
- Automatic layout (ELK) with manual overrides, precomputable at build time.
- Theming with design tokens, light and dark modes, and accessibility built in.
- Export to SVG and PNG, and clean printing.

## How this project is developed

Behavior is specified with [OpenSpec](https://github.com/Fission-AI/OpenSpec) before it's implemented.

- `openspec/specs/` holds the current requirements.
- `openspec/changes/` holds proposed changes: a proposal, a design, delta specs, and a task list.

To propose a change, add one under `openspec/changes/`, then run `npx @fission-ai/openspec validate <change-name>`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
