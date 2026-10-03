# Spec Delta

## Purpose

Defines the visual building blocks of a diagram, the built-in node and edge types and the way consumers add their own, so diagrams can be rich without custom drawing code.

## ADDED Requirements

### Requirement: Built-in node types
The library SHALL provide node types for a box, a pill, a card with icon, title, and subtitle, a database, an actor, and a custom SVG shape.

#### Scenario: Card node
- **WHEN** a card node is given an icon, a title, and a subtitle
- **THEN** all three are drawn within the node and the node sizes to fit them

### Requirement: Rich node content
A node SHALL be able to contain formatted text and links, not only a plain label.

#### Scenario: Link in a node
- **WHEN** a node contains a hyperlink
- **THEN** the link is clickable and keyboard-focusable and does not trigger pan or drag

### Requirement: Edge styles
Edges SHALL support solid, dashed, and dotted lines, selectable arrowheads at either end, and labels positioned along the edge.

#### Scenario: Labeled edge
- **WHEN** an edge has a label
- **THEN** the label is placed on the edge with a background that keeps it legible over crossing lines

#### Scenario: Bidirectional arrows
- **WHEN** an edge has arrowheads at both ends
- **THEN** both are drawn and aligned with the edge direction at each end

### Requirement: Ports and anchors
Nodes SHALL expose named connection points, and edges SHALL be attachable to a specific point rather than only to the node.

#### Scenario: Attach to a port
- **WHEN** an edge targets the named right-side port of a node
- **THEN** the edge ends at that port

### Requirement: Icons
Nodes SHALL be able to show an icon from a registry, and consumers SHALL be able to register their own icons without modifying the library.

#### Scenario: Register an icon
- **WHEN** a consumer registers a custom icon and references it by name
- **THEN** nodes using that name display the icon

#### Scenario: Missing icon
- **WHEN** a node references an icon name that is not registered
- **THEN** a visible placeholder is drawn and development builds report the name

### Requirement: Custom element types
Consumers SHALL be able to register new node and edge types, and registered types SHALL take part in layout, theming, interaction, and export the same way built-in types do.

#### Scenario: Custom node participates in layout
- **WHEN** a consumer registers a custom node type and uses it in a diagram
- **THEN** layout accounts for its size and edges attach to it

### Requirement: Links
Nodes and edges SHALL be linkable to an external URL or to another element in the same diagram.

#### Scenario: In-diagram link
- **WHEN** a node links to another element in the diagram
- **THEN** activating it moves focus and view to that element
