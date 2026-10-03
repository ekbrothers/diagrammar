# Spec Delta

## Purpose

Defines how nodes, groups, and edges are positioned and routed automatically or by hand, so diagrams look deliberate without manual coordinates for every element.

## ADDED Requirements

### Requirement: Automatic layout
The library SHALL position nodes automatically using a selectable strategy, including at least layered (flow), tree, and radial.

#### Scenario: Layered layout
- **WHEN** a directed graph is laid out with the layered strategy
- **THEN** edges flow consistently in one direction and no two nodes overlap

#### Scenario: Choose direction
- **WHEN** the author sets the flow direction to left-to-right or top-to-bottom
- **THEN** the layout follows that direction

### Requirement: Manual positioning
The author SHALL be able to pin any node to explicit coordinates, and automatic layout SHALL arrange the remaining nodes around the pinned ones.

#### Scenario: Pinned node stays put
- **WHEN** one node is pinned at given coordinates and layout runs
- **THEN** that node is drawn at exactly those coordinates

#### Scenario: Fully manual diagram
- **WHEN** every node is pinned
- **THEN** no automatic layout runs and the diagram renders as specified

### Requirement: Nested groups and swimlanes
Groups SHALL contain nodes and other groups to at least three levels, size themselves to fit their contents, and support a swimlane arrangement with labeled lanes.

#### Scenario: Group sizes to contents
- **WHEN** a node is added to a group
- **THEN** the group grows to contain it with consistent padding and no overlap with siblings

#### Scenario: Edge crosses lanes
- **WHEN** an edge connects nodes in different swimlanes
- **THEN** it is routed across the lane boundary and remains attached to both nodes

### Requirement: Edge routing
Edges SHALL support straight, orthogonal, and curved routing, and the router SHALL avoid passing through unrelated nodes where the chosen strategy allows.

#### Scenario: Orthogonal routing around a node
- **WHEN** an orthogonal edge's direct path crosses an unrelated node
- **THEN** the edge bends around that node

#### Scenario: Parallel edges
- **WHEN** two edges connect the same pair of nodes
- **THEN** they are drawn separately and neither hides the other

### Requirement: Content-aware sizing
Nodes SHALL size to their content. Labels SHALL wrap at a configurable maximum width and SHALL never be clipped.

#### Scenario: Long label wraps
- **WHEN** a label exceeds the maximum node width
- **THEN** it wraps onto additional lines and the node grows to fit

### Requirement: Deterministic layout
Laying out the same definition with the same options SHALL produce the same coordinates every time, on the server and in the browser.

#### Scenario: Repeat layout
- **WHEN** a definition is laid out twice
- **THEN** all node and edge coordinates are identical

### Requirement: Precomputable layout
Layout results SHALL be serializable, and a diagram SHALL be renderable from a precomputed layout without running a layout engine on the client.

#### Scenario: Build-time layout
- **WHEN** layout is computed during a build and the result is supplied to the renderer
- **THEN** the diagram renders with no layout engine loaded in the browser
