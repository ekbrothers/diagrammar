# Spec Delta

## Purpose

Defines how diagrams written in other formats become diagram definitions, and how the conversion reports what it could not carry across, so a reader never believes a lossy import was complete.

## ADDED Requirements

### Requirement: Read Mermaid flowcharts
The library SHALL convert Mermaid flowchart source into a valid diagram definition, supporting the `flowchart` and `graph` keywords, node declarations, edges, and subgraphs.

#### Scenario: Minimal flowchart
- **WHEN** source declaring two nodes and one edge between them is converted
- **THEN** the result is a definition with those two nodes, that edge, and ids matching the Mermaid identifiers

#### Scenario: Unsupported diagram kind
- **WHEN** source whose first keyword names a non-flowchart kind, such as `sequenceDiagram`, is converted
- **THEN** conversion fails with an error naming the kind and stating that only flowcharts are supported

### Requirement: Map Mermaid shapes to node types
Mermaid node shapes SHALL map to the closest built-in node type, and shapes with no close match SHALL become the default type rather than failing.

#### Scenario: Rounded and cylinder shapes
- **WHEN** a flowchart contains a stadium-shaped node and a cylinder-shaped node
- **THEN** the stadium node has type `pill` and the cylinder node has type `database`

#### Scenario: Unmatched shape
- **WHEN** a flowchart contains a shape with no corresponding built-in type
- **THEN** the node is produced with the default type and the shape is recorded as a note

### Requirement: Map Mermaid edges to edge styles
Mermaid link syntax SHALL map to edge style and arrow settings, covering solid, dotted, and thick links, arrowheads at either or both ends, and edge labels.

#### Scenario: Dotted labeled link
- **WHEN** a dotted link carrying a label connects two nodes
- **THEN** the resulting edge has style `dotted`, that label, and an arrow at its end

#### Scenario: Link without an arrowhead
- **WHEN** an open link with no arrowhead connects two nodes
- **THEN** the resulting edge has arrow `none`

### Requirement: Map subgraphs to groups
Mermaid subgraphs SHALL become groups, nested subgraphs SHALL become nested groups, and each node SHALL belong to the innermost subgraph containing it.

#### Scenario: Nested subgraphs
- **WHEN** a subgraph containing another subgraph is converted
- **THEN** the inner group names the outer group as its parent and nodes inside the inner subgraph belong to the inner group

### Requirement: Report what was not converted
Conversion SHALL return a report listing every construct that was dropped or approximated, each with the source line number and a description, and the report SHALL be empty only when the conversion was complete.

#### Scenario: Styling directives are dropped
- **WHEN** source containing `classDef` and `style` directives is converted
- **THEN** the definition omits them and the report names each one with its line number

#### Scenario: Complete conversion
- **WHEN** source using only supported constructs is converted
- **THEN** the report is empty

### Requirement: Imported definitions are valid
A definition produced by conversion SHALL pass validation, including unique identifiers and edges that reference existing nodes.

#### Scenario: Duplicate Mermaid identifiers
- **WHEN** source declares the same identifier twice with different labels
- **THEN** one node is produced, the later label wins, and the result passes validation

#### Scenario: Identifier that is not a valid id
- **WHEN** a Mermaid identifier cannot be used as an identifier unchanged
- **THEN** it is converted to a usable identifier, every edge referring to it is updated, and the change is recorded in the report

### Requirement: Malformed source fails clearly
Source that cannot be parsed SHALL raise an error naming the line number and what was expected, and SHALL NOT produce a partial definition.

#### Scenario: Unclosed subgraph
- **WHEN** source opens a subgraph and never closes it
- **THEN** conversion fails with an error naming the line where the subgraph opened

### Requirement: Import from the command line
The command line SHALL convert a Mermaid file, or Markdown containing Mermaid code fences, into a definition module or JSON file, and SHALL print the report of what was not converted.

#### Scenario: Markdown with a fenced diagram
- **WHEN** a Markdown file containing one Mermaid code fence is imported
- **THEN** the fenced source is converted and written to the output file

#### Scenario: Markdown with several fenced diagrams
- **WHEN** a Markdown file containing more than one Mermaid code fence is imported
- **THEN** the command reports how many were found and converts the one the caller selected
