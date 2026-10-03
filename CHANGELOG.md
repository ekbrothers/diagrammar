# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the version is below 1.0.0, minor releases may contain breaking changes.

## [Unreleased]

### Added

- Diagram definition schema with stable ids, groups, layers, and semantic roles, validated with a report of every problem and its field path.
- Schema versioning. Definitions without a version are treated as the current one, and unsupported versions are rejected with a clear message.
- Data and JSON authoring: `defineDiagram` for type-checked definitions and `loadDiagram` for objects, JSON, and the single-string form used in MDX.
- React authoring components (`Diagram`, `Node`, `Edge`, `Group`, `Layer`) and `definitionFromElement`, exported from `diagrammar/react`.
- Automatic layout through ELK, exported from `diagrammar/layout`: layered, tree, and radial strategies, four flow directions, nested groups, pinned nodes, label wrapping, edge labels, parallel edge separation, and hidden layers.
- Serializable, validated layouts so layout can run at build time.
- Static SVG rendering, exported from `diagrammar/render`: `renderSvg` turns a diagram and its layout into one self-contained, deterministic SVG string with no client script. `renderDiagram` in `diagrammar/server` validates, lays out, and renders in one call. The React `DiagramView` component draws the same markup, so it is complete in server-rendered HTML.
- Built-in node types (box, pill, card, database, actor, shape), edge styles, arrowheads at either or both ends, labels on a background box, and status badges so color is never the only signal.
- Icons: ten built in, `registerIcon` for your own, and a visible placeholder plus a development warning for names that are not registered.
- Custom node types through the `nodeTypes` render option.
- Theming with design tokens, light and dark appearances that follow the host page with no flash, default and high-contrast themes checked against WCAG contrast ratios, token overrides per diagram, per-node `colors`, and host CSS variables as token values. Styles are scoped to each diagram.
- Release tooling: `npm run release`, a tag-triggered publish workflow, and this changelog.
