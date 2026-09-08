import { StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";
import { NODE_SIZE, NODE_DEPTH } from "./constants";

export const s = StyleSheet.create({
  scrollContent: {
    backgroundColor: theme.colors.background,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  backBtnText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
  },
  phaseHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phaseTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.3,
  },
  phaseSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: { alignItems: "center" },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: "Nunito_900Black",
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.outline,
  },
  summaryBar: {
    height: 6,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  summaryBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  nodeRow: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
  },
  nodeWrapper: {
    alignItems: "center",
    width: NODE_SIZE + 100,
  },
  touchableArea: {
    // Sized to the widest layer inside it, not to the node face. The glow
    // (NODE_SIZE + 20) and the progress ring (NODE_SIZE + 12) are both larger
    // than the face, and a child that spills outside its parent gets clipped
    // on Android the moment that parent is promoted to its own layer — which
    // is exactly what the appear and pulse animations do. Clipping a circle to
    // a smaller box leaves straight edges, so the glow rendered as a rectangle
    // on some nodes and a circle on others, with nothing in the styles to
    // explain it. Leave the extra room and nothing is ever cut.
    width: NODE_SIZE + 20,
    height: NODE_SIZE + NODE_DEPTH + 20,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeBase: {
    position: "absolute",
    width: NODE_SIZE + 20,
    height: NODE_SIZE + 20,
    borderRadius: (NODE_SIZE + 20) / 2,
  },
  nodeBottom: {
    position: "absolute",
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    // The face is centred in a container that grew by 20, so it now sits 10
    // lower; the depth face follows it to keep the same overlap.
    top: NODE_DEPTH + 10,
  },
  progressArcContainer: {
    position: "absolute",
    width: NODE_SIZE + 12,
    height: NODE_SIZE + 12,
    borderRadius: (NODE_SIZE + 12) / 2,
    // No `overflow: "hidden"`. The ring inside is exactly this size, so there
    // is nothing to clip — and on Android a rounded box that clips its
    // children falls back to clipping against the bounding rectangle, which
    // painted the ring's fill as a hard-edged square behind the node. It only
    // showed on levels that were part-finished, which is the one state that
    // draws this ring, so it looked random.
  },
  progressArc: {
    position: "absolute",
    width: NODE_SIZE + 12,
    height: NODE_SIZE + 12,
    borderRadius: (NODE_SIZE + 12) / 2,
    borderWidth: 5,
    borderColor: "transparent",
    borderTopColor: theme.colors.secondary,
    borderRightColor: theme.colors.secondary,
    transform: [{ rotate: "-45deg" }],
  },
  nodeTop: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  nodeLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    marginTop: 8,
    textAlign: "center",
    maxWidth: NODE_SIZE + 60,
  },
  nodeLabelLocked: {
    color: theme.colors.textMuted,
    opacity: 0.5,
  },
  progressPill: {
    backgroundColor: theme.colors.primary18,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 5,
  },
  progressText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
  },
  treasureBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: theme.colors.secondary20,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary35,
  },
});
