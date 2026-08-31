import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { WORLD, type WorldFamily } from "./worldTheme";

/**
 * The lantern mascot and the three counters beside it.
 *
 * The mascot is drawn rather than shipped as an asset: it is two dozen
 * primitives, it recolours per course family for free, and it stays crisp at
 * any density without three PNGs.
 */
export const PathHero = memo(function PathHero({
  streak,
  xp,
  levelsDone,
  family,
}: {
  streak: number;
  xp: number;
  /** Levels finished in this course — replaces the mockup's HEARTS counter. */
  levelsDone: number;
  family: WorldFamily;
}) {
  return (
    <View style={s.row}>
      <Mascot family={family} />
      <View style={s.stats}>
        <StatCard value={String(streak)} label="STREAK" tone={WORLD.gold} />
        <StatCard value={xp.toLocaleString()} label="TOTAL XP" tone={WORLD.text} />
        {/* The mockup's third counter is HEARTS. This app has no hearts outside
            a Hifz session, and a counter that never moves is dead furniture —
            so the slot shows the one number that does move as you climb. */}
        <StatCard value={String(levelsDone)} label="LEVELS" tone={WORLD.check} />
      </View>
    </View>
  );
});

function StatCard({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <View style={s.card}>
      <Text style={[s.value, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

function Mascot({ family }: { family: WorldFamily }) {
  return (
    <Svg width={62} height={62} viewBox="0 0 62 62">
      <Defs>
        <LinearGradient id="mascot" x1="14" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={family.mascot[0]} />
          <Stop offset="1" stopColor={family.mascot[1]} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={31} cy={56} rx={18} ry={4} fill="#04161A" opacity={0.5} />
      <Path d="M22 16 H40 L44 44 A13 13 0 0 1 18 44 Z" fill="url(#mascot)" />
      <Rect x={24} y={10} width={14} height={7} rx={3.5} fill={family.mascotCap} />
      <Rect x={29.5} y={3} width={3} height={8} rx={1.5} fill={family.mascotCap} />
      <Circle cx={26} cy={34} r={3.4} fill={family.mascotInk} />
      <Circle cx={36} cy={34} r={3.4} fill={family.mascotInk} />
      <Circle cx={27.1} cy={32.9} r={1.2} fill={family.mascotEyeGleam} />
      <Circle cx={37.1} cy={32.9} r={1.2} fill={family.mascotEyeGleam} />
      <Path
        d="M27 41 Q31 44.5 35 41"
        stroke={family.mascotInk}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: WORLD.panel,
    borderWidth: 1,
    borderColor: WORLD.panelBorder,
    borderRadius: 16,
    paddingVertical: 9,
    alignItems: "center",
  },
  value: {
    fontSize: 17,
    fontFamily: "Nunito_900Black",
    includeFontPadding: false,
  },
  label: {
    marginTop: 2,
    color: WORLD.textMuted,
    fontSize: 8.5,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 0.85,
  },
});
