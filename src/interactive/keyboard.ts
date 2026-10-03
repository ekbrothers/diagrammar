/**
 * Keyboard navigation over the nodes of a rendered diagram.
 *
 * Tab enters and leaves the diagram rather than stepping through every node, because a diagram
 * with fifty nodes would otherwise trap a keyboard user in fifty stops. Inside, arrow keys move
 * between connected nodes in the direction pressed, which follows the diagram's meaning rather
 * than its document order, and Home and End jump to the first and last node.
 */

export interface NodeBox {
  id: string;
  element: SVGElement;
  x: number;
  y: number;
}

function centre(element: SVGElement): { x: number; y: number } {
  const box = (element as SVGGraphicsElement).getBBox?.();
  if (box && (box.width > 0 || box.height > 0)) return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  return { x: 0, y: 0 };
}

export function collectNodes(svg: SVGSVGElement): NodeBox[] {
  const out: NodeBox[] = [];
  for (const element of svg.querySelectorAll<SVGElement>('.node')) {
    const id = element.getAttribute('data-id');
    if (id === null) continue;
    out.push({ id, element, ...centre(element) });
  }
  return out;
}

export function collectEdges(svg: SVGSVGElement): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  for (const element of svg.querySelectorAll('.edge')) {
    const from = element.getAttribute('data-from');
    const to = element.getAttribute('data-to');
    if (from !== null && to !== null) out.push({ from, to });
  }
  return out;
}

const DIRECTIONS = {
  ArrowRight: { dx: 1, dy: 0 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowUp: { dx: 0, dy: -1 },
} as const;

type ArrowKey = keyof typeof DIRECTIONS;

export const isArrowKey = (key: string): key is ArrowKey => key in DIRECTIONS;

/**
 * Picks the neighbour best matching a direction.
 *
 * Connected nodes are preferred, so navigation follows the diagram. Candidates more than 45
 * degrees off the direction are skipped, and the nearest of the rest wins.
 */
export function nextNode(from: NodeBox, key: ArrowKey, nodes: NodeBox[], edges: { from: string; to: string }[]): NodeBox | null {
  const { dx, dy } = DIRECTIONS[key];
  const connected = new Set<string>();
  for (const edge of edges) {
    if (edge.from === from.id) connected.add(edge.to);
    if (edge.to === from.id) connected.add(edge.from);
  }

  let best: { node: NodeBox; score: number; linked: boolean } | null = null;
  for (const node of nodes) {
    if (node.id === from.id) continue;
    const vx = node.x - from.x;
    const vy = node.y - from.y;
    const along = vx * dx + vy * dy;
    if (along <= 0) continue; // behind us
    const across = Math.abs(vx * dy - vy * dx);
    if (across > along) continue; // more than 45 degrees off
    const distance = Math.hypot(vx, vy);
    const linked = connected.has(node.id);
    if (best === null || (linked && !best.linked) || (linked === best.linked && distance < best.score)) {
      best = { node, score: distance, linked };
    }
  }
  return best?.node ?? null;
}
