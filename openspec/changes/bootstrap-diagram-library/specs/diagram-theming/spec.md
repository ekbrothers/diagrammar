# Spec Delta

## Purpose

Defines how diagrams look and how that look is controlled, so a diagram fits any host site, in light or dark mode, without forking the library.

## ADDED Requirements

### Requirement: Design tokens
Appearance SHALL be controlled by named tokens for color, typography, spacing, stroke, radius, and shadow, and every built-in element SHALL draw only from tokens.

#### Scenario: Change a token
- **WHEN** a consumer overrides the primary color token
- **THEN** every element using that token changes with no other edits

### Requirement: Light and dark modes
Diagrams SHALL support light and dark appearance, following the host page by default, with no flash of the wrong mode on first paint.

#### Scenario: Dark page
- **WHEN** the host page is in dark mode
- **THEN** the diagram renders with its dark palette from the first paint

### Requirement: Built-in themes
The library SHALL ship at least a default theme and a high-contrast theme, and both SHALL meet WCAG AA contrast for text and for meaningful graphics.

#### Scenario: High contrast
- **WHEN** the high-contrast theme is selected
- **THEN** text and edges meet the contrast thresholds against their backgrounds

### Requirement: Custom themes
Consumers SHALL be able to define a theme by supplying token values, and to override tokens for a single diagram or a single element.

#### Scenario: Per-element override
- **WHEN** one node specifies its own fill token
- **THEN** only that node differs from the theme

### Requirement: Semantic styling
Authors SHALL be able to give elements a semantic role such as primary, success, warning, danger, or muted, and themes SHALL map each role to a palette.

#### Scenario: Role maps to color
- **WHEN** a node has the warning role
- **THEN** it uses the active theme's warning palette

### Requirement: Host styling compatibility
Diagram styles SHALL be scoped so they do not affect host page styles, and host CSS variables SHALL be usable as token values.

#### Scenario: No leakage
- **WHEN** a diagram is added to a page
- **THEN** no existing element on the page changes appearance

### Requirement: Color is never the only signal
Information conveyed by color, such as status, SHALL also be conveyed by shape, pattern, label, or icon.

#### Scenario: Status without color
- **WHEN** a diagram is viewed in grayscale
- **THEN** each status remains distinguishable
