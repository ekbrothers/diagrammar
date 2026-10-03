# Spec Delta

## Purpose

Defines the ways an author can produce a diagram definition, in code or in content, and the type safety that guards them.

## ADDED Requirements

### Requirement: Component authoring
The library SHALL let authors describe a diagram with composable components, and the result SHALL be equivalent to the plain definition for the same diagram.

#### Scenario: Component and data forms match
- **WHEN** the same diagram is written once with components and once as a plain definition
- **THEN** both render identical output

### Requirement: Data authoring
The library SHALL render a diagram directly from a plain definition object or JSON, without requiring component syntax.

#### Scenario: Render from JSON
- **WHEN** a JSON definition is loaded from a file or database
- **THEN** it renders as a diagram with no additional code per diagram

### Requirement: Content embedding
A diagram SHALL be embeddable in MDX and other content systems through a single property that is a plain string, so it survives server-to-client serialization boundaries that reject expressions and objects.

#### Scenario: Embed in MDX
- **WHEN** an MDX document includes a diagram whose definition is passed as one string property
- **THEN** it renders on the server and on the client without serialization errors

### Requirement: Typed authoring
The library SHALL ship TypeScript types for definitions and components, and invalid usage SHALL be a compile-time error where the type system can express it.

#### Scenario: Wrong node type
- **WHEN** an author sets a node type that the library does not define and no custom type is registered
- **THEN** the TypeScript compiler reports an error at the usage site

### Requirement: Helpful authoring errors
When an authoring mistake cannot be caught at compile time, the library SHALL report it at render time in development with the element identifier and a suggested fix.

#### Scenario: Unknown theme preset
- **WHEN** a diagram references a theme preset that does not exist
- **THEN** development builds show an error naming the preset and listing the available ones
