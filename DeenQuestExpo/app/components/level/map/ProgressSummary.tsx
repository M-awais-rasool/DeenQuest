import React, { memo } from "react";
import { View } from "react-native";
import type { LevelWithStatus } from "../../../store/services/api";
import { SummaryStat } from "./SummaryStat";
import { s } from "./styles";

export const ProgressSummary = memo(function ProgressSummary({
  levels,
  xp,
}: {
  levels: LevelWithStatus[];
  xp: number;
}) {
  const completed = levels.filter((l) => l.status === "completed").length;
  const totalStars = levels.reduce((sum, l) => sum + l.stars, 0);
  const pct = levels.length > 0 ? (completed / levels.length) * 100 : 0;

  return (
    <View style={s.summaryCard}>
      <View style={s.summaryRow}>
        <SummaryStat value={`${completed}/${levels.length}`} label="Levels" />
        <View style={s.summaryDivider} />
        <SummaryStat
          value={`${totalStars}/${levels.length * 3}`}
          label="Stars"
        />
        <View style={s.summaryDivider} />
        <SummaryStat value={String(xp)} label="Total XP" />
      </View>
      <View style={s.summaryBar}>
        <View style={[s.summaryBarFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
});
