# Spec Delta

## Purpose

Defines the serializable data model that describes a diagram, how it is validated, and how it evolves over time, so every other capability works from one agreed description.

## ADDED Requirements

### Requirement: Serializable diagram definition
A diagram SHALL be described by a plain, serializable definition containing nodes, edges, groups, and layers. The definition SHALL contain no functions or class instances.

#### Scenario: JSON round trip
- **WHEN** a valid definition is serialized to JSON and parsed back
- **THEN** the parsed result is equal to the original and renders identically

#### Scenario: Minimal definition
- **WHEN** a definition contains only two nodes and one edge between them
- **THEN** it is valid and renders without any other configuration

### Requirement: Stable element identifiers
Every node, edge, group, and layer SHALL have an identifier that is unique within the diagram and is preserved across renders.

#### Scenario: Duplicate identifier
- **WHEN** two nodes in one definition share an identifier
- **THEN** validation fails and names both offending elements

#### Scenario: Identifier survives an update
- **WHEN** a definition is updated to change one label while keeping the node identifier
- **THEN** that node is treated as the same element, so highlighting, focus, and animation continue on it

### Requirement: Definition validation
The library SHALL validate a definition before rendering and report each error with the path to the offending field and a human-readable message.

#### Scenario: Dangling edge endpoint
- **WHEN** an edge references a node identifier that does not exist
- **THEN** validation reports the edge identifier, the missing endpoint, and the field path

#### Scenario: Multiple errors
- **WHEN** a definition has several problems
- **THEN** all of them are reported together rather than only the first

### Requirement: Versioned definition format
The definition SHALL carry a schema version. The library SHALL render definitions of its supported versions and reject unsupported ones with a clear error.

#### Scenario: Newer major version
- **WHEN** a definition declares a major version newer than the library supports
- **THEN** the library refuses to render it and reports which versions it supports

#### Scenario: Missing version
- **WHEN** a definition omits the schema version
- **THEN** the library treats it as the current version

### Requirement: Layers and ordering
Elements SHALL be assignable to named layers, and layers SHALL control drawing order and be individually showable or hideable.

#### Scenario: Hide a layer
- **WHEN** a layer is hidden
- **THEN** its elements are not drawn, edges that touch them are not drawn, and layout of the remaining elements is unchanged unless the author opts into re-layout
