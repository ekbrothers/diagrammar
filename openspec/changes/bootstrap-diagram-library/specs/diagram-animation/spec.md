# Spec Delta

## Purpose

Defines motion in diagrams: how elements appear, how flow is shown, and how changes are animated, while keeping motion optional and safe.

## ADDED Requirements

### Requirement: Entrance animation
Diagrams SHALL optionally animate elements into view, and the final state SHALL be identical to the non-animated rendering.

#### Scenario: Animated entrance
- **WHEN** entrance animation is enabled and the diagram scrolls into view
- **THEN** elements animate in and end in exactly their laid-out positions

### Requirement: Flow animation
Edges SHALL optionally show direction of flow with animated dashes or markers.

#### Scenario: Animated edge
- **WHEN** an edge has flow animation enabled
- **THEN** motion travels from source to target

### Requirement: Animated transitions
When a diagram changes by collapsing a group, changing step, or updating its definition, elements that persist SHALL transition from old to new positions instead of jumping.

#### Scenario: Collapse transition
- **WHEN** a group is collapsed
- **THEN** remaining elements move smoothly to their new positions

### Requirement: Reduced motion
When the reader requests reduced motion at the system level, the library SHALL disable non-essential animation and show final states immediately.

#### Scenario: Reduced motion on
- **WHEN** the system reduced-motion preference is set
- **THEN** no entrance or flow animation plays and state changes apply instantly

### Requirement: Animation never gates content
The diagram SHALL be fully readable before and without any animation running, including with scripts disabled.

#### Scenario: Server-rendered view
- **WHEN** the diagram is shown before client scripts run
- **THEN** all elements are visible in their final positions

### Requirement: Animation control
Authors SHALL be able to turn animation off globally or per diagram, and to set its duration.

#### Scenario: Disable globally
- **WHEN** animation is disabled in the global configuration
- **THEN** no diagram animates unless it explicitly opts back in
