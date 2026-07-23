import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { dq } from "../../theme/designTokens";
import { formatTime, type NextPrayerInfo } from "../../utils/prayerTimes";
import { PRAYER_GLYPHS, prayerColors } from "../../theme/prayerTokens";

/** The next-prayer hero: label + big time on the left, prayer glyph tile on the
 *  right, then a live countdown pill + progress bar. */
export function NextPrayerHero({
  next,
  countdown,
}: {
  next: NextPrayerInfo;
  countdown: string;
}) {
  const { time, suffix } = formatTime(next.next.date);
  const pct = Math.round(next.progress * 100);

  return (
    <LinearGradient
      colors={[prayerColors.heroFrom, prayerColors.heroTo]}
      locations={[0, 0.62]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={s.card}
    >
      <View style={s.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>
            NEXT PRAYER · {next.next.label.toUpperCase()}
          </Text>
          <Text style={s.time}>
            {time}
            <Text style={s.suffix}> {suffix}</Text>
          </Text>
        </View>
        <View style={s.iconTile}>
          <Text style={s.glyph}>{PRAYER_GLYPHS[next.next.name]}</Text>
        </View>
      </View>

      <View style={s.bottomRow}>
        <View style={s.countdownPill}>
          <Text style={s.countdownText}>{countdown}</Text>
        </View>
        <View style={s.track}>
          <LinearGradient
            colors={[prayerColors.blue, prayerColors.blueLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.fill, { width: `${pct}%` }]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: prayerColors.border,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: prayerColors.blue,
    letterSpacing: 1.4,
  },
  time: {
    fontSize: 44,
    lineHeight: 46,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 10,
  },
  suffix: { fontSize: 22, fontFamily: "Nunito_900Black", color: dq.muted },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: prayerColors.tileBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 22, color: prayerColors.blue },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  countdownPill: {
    backgroundColor: prayerColors.tileBlue,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  countdownText: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    color: prayerColors.blueLight,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 5,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5 },
});
