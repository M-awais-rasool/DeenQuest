import { DESIGN_WIDTH } from "./worldTheme";

/**
 * Where the nodes sit, and the road that joins them.
 *
 * The mockup places five nodes by hand on an 844 px canvas. Read off their
 * centres, they are a repeating figure: the x values cycle through five
 * positions and every node is exactly 98 px below the last. That regularity
 * is what makes the hand-drawn screen extendable to a path of any length —
 * the sixth node continues the same rhythm rather than needing new artwork.
 *
 * Everything below is expressed in mockup pixels and scaled to the real
 * device by `scaleX`, so a wider phone widens the switchbacks instead of
 * stranding the road against one edge.
 */

/** Node centre x, in mockup pixels, cycling down the path. */
const CYCLE_X = [250, 168, 140, 214, 160];

/**
 * Vertical gap between consecutive node centres.
 *
 * The mockup spaces them 98 apart, but its labels are one short line each.
 * Real level titles wrap to two, and the star tray hangs below the rim, so at
 * 98 a node's tray crowds the next node's ring. 150 restores the mockup's
 * proportions with real content in them.
 */
export const NODE_GAP = 150;

/**
 * Centre of the first node, measured from the top of the path canvas.
 *
 * Far enough below the pinned header that the first level is never sitting in
 * the scrim under it.
 */
export const FIRST_NODE_Y = 72;

/** Diameter by state — the current node is deliberately the largest thing. */
export const NODE_SIZE = { done: 80, current: 92, locked: 78 } as const;

/** The cream ring's thickness, drawn outside the circle. */
export const RING = 6;

/** Extra room after the last node so the road does not stop at the screen edge. */
export const TAIL = 120;

/**
 * How much road is drawn above the first node.
 *
 * Short on purpose. The stroke needs a couple of pixels before node 1 or its
 * round cap lands exactly on the centre and the curve kinks — but anything
 * longer leaves a stub of road hanging above the first level, which reads as
 * the path having started somewhere the learner cannot see.
 *
 * At 10 the cap sits well inside node 1's 46 px radius, so the road appears to
 * begin underneath the first level and run down from there.
 */
export const LEAD_IN = 10;

export function scaleX(width: number) {
  return (x: number) => (x * width) / DESIGN_WIDTH;
}

export interface NodePoint {
  /** Centre, in mockup pixels. */
  x: number;
  y: number;
}

export function nodePoint(index: number): NodePoint {
  return {
    x: CYCLE_X[index % CYCLE_X.length],
    y: FIRST_NODE_Y + index * NODE_GAP,
  };
}

/** Total canvas height needed to lay out `count` nodes. */
export function canvasHeight(count: number): number {
  if (count === 0) return FIRST_NODE_Y + TAIL;
  return FIRST_NODE_Y + (count - 1) * NODE_GAP + TAIL;
}

/**
 * A smooth cubic path through every node centre.
 *
 * Catmull-Rom converted to Bézier: it is the cheapest way to get a curve that
 * actually passes through each point rather than being pulled off them, which
 * matters here because the road has to run under the nodes, not near them.
 * The mockup's hand-authored control points produce the same shape.
 */
export function roadPath(count: number, sx: (x: number) => number): string {
  if (count === 0) return "";

  const pts: NodePoint[] = [];
  // The road begins just above node 1 — visibly, the way the mockup shows it —
  // and runs off past the last node so it never stops in mid-air.
  const first = nodePoint(0);
  const second = count > 1 ? nodePoint(1) : { x: first.x + 40, y: first.y + NODE_GAP };
  // Lead in along the same heading the road leaves node 1 on, so the start
  // reads as one continuous curve rather than a kink.
  pts.push({
    x: first.x - (second.x - first.x) * (LEAD_IN / NODE_GAP),
    y: FIRST_NODE_Y - LEAD_IN,
  });
  for (let i = 0; i < count; i++) pts.push(nodePoint(i));
  pts.push({
    x: CYCLE_X[count % CYCLE_X.length],
    y: FIRST_NODE_Y + count * NODE_GAP,
  });

  let d = `M ${sx(pts[0].x)} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${sx(c1x)} ${c1y}, ${sx(c2x)} ${c2y}, ${sx(p2.x)} ${p2.y}`;
  }
  return d;
}
