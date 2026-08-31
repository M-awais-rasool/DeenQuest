import React, { memo } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { WORLD, type WorldFamily } from "./worldTheme";
import { roadPath } from "./pathLayout";

/**
 * The world is drawn in two layers, and the split is not decorative.
 *
 * The crescent, the stars and the mosque all sit in the top ~270 px of the
 * mockup — which is exactly the band the header occupies. They are meant to be
 * seen *through* the header's glass panels, the way the mockup shows them, so
 * they cannot live in the scrolling canvas: scroll once and the sky is gone,
 * leaving the header sitting on flat colour.
 *
 * So the sky is fixed behind everything and only the ground moves. That also
 * happens to be how distance works.
 */

/** Fixed: gradient, crescent, stars, mosque. Never scrolls. */
export const SkyLayer = memo(function SkyLayer({
  width,
  height,
  family,
}: {
  width: number;
  height: number;
  family: WorldFamily;
}) {
  const sx = (x: number) => (x * width) / 390;

  return (
    <Svg width={width} height={height} style={{ position: "absolute" }} pointerEvents="none">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={family.sky[0]} />
          <Stop offset="0.45" stopColor={family.sky[1]} />
          <Stop offset="1" stopColor={family.sky[2]} />
        </LinearGradient>
      </Defs>

      <Rect width={width} height={height} fill="url(#sky)" />

      <Circle cx={sx(330)} cy={70} r={86} fill={family.glow} opacity={0.08} />
      <Path
        d="M336 44 A24 24 0 1 0 336 92 A31 31 0 0 1 336 44 Z"
        fill={family.crescent}
        opacity={0.5}
        transform={`rotate(-22 336 68) translate(${sx(336) - 336} 0)`}
      />

      <Circle cx={sx(64)} cy={58} r={1.9} fill={WORLD.star} opacity={0.55} />
      <Circle cx={sx(132)} cy={34} r={1.5} fill={WORLD.star} opacity={0.4} />
      <Circle cx={sx(240)} cy={122} r={1.6} fill={family.crescent} opacity={0.45} />
      <Circle cx={sx(40)} cy={146} r={1.4} fill={family.glow} opacity={0.4} />

      {/* Mosque on the horizon: dome, finial and two minarets. */}
      <G opacity={0.5} fill={WORLD.mosque}>
        <Path
          d={`M${sx(196)} 214 C${sx(222)} 228 ${sx(230)} 248 ${sx(230)} 266 H${sx(162)} C${sx(162)} 248 ${sx(170)} 228 ${sx(196)} 214 Z`}
        />
        <Rect x={sx(193.4)} y={200} width={5} height={15} rx={2.5} />
        <Path
          d={`M${sx(196)} 188 A6 6 0 1 0 ${sx(196)} 200 A8 8 0 0 1 ${sx(196)} 188 Z`}
        />
        <Rect x={sx(140)} y={228} width={9} height={40} rx={4.5} />
        <Path d={`M${sx(144.5)} 210 L${sx(151)} 228 H${sx(138)} Z`} />
        <Rect x={sx(242)} y={228} width={9} height={40} rx={4.5} />
        <Path d={`M${sx(246.5)} 210 L${sx(253)} 228 H${sx(240)} Z`} />
      </G>
    </Svg>
  );
});

