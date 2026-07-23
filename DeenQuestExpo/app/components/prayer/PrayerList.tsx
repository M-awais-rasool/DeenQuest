import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { dq } from "../../theme/designTokens";
import type { PrayerTime } from "../../types/prayer";
import { formatTime } from "../../utils/prayerTimes";
import { PRAYER_GLYPHS, prayerColors } from "../../theme/prayerTokens";

interface Props {
  times: PrayerTime[];
  /** Index of the upcoming prayer in `times`, or -1 if all have passed today. */
  nextIndex: number;
}

/** The five-prayer list. Memoized so the parent's 1s countdown tick doesn't
 *  re-render it — only `nextIndex` (which changes at prayer boundaries) does. */
function PrayerListBase({ times, nextIndex }: Props) {
  return (
    <View style={s.card}>
      {times.map((p, i) => {
        const isNext = i === nextIndex;
        const isPast = nextIndex === -1 || i < nextIndex;
        const last = i === times.length - 1;
        const { time, suffix } = formatTime(p.date);
        return (
          <View
            key={p.name}
            style={[
              s.row,
              !last && s.rowBorder,
              isNext && s.rowNext,
              isPast && s.rowPast,
            ]}
          >
            <View style={[s.tile, isNext ? s.tileNext : s.tileDim]}>
              <Text
                style={[
                  s.glyph,
                  { color: isNext ? prayerColors.blueLight : dq.faint },
                ]}
              >
                {PRAYER_GLYPHS[p.name]}
              </Text>
            </View>

            <View style={s.nameWrap}>
              <Text
                style={[
                  s.name,
                  isNext
                    ? s.nameNext
                    : isPast
                      ? s.namePast
                      : s.nameFuture,
                ]}
              >
                {p.label}
              </Text>
              {isNext ? (
                <View style={s.nextBadge}>
                  <Text style={s.nextBadgeText}>NEXT</Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                s.time,
                isNext ? s.timeNext : isPast ? s.timePast : s.timeFuture,
              ]}
            >
              {time} {suffix}
            </Text>

            {isPast ? (
              <View style={s.checkCircle}>
                <Text style={s.checkText}>✓</Text>
              </View>
            ) : isNext ? null : (
              <View style={s.emptyCircle} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export const PrayerList = React.memo(PrayerListBase);

const s = StyleSheet.create({
  card: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: dq.rowBorder },
  rowNext: { backgroundColor: prayerColors.tileBlue, paddingVertical: 15 },
  rowPast: { opacity: 0.6 },
  tile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tileDim: { backgroundColor: prayerColors.dimTile },
  tileNext: { backgroundColor: prayerColors.nextTile },
  glyph: { fontSize: 17 },
  nameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 15 },
  namePast: { fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  nameFuture: { fontFamily: "Nunito_800ExtraBold", color: dq.text },
  nameNext: { fontFamily: "Nunito_900Black", color: dq.text },
  nextBadge: {
    backgroundColor: prayerColors.blue,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  nextBadgeText: {
    fontSize: 9,
    fontFamily: "Nunito_900Black",
    color: prayerColors.blueDark,
    letterSpacing: 0.7,
  },
  time: { fontSize: 14 },
  timePast: { fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  timeFuture: { fontFamily: "Nunito_800ExtraBold", color: dq.text },
  timeNext: { fontFamily: "Nunito_900Black", color: prayerColors.blueLight },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: dq.greenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { fontSize: 12, fontFamily: "Nunito_900Black", color: dq.green },
  emptyCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: prayerColors.emptyRing,
  },
});
