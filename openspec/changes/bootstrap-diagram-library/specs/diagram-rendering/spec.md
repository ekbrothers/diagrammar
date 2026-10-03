# Spec Delta

## Purpose

Defines how diagrams are drawn into pages: server and client rendering, performance, and the size cost of using the library.

## ADDED Requirements

### Requirement: Server-side rendering
Diagrams SHALL render to complete SVG markup on the server, so the content is visible and indexable before any client script runs.

#### Scenario: View source
- **WHEN** a page with a diagram is fetched without running scripts
- **THEN** the response contains the full SVG with every node and edge

### Requirement: Progressive enhancement
Interactivity SHALL load after the static render, and the static render SHALL not shift when interactivity attaches.

#### Scenario: Hydration
- **WHEN** interactive behavior attaches to a server-rendered diagram
- **THEN** no element moves and the layout does not shift

### Requirement: Static-only entry point
The library SHALL offer an entry point that renders static diagrams with no client JavaScript from the library.

#### Scenario: Static page
- **WHEN** a page uses only the static entry point
- **THEN** the page ships no library JavaScript to the browser

### Requirement: Lazy interactivity
Interactive code, including layout and zoom engines, SHALL load only for diagrams that need it and only when they approach the viewport.

#### Scenario: Off-screen diagram
- **WHEN** an interactive diagram is far below the fold
- **THEN** its interactive code is not downloaded until the reader nears it

### Requirement: Performance budget
The library SHALL define size and speed budgets, and continuous integration SHALL fail when a change exceeds them.

#### Scenario: Budget exceeded
- **WHEN** a change grows the static entry point beyond its budget
- **THEN** the continuous integration build fails with the measured size

### Requirement: Large diagrams
Diagrams of several hundred nodes SHALL stay interactive, using techniques such as culling off-screen elements or simplifying distant detail.

#### Scenario: 500-node diagram
- **WHEN** a diagram with 500 nodes is panned and zoomed
- **THEN** interaction remains smooth on a mid-range device

### Requirement: Framework support
The primary integration SHALL be React, and the core SHALL be framework-independent so other bindings can be added.

#### Scenario: Core without React
- **WHEN** a consumer imports the core package
- **THEN** it works without React installed

### Requirement: Resize behavior
Diagrams SHALL adapt to their container width, preserving aspect ratio and legibility.

#### Scenario: Narrow container
- **WHEN** the container shrinks below the diagram natural width
- **THEN** the diagram scales to fit, or offers pan and zoom if text would become illegible
