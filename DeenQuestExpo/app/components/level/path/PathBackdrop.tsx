import React, { memo } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { PATH_CYAN, PATH_NIGHT } from "../map";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const VALLEY = require("../../../../assets/level/landscape.png");
const VALLEY_H = Math.round(SCREEN_WIDTH * (186 / 609));

const STARS: { x: string; y: string; r: number; o: number }[] = [
  { x: "22%", y: "9%", r: 1.6, o: 0.55 },
  { x: "61%", y: "5%", r: 1, o: 0.4 },
  { x: "12%", y: "17%", r: 1.2, o: 0.45 },
  { x: "79%", y: "14%", r: 1.5, o: 0.5 },
  { x: "35%", y: "24%", r: 1, o: 0.35 },
  { x: "88%", y: "31%", r: 1.3, o: 0.45 },
  { x: "9%", y: "38%", r: 1.1, o: 0.35 },
  { x: "68%", y: "44%", r: 1.6, o: 0.5 },
  { x: "27%", y: "51%", r: 1, o: 0.3 },
  { x: "83%", y: "58%", r: 1.2, o: 0.4 },
  { x: "16%", y: "63%", r: 1.4, o: 0.35 },
  { x: "54%", y: "70%", r: 1, o: 0.3 },
];

const SPARKLE =
  "M 0 -16 L 3.4 -3.4 L 16 0 L 3.4 3.4 L 0 16 L -3.4 3.4 L -16 0 L -3.4 -3.4 Z";

const DUSK = 34;
const BAR_OVERLAP = 22;

export const PathBackdrop = memo(function PathBackdrop({
  bottomInset = 0,
}: {
  bottomInset?: number;
}) {
  const valleyFoot = Math.max(bottomInset - BAR_OVERLAP, 0);

  return (
    <View style={s.fill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="horizon" cx="50%" cy="86%" r="58%">
            <Stop offset="0" stopColor={PATH_CYAN} stopOpacity={0.13} />
            <Stop offset="0.55" stopColor={PATH_CYAN} stopOpacity={0.04} />
            <Stop offset="1" stopColor={PATH_CYAN} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sky" cx="50%" cy="6%" r="72%">
            <Stop offset="0" stopColor="#0A3A42" stopOpacity={0.14} />
            <Stop offset="1" stopColor="#0A3A42" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#horizon)" />

        {STARS.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={PATH_CYAN}
            opacity={p.o}
          />
        ))}

        <Path
          d={SPARKLE}
          fill="#8FFFF3"
          opacity={0.85}
          transform={`translate(${SCREEN_WIDTH * 0.88} ${SCREEN_WIDTH * 0.62})`}
        />
      </Svg>

      <Image
        source={VALLEY}
        style={[s.valley, { bottom: valleyFoot }]}
        resizeMode="stretch"
      />

      <LinearGradient
        colors={DUSK_FADE}
        style={[s.dusk, { bottom: valleyFoot }]}
      />
      <View style={[s.ground, { height: valleyFoot }]} />
    </View>
  );
});

const DUSK_FADE = ["rgba(1, 30, 35, 0)", PATH_NIGHT] as const;

const s = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PATH_NIGHT,
  },
  valley: {
    position: "absolute",
    left: 0,
    right: 0,
    height: VALLEY_H,
  },
  dusk: {
    position: "absolute",
    left: 0,
    right: 0,
    height: DUSK,
  },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PATH_NIGHT,
  },
});
