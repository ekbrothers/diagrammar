# Spec Delta

## Purpose

Defines how a reader explores a diagram: moving around it, inspecting it, expanding it, and walking through it step by step, without taking over the page.

## ADDED Requirements

### Requirement: Pan, zoom, and fit
Interactive diagrams SHALL support pan and zoom by pointer, touch, and keyboard, with bounded zoom, a fit-to-view action, and a reset action.

#### Scenario: Zoom limits
- **WHEN** a reader zooms beyond the configured minimum or maximum
- **THEN** zoom stops at the limit

#### Scenario: Fit to view
- **WHEN** the reader activates fit-to-view
- **THEN** the whole diagram is visible within its container

### Requirement: Page scrolling is never trapped
By default, scrolling the page with the wheel or a one-finger touch drag over a diagram SHALL scroll the page. Zoom by wheel SHALL require a modifier key unless the author opts out.

#### Scenario: Scroll past a diagram on a phone
- **WHEN** a reader drags one finger over a diagram on a touch device
- **THEN** the page scrolls and the diagram does not pan

#### Scenario: Pinch to zoom
- **WHEN** a reader pinches on a diagram on a touch device
- **THEN** the diagram zooms

### Requirement: Path highlighting
Hovering or focusing a node or edge SHALL highlight it and its directly connected elements and visually de-emphasize the rest.

#### Scenario: Hover a node
- **WHEN** a reader hovers a node
- **THEN** the node, its edges, and the nodes at their other ends are emphasized and everything else is dimmed

#### Scenario: Leave
- **WHEN** the pointer or focus leaves
- **THEN** all elements return to normal emphasis

### Requirement: Expand and collapse groups
Groups SHALL be collapsible, and collapsing SHALL hide contents and reroute edges to the group boundary.

#### Scenario: Collapse a group
- **WHEN** a reader collapses a group
- **THEN** its children are hidden, edges that touched them attach to the group, and the layout adjusts

### Requirement: Details on demand
Nodes and edges SHALL be able to show additional detail on hover, focus, or tap, and the detail SHALL be reachable without a pointer.

#### Scenario: Keyboard-triggered detail
- **WHEN** a node with detail receives keyboard focus
- **THEN** its detail is shown and remains until focus moves away

### Requirement: Walkthrough mode
A diagram SHALL support an ordered series of steps, each revealing or emphasizing chosen elements and optionally showing a caption, with next, previous, and restart controls.

#### Scenario: Step forward
- **WHEN** the reader moves to the next step
- **THEN** that step's elements are revealed or emphasized and its caption is shown

#### Scenario: Printed or non-interactive view
- **WHEN** a walkthrough diagram is shown without interaction or printed
- **THEN** all steps' elements are visible

### Requirement: Events
The library SHALL emit events for element selection, activation, hover, and view changes so a host page can respond.

#### Scenario: Selection event
- **WHEN** a reader selects a node
- **THEN** the host receives an event identifying the node by its identifier

### Requirement: Interaction is optional
A diagram with interaction disabled SHALL render as a static figure with no controls and no event listeners that capture input.

#### Scenario: Static diagram
- **WHEN** interaction is disabled
- **THEN** no pan, zoom, or hover behavior is active and no controls are shown
