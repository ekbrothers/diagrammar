## 1. Repository foundation

- [x] 1.1 Add package.json, TypeScript config, build tool, and lint config; verify `npm run build` and `npm run lint` pass on an empty entry point.
- [x] 1.2 Add MIT LICENSE, README, CONTRIBUTING, CODE_OF_CONDUCT, and issue templates; verify each file exists and README links resolve.
- [ ] 1.3 Add continuous integration running type check, lint, and tests; verify a pull request triggers it and a deliberate type error fails it.

## 2. Definition schema

- [x] 2.1 Implement the versioned Zod schema with stable ids, groups, layers, and semantic roles; verify valid and invalid fixtures produce expected results.
- [x] 2.2 Implement validation errors that name the path and the problem; verify error text for duplicate ids, dangling edges, and unknown types.
- [ ] 2.3 Implement schema version handling and migration; verify an older fixture loads and a newer-than-supported fixture is rejected clearly.

## 3. Authoring

- [x] 3.1 Implement the React component API that builds a definition from child elements; verify it matches the equivalent data definition.
- [ ] 3.2 Implement authoring from a data object and from an MDX string prop; verify both render identically to the component form.
- [x] 3.3 Add TypeScript types for all public authoring APIs; verify type tests reject misuse.

## 4. Layout

- [x] 4.1 Integrate elkjs behind a layout interface with content-aware node sizing; verify a fixture graph lays out without overlaps.
- [ ] 4.2 Support manual pinning, nested groups and swimlanes, and edge routing options; verify pinned nodes stay put and groups contain their children.
- [ ] 4.3 Guarantee deterministic output and implement precomputed layout export and import; verify two runs produce identical output and a precomputed diagram skips layout.

## 5. Elements and theming

- [ ] 5.1 Implement built-in node types, rich content, ports, and the icon registry; verify each type with a snapshot and a missing-icon case.
- [x] 5.2 Implement edge styles, arrowheads, and labels; verify rendered output for each style.
- [x] 5.3 Implement custom element registration; verify a custom node takes part in layout and theming.
- [x] 5.4 Implement design tokens, light and dark modes, default and high-contrast themes, and per-element overrides; verify contrast ratios and no first-paint flash.

## 6. Rendering

- [x] 6.1 Implement the static server-rendered path with no client JavaScript; verify the built page contains the full SVG and no library script.
- [ ] 6.2 Implement progressive hydration with no layout shift; verify element positions are unchanged after hydration.
- [ ] 6.3 Implement lazy loading of interactive code and container resize behavior; verify off-screen diagrams load nothing until near the viewport.
- [ ] 6.4 Add size and speed budgets enforced in continuous integration; verify exceeding a budget fails the build.

## 7. Interaction and animation

- [ ] 7.1 Implement pan, zoom, fit, and reset with touch-safe page scrolling; verify one-finger scroll scrolls the page and pinch zooms.
- [ ] 7.2 Implement highlighting, collapsible groups, details on demand, and events; verify each in component tests.
- [ ] 7.3 Implement walkthrough mode including the all-steps print view; verify step order and print output.
- [ ] 7.4 Implement entrance, flow, and transition animation with reduced-motion support; verify nothing animates when the preference is set.
- [ ] 7.5 Test large diagrams; verify a 500-node diagram stays interactive within the performance budget.

## 8. Accessibility

- [ ] 8.1 Implement accessible names, generated text outlines, and semantic roles; verify with a screen reader pass on a sample diagram.
- [ ] 8.2 Implement keyboard operation with tab order and arrow navigation; verify through keyboard-only tests.
- [ ] 8.3 Add automated accessibility checks for every element type and example in continuous integration; verify a seeded violation fails the build.

## 9. Export

- [ ] 9.1 Implement standalone SVG export with inlined styles and font handling; verify the exported file renders correctly outside the page.
- [ ] 9.2 Implement PNG export with scale and background options, and export theme selection; verify dimensions and palette.
- [ ] 9.3 Implement Node.js programmatic export without a DOM and print styles; verify a build script produces valid SVG and a printed page fits.

## 10. Tests

- [ ] 10.1 Add unit tests for schema, layout, and element logic; verify coverage targets are met.
- [ ] 10.2 Add visual regression tests with pinned browser and fonts; verify baselines are stable across repeated runs.

## 11. Documentation and release

- [ ] 11.1 Write the getting-started guide and API reference; verify every public export is documented.
- [ ] 11.2 Build the example gallery with runnable examples for every element type; verify each example renders in continuous integration.
- [ ] 11.3 Set up semantic versioning, changelog, and the publish workflow; verify a dry-run publish succeeds and the package name is available.
- [ ] 11.4 Tag a pre-release and integrate it into the first consumer site; verify a diagram renders there with server-rendered output.
