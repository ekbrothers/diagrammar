# Spec Delta

## Purpose

Defines how a diagram leaves the page: as standalone files, as images, and in print, so it can be reused in documents and slides.

## ADDED Requirements

### Requirement: SVG export
A diagram SHALL be exportable as a standalone SVG file that renders the same outside the host page, with styles inlined and no external dependencies.

#### Scenario: Open exported SVG
- **WHEN** an exported SVG is opened directly in a browser
- **THEN** it looks like the on-page diagram in the exported theme

### Requirement: PNG export
A diagram SHALL be exportable as a PNG at a chosen scale, with an optional transparent background.

#### Scenario: High-resolution PNG
- **WHEN** a consumer exports at 2x scale
- **THEN** the image has twice the pixel dimensions of the diagram

### Requirement: Export theme
Export SHALL allow choosing light, dark, or the current theme independent of the page.

#### Scenario: Light export from a dark page
- **WHEN** a diagram on a dark page is exported with the light theme
- **THEN** the file uses the light palette

### Requirement: Print rendering
Diagrams SHALL print legibly: no interactive controls, all walkthrough steps visible, and fitted to the page width without clipping.

#### Scenario: Print a wide diagram
- **WHEN** a page with a wide diagram is printed
- **THEN** the diagram is scaled to fit the page width with text still legible

### Requirement: Fonts in exports
Exported files SHALL render text correctly when the viewer lacks the diagram fonts, by embedding or converting text as configured.

#### Scenario: Missing font
- **WHEN** an exported SVG is opened on a system without the diagram font
- **THEN** text keeps its layout and does not overflow its node

### Requirement: Programmatic export
Export SHALL be available from code, including in a Node.js build step, without a browser UI.

#### Scenario: Build-time export
- **WHEN** a build script exports a diagram definition to SVG
- **THEN** a valid SVG string is produced without a DOM
