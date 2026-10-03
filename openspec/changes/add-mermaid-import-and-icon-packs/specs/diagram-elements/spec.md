# Spec Delta

## ADDED Requirements

### Requirement: Bundled infrastructure concept icons
The library SHALL bundle a set of icons for infrastructure concepts that no vendor publishes a logo for, drawn for this project and licensed with it, covering at least a workspace, a project, a module, a state file, a plan, an apply, a queue, a cache, a scheduled job, and a secret.

#### Scenario: Use a concept icon
- **WHEN** a node names a bundled concept icon
- **THEN** the icon is drawn and follows the text color like other outline icons

#### Scenario: Concept icons are not brand marks
- **WHEN** the bundled concept icons are inspected
- **THEN** none reproduces a vendor logo or trademark

### Requirement: Redistribution is limited to permissive artwork
Bundled icons SHALL be limited to artwork whose license permits redistribution, and icon sets whose licenses do not permit it SHALL remain available only through the import command.

#### Scenario: A set that cannot be redistributed
- **WHEN** a consumer wants vendor icons whose license forbids redistribution
- **THEN** the library does not bundle them and the documentation directs the consumer to download the set and import it

#### Scenario: Attribution is recorded
- **WHEN** bundled brand logos are shipped
- **THEN** the source, its license, and a trademark notice are stated in the generated file and the documentation
