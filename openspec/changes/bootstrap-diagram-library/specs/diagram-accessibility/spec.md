# Spec Delta

## Purpose

Defines the accessibility guarantees every diagram makes, so that a diagram is usable with a keyboard, a screen reader, and low vision.

## ADDED Requirements

### Requirement: Text alternative
Every diagram SHALL have an accessible name and description, and SHALL be able to generate a text outline of its nodes and connections.

#### Scenario: Generated outline
- **WHEN** a diagram has no author-written description
- **THEN** a text outline listing elements and their connections is available to assistive technology

### Requirement: Keyboard operation
All interactive features SHALL be operable by keyboard, with a logical focus order and a visible focus indicator.

#### Scenario: Tab through nodes
- **WHEN** a reader presses Tab inside an interactive diagram
- **THEN** focus moves through nodes in a logical order and the focused node is clearly marked

#### Scenario: Directional navigation
- **WHEN** a node is focused and the reader presses an arrow key
- **THEN** focus moves to the nearest connected node in that direction

### Requirement: Semantic roles
Elements SHALL expose roles and labels so a screen reader announces each node, its connections, and any group it belongs to.

#### Scenario: Announce a node
- **WHEN** a screen reader reaches a node
- **THEN** it announces the node label, its group, and the labels of connected nodes

### Requirement: Contrast and size
Text and meaningful graphics SHALL meet WCAG AA contrast, and interactive targets SHALL be large enough to activate on touch devices.

#### Scenario: Touch target
- **WHEN** a diagram is shown on a touch device
- **THEN** interactive targets meet the minimum target size

### Requirement: Zoom and reflow
Text in diagrams SHALL remain readable when the page is zoomed to 200 percent, and the diagram SHALL offer a way to view it larger without horizontal page scroll.

#### Scenario: Page zoom
- **WHEN** the page is zoomed to 200 percent
- **THEN** no text is clipped and the page has no horizontal scrollbar caused by the diagram

### Requirement: Accessibility testing
The library SHALL run automated accessibility checks on every built-in element type and example in continuous integration.

#### Scenario: Failing check
- **WHEN** a change introduces an accessibility violation in an example
- **THEN** the continuous integration build fails