/** Scrolls with the path: hills, bushes and the road itself. */
export const GroundLayer = memo(function GroundLayer({
  width,
  height,
  nodeCount,
  family,
  roadOffsetY,
}: {
  width: number;
  height: number;
  nodeCount: number;
  family: WorldFamily;
  /** Where the first node sits, so the road runs under the nodes. */
  roadOffsetY: number;
}) {
  const sx = (x: number) => (x * width) / 390;
  const road = roadPath(nodeCount, sx);

  return (
    <Svg width={width} height={height} style={{ position: "absolute" }} pointerEvents="none">
      <Defs>
        <LinearGradient id="hillA" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={WORLD.hillA[0]} />
          <Stop offset="1" stopColor={WORLD.hillA[1]} />
        </LinearGradient>
        <LinearGradient id="hillB" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={WORLD.hillB[0]} />
          <Stop offset="1" stopColor={WORLD.hillB[1]} />
        </LinearGradient>
        <LinearGradient id="hillC" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={WORLD.hillC[0]} />
          <Stop offset="1" stopColor={WORLD.hillC[1]} />
        </LinearGradient>
        <LinearGradient id="road" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={family.road[0]} />
          <Stop offset="1" stopColor={family.road[1]} />
        </LinearGradient>
      </Defs>

      {/* Three ridges, each carried to the full canvas height so the ground
          stays filled however far the path runs. */}
      <Path
        d={`M0 268 C${sx(60)} 244 ${sx(110)} 262 ${sx(158)} 254 C${sx(214)} 244 ${sx(250)} 264 ${sx(296)} 256 C${sx(336)} 249 ${sx(366)} 258 ${width} 250 V${height} H0 Z`}
        fill="url(#hillA)"
      />
      <Path
        d={`M0 352 C${sx(48)} 322 ${sx(96)} 344 ${sx(150)} 332 C${sx(206)} 320 ${sx(250)} 344 ${sx(304)} 330 C${sx(344)} 320 ${sx(372)} 330 ${width} 322 V${height} H0 Z`}
        fill="url(#hillB)"
      />
      <Path
        d={`M0 478 C${sx(54)} 452 ${sx(104)} 470 ${sx(156)} 456 C${sx(212)} 442 ${sx(258)} 466 ${sx(312)} 450 C${sx(350)} 439 ${sx(374)} 448 ${width} 440 V${height} H0 Z`}
        fill="url(#hillC)"
      />

      <Bushes width={width} height={height} sx={sx} />

      {/* Four strokes on one geometry, and the order is what gives the road
          its thickness:
            1. a wide dark shoulder pushed 5 px down — the side of the road
               catching no light, the same trick the nodes use for depth
            2. the same shoulder in place, so the road is not lopsided
            3. the surface
            4. a pale highlight along the top edge, so the surface reads as
               raised rather than painted on the hillside
          Nothing here is a blur: a hard offset is what makes it look solid. */}
      <G translateY={roadOffsetY}>
        <Path d={road} stroke={WORLD.roadShadow} strokeWidth={46} strokeLinecap="round" opacity={0.55} fill="none" translateY={5} />
        <Path d={road} stroke={WORLD.roadShadow} strokeWidth={46} strokeLinecap="round" opacity={0.45} fill="none" />
        <Path d={road} stroke="url(#road)" strokeWidth={38} strokeLinecap="round" fill="none" />
        <Path
          d={road}
          stroke={family.road[0]}
          strokeWidth={38}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
          translateY={-2}
        />
        <Path d={road} stroke="url(#road)" strokeWidth={33} strokeLinecap="round" fill="none" />
        <Path
          d={road}
          stroke={family.roadDash}
          strokeWidth={2}
          strokeDasharray="7 16"
          strokeLinecap="round"
          opacity={0.5}
          fill="none"
        />
      </G>
    </Svg>
  );
});

/**
 * Bushes down both verges. The mockup hand-places four of each; here they
 * repeat on a fixed rhythm so a long path stays populated, alternating sides
 * and sizes so the repetition does not read as a pattern.
 */
function Bushes({
  width,
  height,
  sx,
}: {
  width: number;
  height: number;
  sx: (x: number) => number;
}) {
  const dark: React.ReactNode[] = [];
  const light: React.ReactNode[] = [];

  let i = 0;
  for (let y = 330; y < height; y += 145, i++) {
    const left = i % 2 === 0;
    const cx = left ? sx(30) : sx(362);
    const rx = 24 + (i % 3) * 2;
    const ry = rx - 6;
    dark.push(
      <G key={`d${i}`}>
        <Ellipse cx={cx} cy={y} rx={rx} ry={ry} />
        <Rect x={cx - 3} y={y} width={6} height={ry - 2} rx={3} />
      </G>,
    );
  }

  i = 0;
  for (let y = 300; y < height; y += 141, i++) {
    const left = i % 2 === 1;
    const cx = left ? sx(78) : sx(324);
    light.push(
      <Ellipse key={`l${i}`} cx={cx} cy={y} rx={20 + (i % 2) * 2} ry={15 + (i % 2)} />,
    );
  }

  return (
    <>
      <G fill={WORLD.bushDark} opacity={0.85}>
        {dark}
      </G>
      <G fill={WORLD.bushLight} opacity={0.8}>
        {light}
      </G>
    </>
  );
}
