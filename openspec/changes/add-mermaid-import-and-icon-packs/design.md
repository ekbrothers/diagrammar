# Design

## Mermaid parsing

Mermaid's own parser is a Jison grammar inside the `mermaid` package, which pulls in a browser-oriented dependency tree and expects a DOM. Depending on it to read text would undo the library's no-DOM promise and add weight to a feature most consumers never call. Flowchart syntax is small and regular, so this change hand-writes a line-based parser for the flowchart subset in `src/interop/mermaid.ts`, with no new runtime dependency.

The parser is deliberately narrow. It reads `flowchart` and `graph` headers with an optional direction, node declarations with the bracket shapes, links in their solid, dotted, and thick forms, `subgraph`/`end` blocks, and comments. Anything else becomes a report entry rather than an error, because a diagram that mostly converts is more useful than a refusal. The exceptions are a non-flowchart diagram kind and structurally broken source, such as an unclosed subgraph, which fail loudly since no sensible partial result exists.

Mermaid direction keywords map onto layout options rather than the definition, since direction is a layout concern here: `LR` and `RL` to `right` and `left`, `TB`, `TD`, and `BT` to `down` and `up`. `fromMermaid()` therefore returns the definition, the suggested layout options, and the report.

### The report

`fromMermaid()` returns `{ diagram, layout, report }` where `report` is an array of `{ line, construct, detail }`. Returning it rather than logging keeps the function usable in a build step, and keeps the decision about how loudly to complain with the caller. The command line prints it. An empty array means nothing was lost, which is the only way a caller can trust the conversion was complete.

Identifiers are kept as written when they are usable, because stable ids make the output diffable against the Mermaid source. When one has to change, every edge referring to it is rewritten and the change is reported, so a reader can follow what happened.

## Icons

Brand logos keep coming from Simple Icons through the existing `scripts/logos.ts` generator, which already handles the near-black and near-white cases by falling back to the text color. This change extends the list. Simple Icons has removed several marks at the trademark holder's request, AWS, Azure, and Slack among them, so the generator continues to fail loudly on a missing slug rather than skipping it, and those vendors keep the download-and-import path.

Concept icons are different in kind. A Terraform workspace, a plan, and a state file are ideas rather than products, so no icon set publishes them and no license question arises. They are drawn by hand as single-path outline icons on the same 24-unit grid as the built-in set, live in `src/icons/concepts.ts`, and follow the text color. Naming them after the idea rather than the vendor (`workspace`, `plan`, `state-file`) keeps them usable outside Terraform and avoids implying endorsement.

## Alternatives considered

Generating Mermaid output as well was considered and rejected for now. Mermaid cannot express nested groups beyond one level, icons, roles, or pinned positions, so the output would quietly drop most of what makes a diagrammar diagram worth keeping. Reading is the direction that gains users; writing is the direction that loses information.

Bundling the vendor cloud icon sets was reconsidered and again rejected. Their terms do not permit redistribution, and the existing `diagrammar icons import` command already covers the case for anyone who has downloaded them.
