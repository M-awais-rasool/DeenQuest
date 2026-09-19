import { StyleSheet } from "react-native";
import {
  ACTIVE_NODE_SIZE,
  BLOCK_H,
  CIRCLE_CY,
  CIRCLE_TOUCH,
  ISLAND_H,
  ISLAND_TOP,
  ISLAND_W,
  NODE_SIZE,
  PATH_CYAN,
  PILL_H,
  PILL_TOP,
  ROW_PITCH,
  TROPHY_H,
  TROPHY_TOP,
  TROPHY_W,
} from "./constants";

export const s = StyleSheet.create({
  nodeRow: {
    width: "100%",
    alignItems: "center",
    height: BLOCK_H,
    // The islands are taller than the walk between them, so each one tucks a
    // little under the one above — the same overlap the mockup has.
    marginBottom: ROW_PITCH - BLOCK_H,
  },
  block: {
    width: ISLAND_W,
    height: BLOCK_H,
    alignItems: "center",
  },
  island: {
    position: "absolute",
    top: ISLAND_TOP,
    left: 0,
    width: ISLAND_W,
    height: ISLAND_H,
  },
  islandLocked: {
    // The stretch of path you have not reached is lit less than where you are.
    opacity: 0.82,
  },
  circleHolder: {
    position: "absolute",
    top: CIRCLE_CY - CIRCLE_TOUCH / 2,
  },
  circleTouch: {
    // Sized to the halo rather than to the circle: a child that spills outside
    // its parent is clipped the moment that parent is promoted to its own
    // layer, which is exactly what the entrance and pulse animations do.
    width: CIRCLE_TOUCH,
    height: CIRCLE_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    width: ACTIVE_NODE_SIZE,
    height: ACTIVE_NODE_SIZE,
    borderRadius: ACTIVE_NODE_SIZE / 2,
    shadowColor: PATH_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
  },
  face: {
    // Rounded rather than clipped by the circle: `overflow: "hidden"` on the
    // circle would also cut off the glow it casts.
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  haloLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    borderRadius: 999,
  },
  trophyIsland: {
    position: "absolute",
    top: TROPHY_TOP,
    width: TROPHY_W,
    height: TROPHY_H,
  },
  trophyLocked: {
    opacity: 0.55,
  },
  label: {
    position: "absolute",
    top: PILL_TOP,
    minWidth: ISLAND_W * 0.58,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  labelActive: {
    shadowColor: PATH_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  labelText: {
    fontSize: 14,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 0.2,
  },
  bubble: {
    position: "absolute",
    top: -32,
    alignItems: "center",
  },
  bubbleHigh: {
    // The cup is taller than a circle, so its flag has to clear it.
    top: -48,
  },
  bubbleBody: {
    backgroundColor: PATH_CYAN,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: PATH_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  bubbleText: {
    color: "#04343A",
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: PATH_CYAN,
  },
  connector: StyleSheet.absoluteFillObject,
  dot: {
    position: "absolute",
    backgroundColor: PATH_CYAN,
    shadowColor: PATH_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  progressPill: {
    position: "absolute",
    top: PILL_TOP + PILL_H + 6,
    backgroundColor: "rgba(47, 227, 208, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(47, 227, 208, 0.4)",
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
  },
  progressText: {
    color: PATH_CYAN,
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
  },
});
