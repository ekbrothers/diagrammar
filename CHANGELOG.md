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
- Release tooling: `npm run release`, a tag-triggered publish workflow, and this changelog.
