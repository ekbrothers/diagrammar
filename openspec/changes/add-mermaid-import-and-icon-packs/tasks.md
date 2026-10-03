## 1. Mermaid reading

- [ ] 1.1 Implement the flowchart tokenizer and parser for headers, node declarations, links, and subgraphs; verify fixtures covering each shape and link form parse, and that a `sequenceDiagram` header and an unclosed subgraph each fail with the line number.
- [ ] 1.2 Implement the mapping to nodes, edges, groups, and layout direction; verify stadium becomes `pill`, cylinder becomes `database`, dotted links become `dotted`, open links become arrow `none`, and nested subgraphs become nested groups.
- [ ] 1.3 Implement the loss report and identifier handling; verify `classDef` and `style` are reported with line numbers, a duplicate identifier keeps the later label, a renamed identifier updates its edges and is reported, and a fully supported fixture reports nothing.
- [ ] 1.4 Guarantee every conversion result passes validation; verify by running `validateDiagram` over every parser fixture.

## 2. Command line

- [ ] 2.1 Add `diagrammar import mermaid <file>` writing a module or JSON, printing the report; verify a `.mmd` file and a Markdown file with one fence both convert, and that the report prints.
- [ ] 2.2 Handle Markdown with several fenced diagrams; verify the command reports the count and converts the selected one.

## 3. Icons

- [ ] 3.1 Extend the bundled brand logos, including Snowflake; verify the generator fails on an unknown slug and that the generated file is committed and current.
- [ ] 3.2 Draw and bundle the infrastructure concept icons (workspace, project, module, state file, plan, apply, queue, cache, job, schedule, secret); verify each renders, follows the text color, and reproduces no vendor mark.

## 4. Documentation

- [ ] 4.1 Document Mermaid import in the README with its limits and the loss report; verify the example converts as written.
- [ ] 4.2 Add an example using concept and brand icons to the gallery; verify `npm run examples` regenerates it and the committed output is current.
