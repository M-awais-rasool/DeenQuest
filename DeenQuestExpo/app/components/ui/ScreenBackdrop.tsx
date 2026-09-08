import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { theme } from "../../theme/themes";

/**
 * A quiet decorative ground for a screen.
 *
 * Three layers, none of which the reader should consciously notice:
 *
 *   1. A khatim lattice — the eight-pointed star the app icon is built from,
 *      tiled and stroked at a few percent opacity. It gives the dark ground a
 *      texture rather than a pattern; at this weight you read it as depth.
 *   2. Two wide glows, teal from the top and gold from the bottom, so the
 *      screen is lit rather than flat, and lit in the app's own two colours.
 *   3. A handful of faint points, placed by hand rather than at random so the
 *      composition is the same every render and never drifts.
 *
 * It occupies no layout and takes no touches: absolutely positioned behind
 * everything, `pointerEvents="none"`. Nothing above it needs to change, and
 * removing it changes nothing but the ground.
 */

const TILE = 116;
const STAR = theme.colors.primary;
const GLOW_WARM = theme.colors.secondary;

/** Points of light. Fixed positions — a random field would move every render. */
const SPARKS: { x: string; y: string; r: number; o: number }[] = [
  { x: "16%", y: "12%", r: 1.6, o: 0.5 },
  { x: "82%", y: "9%", r: 1.1, o: 0.35 },
  { x: "68%", y: "27%", r: 1.9, o: 0.4 },
  { x: "9%", y: "44%", r: 1.2, o: 0.3 },
  { x: "91%", y: "58%", r: 1.5, o: 0.35 },
  { x: "28%", y: "72%", r: 1.1, o: 0.28 },
  { x: "74%", y: "86%", r: 1.7, o: 0.32 },
];

/** The extra scatter the night sky gets, on top of SPARKS. */
const STARS: { x: string; y: string; r: number; o: number }[] = [
  { x: "24%", y: "6%", r: 1.3, o: 0.55 },
  { x: "58%", y: "4%", r: 0.9, o: 0.4 },
  { x: "38%", y: "17%", r: 1.5, o: 0.5 },
  { x: "88%", y: "21%", r: 1.1, o: 0.45 },
  { x: "13%", y: "26%", r: 0.9, o: 0.35 },
  { x: "51%", y: "35%", r: 1.2, o: 0.3 },
  { x: "79%", y: "43%", r: 0.9, o: 0.28 },
  { x: "34%", y: "52%", r: 1.4, o: 0.3 },
  { x: "63%", y: "64%", r: 1, o: 0.26 },
  { x: "17%", y: "80%", r: 1.3, o: 0.28 },
  { x: "86%", y: "76%", r: 0.9, o: 0.24 },
];

/**
 * One tile of the lattice: the eight-pointed star, drawn as two squares turned
 * against each other, with the small diamond that sits where four tiles meet.
 */
const KHATIM = (() => {
  const c = TILE / 2;
  const r = TILE * 0.27;
  const square = `M ${c - r} ${c - r} H ${c + r} V ${c + r} H ${c - r} Z`;
  const turned = `M ${c} ${c - r * 1.32} L ${c + r * 1.32} ${c} L ${c} ${
    c + r * 1.32
  } L ${c - r * 1.32} ${c} Z`;
  return { square, turned };
})();

/**
 * A real crescent, as one shape: the outer arc, then an inner arc swung back
 * across it. Cutting one disc out of another looked like a smudge here,
 * because the disc doing the cutting had to be painted in the page colour and
 * the ground behind it is not flat.
 */
const CRESCENT = (() => {
  const R = 26;
  const dx = 11;
  const r = Math.sqrt(dx * dx + R * R);
  return `M 0 ${-R} A ${R} ${R} 0 1 0 0 ${R} A ${r} ${r} 0 1 1 0 ${-R} Z`;
})();

export const ScreenBackdrop = memo(function ScreenBackdrop({
  /** Dial the whole thing up or down without touching the layers. */
  intensity = 1,
  /**
   * "quiet" is the ground under a screen that is being read.
   * "night" adds the sky the app already draws elsewhere — a crescent and a
   *  scatter of stars — for a screen that is looked at rather than read.
   */
  variant = "quiet",
}: {
  intensity?: number;
  variant?: "quiet" | "night";
}) {
  const k = Math.max(0, Math.min(intensity, 2));
  const night = variant === "night";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {night && (
        // Placed as its own layer so it can be positioned in percentages
        // while the path inside it stays in plain coordinates. It sits left of
        // the nodes and below the header — the one band nothing else crosses.
        <View style={s.moon} pointerEvents="none">
          <Svg width={70} height={70} viewBox="-35 -35 70 70">
            <Path
              d={CRESCENT}
              fill={GLOW_WARM}
              opacity={0.16 * k}
              transform="rotate(-24)"
            />
          </Svg>
        </View>
      )}

      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="khatim"
            x="0"
            y="0"
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
          >
            <G stroke={STAR} strokeWidth={1} fill="none">
              <Path d={KHATIM.square} opacity={0.032 * k} />
              <Path d={KHATIM.turned} opacity={0.032 * k} />
            </G>
            <Circle
              cx={TILE / 2}
              cy={TILE / 2}
              r={1.4}
              fill={STAR}
              opacity={0.05 * k}
            />
          </Pattern>

          {/* The lattice is held back where the reading happens. It comes in
              below the title and stays quietly under the body. */}
          <LinearGradient id="latticeFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={0} />
            <Stop offset="0.22" stopColor="#fff" stopOpacity={0.55} />
            <Stop offset="0.55" stopColor="#fff" stopOpacity={1} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0.7} />
          </LinearGradient>

          <Mask id="latticeMask">
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#latticeFade)"
            />
          </Mask>

          <RadialGradient id="cool" cx="78%" cy="6%" r="82%">
            <Stop offset="0" stopColor={STAR} stopOpacity={0.1 * k} />
            <Stop offset="0.55" stopColor={STAR} stopOpacity={0.03 * k} />
            <Stop offset="1" stopColor={STAR} stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="warm" cx="14%" cy="96%" r="76%">
            <Stop offset="0" stopColor={GLOW_WARM} stopOpacity={0.075 * k} />
            <Stop offset="0.6" stopColor={GLOW_WARM} stopOpacity={0.02 * k} />
            <Stop offset="1" stopColor={GLOW_WARM} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#khatim)"
          mask="url(#latticeMask)"
        />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#cool)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#warm)" />

        {night && (
          <>
            {/* A crescent, drawn the way the app icon draws one: a disc with a
                second disc taken out of it, so the horns come to a point. */}
            {STARS.map((p, i) => (
              <Circle
                key={`star-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={i % 4 === 0 ? GLOW_WARM : STAR}
                opacity={p.o * 0.55 * k}
              />
            ))}
          </>
        )}

        {SPARKS.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={i % 3 === 0 ? GLOW_WARM : STAR}
            opacity={p.o * 0.5 * k}
          />
        ))}
      </Svg>
    </View>
  );
});

const s = StyleSheet.create({
  moon: { position: "absolute", left: "11%", top: "26%" },
});

export default ScreenBackdrop;
