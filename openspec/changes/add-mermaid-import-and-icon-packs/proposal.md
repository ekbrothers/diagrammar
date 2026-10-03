# Proposal

## Why

Two things keep people from using diagrammar on work they already have.

The first is arrival. Mermaid is the default way diagrams get written in Markdown today, so most teams already have some. Right now the only way to move one into diagrammar is to retype it. A reader who finds the library through its rendering quality has to throw away their existing diagrams to try it, which is a poor trade for an unproven tool. Reading Mermaid turns that into a paste.

The second is vocabulary. The icon set covers generic shapes (server, database, globe) and a handful of brand logos. Real infrastructure diagrams name specific things: a Snowflake warehouse, a Terraform workspace, a GitHub Actions run. Generic icons can be drawn, but the diagram then says less than the words next to it. Vendor icon sets cover the brands, but nothing covers the concepts a tool introduces, such as a Terraform plan or a state file, because those are ideas rather than products.

## What Changes

- Read Mermaid flowchart source into a diagram definition, with a report of anything that could not be represented.
- Add a `diagrammar import mermaid` command and a programmatic `fromMermaid()`.
- Add more bundled brand logos from Simple Icons (CC0), including Snowflake, which the current set lacks.
- Add a bundled set of infrastructure concept icons, drawn for this project, for ideas no vendor publishes a logo for: Terraform workspace, project, module, state file, plan, and apply, plus generic queue, cache, job, schedule, and secret.

**Out of scope for this change:** writing Mermaid out of diagrammar (the lossy direction, deliberately skipped), Mermaid diagram kinds other than flowcharts (sequence, class, state, ER, Gantt), bundling vendor icon sets whose licenses forbid redistribution (AWS, Azure, Google Cloud, which keep the existing download-and-import path), and a visual editor.

## Capabilities

### New Capabilities
- `diagram-interop`: reading other diagram formats into a definition, and reporting what was lost.

### Modified Capabilities
- `diagram-elements`: bundled icon sets gain brand logos and infrastructure concept icons.
