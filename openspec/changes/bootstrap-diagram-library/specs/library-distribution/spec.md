# Spec Delta

## Purpose

Defines how the library is packaged, versioned, documented, and maintained as an open source project that others can adopt and contribute to.

## ADDED Requirements

### Requirement: Public open source package
The library SHALL be published as a public package under the MIT license, with a public source repository and no private or personal data in the repository or its history.

#### Scenario: Fresh install
- **WHEN** a developer installs the package from the public registry
- **THEN** it installs and runs without access to any private resource

### Requirement: Modular packaging
The library SHALL be tree-shakeable, ship ES module and CommonJS builds with TypeScript types, and keep optional features such as export and animation in separate entry points.

#### Scenario: Unused feature
- **WHEN** a consumer imports only the static renderer
- **THEN** layout, animation, and export code is absent from their bundle

### Requirement: Semantic versioning
Releases SHALL follow semantic versioning, the public API SHALL be documented, and breaking changes SHALL be announced in a changelog with a migration note.

#### Scenario: Breaking change
- **WHEN** a release removes or changes a public API
- **THEN** the major version increases and the changelog explains how to migrate

### Requirement: Documentation
The project SHALL include a getting-started guide, a reference for every public API and element, and a gallery of runnable examples.

#### Scenario: Example coverage
- **WHEN** a new element type is added
- **THEN** documentation and at least one runnable example are added in the same change

### Requirement: Automated quality gates
Continuous integration SHALL run type checks, lint, unit tests, visual regression tests, accessibility checks, and size budgets on every pull request.

#### Scenario: Visual change
- **WHEN** a change alters the rendered output of an example
- **THEN** the visual regression check fails until the change is reviewed and the baseline updated

### Requirement: Contribution process
The repository SHALL include contribution guidelines, a code of conduct, issue templates, and a spec-driven process in which behavior changes are proposed in OpenSpec before implementation.

#### Scenario: New feature proposal
- **WHEN** a contributor wants to add a feature
- **THEN** the guidelines direct them to propose a spec change first

### Requirement: Dependency discipline
Runtime dependencies SHALL be few, permissively licensed, and justified in the design document, and each SHALL be reviewed for size and maintenance health.

#### Scenario: Adding a dependency
- **WHEN** a change adds a runtime dependency
- **THEN** its license, size impact, and reason are recorded in the change
