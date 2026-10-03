## Context

Diagrams on the first consumer site (a Next.js 14 / React 18 / MDX / Tailwind site) are currently hand-drawn or pasted images. Existing tools fall short of the target: Mermaid is text-first with limited visual polish, React Flow is an editor-oriented node canvas that ships a large client bundle, and D2 and Excalidraw are not embeddable as themed, accessible, server-rendered figures. The goal is a polished, read-oriented diagram library that renders to SVG on the server and adds interaction only where wanted.

## Goals / Non-Goals

**Goals**
- Server-rendered, accessible, themeable SVG diagrams with optional interaction and animation.
- A serializable definition that can be authored in JSX, JSON, or an MDX string prop.
- Automatic layout with manual overrides, precomputable at build time.
- A small static path: a page of static diagrams ships no library JavaScript.
- A public MIT package that others can adopt and contribute to.

**Non-Goals**
- A visual editor, real-time collaboration, generating diagrams from source code, or non-SVG renderers (see the proposal).

## Decisions

### Layout engine: ELK via elkjs
Hierarchical layout with groups, ports, and edge routing is the core need. ELK supports nested nodes, ports, and orthogonal routing. Alternatives: dagre (no nested groups or ports, unmaintained), d3-force (organic, not deterministic enough), writing our own (large cost). Cost: elkjs is heavy, so layout runs at build time or in a lazy-loaded worker, never in the static path.

### Rendering: React components emitting SVG, with a framework-free core
The core computes a laid-out scene (plain data); a React binding renders it. This keeps server rendering simple and lets other bindings be added later. Alternative: a string-template renderer only. Rejected because React is the first consumer and gives composition and hydration for free.

### Definition format: versioned, serializable schema validated with Zod
Plain data with stable ids and a schema version enables precomputed layout, diffing, export, and tooling. Zod gives helpful errors and inferred types. Alternative: JSX-only authoring, rejected because it cannot be serialized or validated outside React.

### Interaction: d3-zoom for pan and zoom
Mature gesture handling including touch and wheel. Only the zoom and selection modules are imported, loaded lazily. Alternative: custom gesture code, rejected as a source of bugs on touch devices.

### Precomputed layout
Layout results can be stored with the definition so production pages skip the layout engine. The build tool produces them; runtime layout remains as a fallback for dynamic diagrams.

### Theming through CSS variables and tokens
Tokens map to CSS custom properties so themes switch without re-render and host variables can be referenced. This also makes dark mode free of first-paint flash.

### Package layout
One repository, with entry points for core, static renderer, interactive renderer, export, and animation. Start as a single package with subpath exports; split into a monorepo only if a second binding appears.

### Spec-driven development
Behavior is specified in OpenSpec before implementation; this change is the baseline for all capabilities.

## Risks / Trade-offs

- **elkjs size and speed**: mitigated by precomputed layout and lazy loading; revisit if budgets cannot be met.
- **Scope**: eleven capabilities is a lot. Mitigation: the tasks are ordered so a useful static renderer ships first and interactive, animation, and export features follow.
- **Visual regression flakiness** across platforms: pin the browser and fonts in continuous integration.
- **Accessibility of dense graphs**: generated outlines and keyboard navigation can be awkward for very large diagrams; validate with real screen reader testing.
- **Name and license clashes**: confirm the package name is free on the registry before publishing.

## Migration Plan

New repository, so there is nothing to migrate. The first consumer adopts the package once the static renderer and definition schema reach a tagged pre-release.

## Open Questions

- Final package name and scope on the registry.
- Which icon set to bundle by default, and its license.
- Whether text measurement should use a headless browser at build time or a font-metrics approach.
- Minimum browser support targets.
- Whether to offer a small text DSL in addition to JSX and JSON.
