# Proposal

## Why

The site's diagrams are hand-built SVG, one component per diagram, with no shared layout, theming, interaction, or accessibility work. Each new diagram repeats that effort and looks slightly different. Existing libraries cover pieces (layout engines, node-graph UIs, text-to-diagram tools) but none produces polished, publication-quality diagrams with a typed definition, good theming, and strong accessibility. This change sets the requirements for a library we maintain ourselves, as a public open-source project.

## What Changes

- Create `diagrammar`, a standalone public library for declarative, SVG-based diagrams.
- Define the diagram definition format (nodes, edges, groups, layers), validation, and versioning.
- Support authoring as JSX components or as plain JSON, including inside MDX.
- Provide automatic layout, manual positioning, nested groups and swimlanes, and edge routing.
- Provide built-in node and edge types and an extension point for custom ones.
- Provide pan/zoom, hover highlighting, expand/collapse, tooltips, and a step-through walkthrough mode.
- Provide animation that respects reduced-motion preferences.
- Provide design-token theming with light/dark support and presets.
- Provide SVG, PNG, and print export, in the browser and at build time.
- Provide accessibility: accessible names, generated text alternatives, keyboard navigation, contrast.
- Provide server rendering, responsive behavior, lazy loading, and a bundle-size budget.
- Define packaging, testing, documentation, licensing, and release expectations for a public library.

**Out of scope for this change:** a visual drag-and-drop editor (planned as a later phase, built on the same definition format), real-time collaboration, auto-generating diagrams from source code, and non-SVG renderers such as canvas or WebGL.

## Capabilities

### New Capabilities
- `diagram-definition`: the serializable data model, validation, versioning, and stable identifiers.
- `diagram-authoring`: JSX, JSON, and MDX ways of producing a definition, with type safety.
- `diagram-layout`: automatic and manual layout, groups, swimlanes, and edge routing.
- `diagram-elements`: built-in and custom node types, edge styles, ports, icons, links.
- `diagram-interaction`: pan/zoom, highlighting, expand/collapse, tooltips, walkthrough mode, events.
- `diagram-animation`: entrance, flow, and transition animation with reduced-motion support.
- `diagram-theming`: tokens, light/dark, presets, and style overrides.
- `diagram-export`: SVG, PNG, and print output, in the browser and at build time.
- `diagram-accessibility`: names, text alternatives, keyboard operation, contrast, touch targets.
- `diagram-rendering`: server rendering, hydration, responsiveness, lazy loading, performance, errors.
- `library-distribution`: packaging, size budget, versioning, docs, tests, and public-repo hygiene.

### Modified Capabilities
<!-- None: this is a new project. -->

## Impact

- New repository with no existing code or consumers. The first consumer is the personal website, whose hand-built platform hierarchy diagram becomes the first acceptance example.
- New runtime dependencies are expected (a layout engine and a validation library); see design.md.
- Public repository: licensing, contribution docs, and the absence of private information are part of the deliverable.
