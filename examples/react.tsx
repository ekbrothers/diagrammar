import { Diagram, Edge, Group, Node, definitionFromElement } from '../src/react/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

export const diagram = definitionFromElement(
  <Diagram title="Web application">
    <Node id="reader" type="actor" label="Reader" />
    <Group id="edge" label="Edge">
      <Node id="cdn" type="pill" label="CDN" icon="cloud" />
    </Group>
    <Group id="backend" label="Backend">
      <Node id="app" type="card" label="App server" subtitle="Next.js" icon="server" role="primary" />
      <Node id="db" type="database" label="Postgres" />
    </Group>
    <Edge from="reader" to="cdn" label="HTTPS" />
    <Edge from="cdn" to="app" />
    <Edge from="app" to="db" label="SQL" arrow="both" />
  </Diagram>,
);

export const options: RenderDiagramOptions = { layout: { direction: 'right' } };
