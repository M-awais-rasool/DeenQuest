import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import {
  Bell,
  ChevronLeft,
  Compass,
  MapPin,
  Check,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { dq } from "../../theme/designTokens";
import { haptics } from "../../utils/haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "PrayerTimes">;

const BLUE = "#6EC1E8";
const BLUE_LIGHT = "#9AD5F2";
const BLUE_DARK = "#0E2A3A";

// Mock prayer times (H1 mock) — a location-aware API replaces this later.
const PRAYERS: {
  name: string;
  hour: number;
  minute: number;
  glyph: string;
  tileBg: string;
  tileFg: string;
}[] = [
  { name: "Fajr", hour: 4, minute: 12, glyph: "☾", tileBg: "#123B34", tileFg: "#2CC9B5" },
  { name: "Dhuhr", hour: 12, minute: 8, glyph: "☀", tileBg: "#3A2F16", tileFg: "#EFB65A" },
  { name: "Asr", hour: 15, minute: 47, glyph: "☀", tileBg: "#12303A", tileFg: BLUE_LIGHT },
  { name: "Maghrib", hour: 18, minute: 52, glyph: "◗", tileBg: "#2A2440", tileFg: "#A78BFA" },
  { name: "Isha", hour: 20, minute: 21, glyph: "★", tileBg: "#1E3238", tileFg: "#8DA5A3" },
];

function fmt(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function PrayerTimesScreen({ navigation }: Props) {
  const [remindersOn, setRemindersOn] = useState(true);

  // Which prayer is next, based on the actual clock so the demo feels alive.
  const { nextIdx, countdown, dayPct } = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const times = PRAYERS.map((p) => p.hour * 60 + p.minute);
    let idx = times.findIndex((t) => t > mins);
    if (idx === -1) idx = 0; // after Isha → next is tomorrow's Fajr
    const target = times[idx] + (times[idx] <= mins ? 24 * 60 : 0);
    const delta = target - mins;
    const h = Math.floor(delta / 60);
    const m = delta % 60;
    const prev = idx === 0 ? times[times.length - 1] - 24 * 60 : times[idx - 1];
    const pct = Math.min(
      Math.max((mins - prev) / Math.max(target - prev, 1), 0),
      1,
    );
    return {
      nextIdx: idx,
      countdown: h > 0 ? `in ${h}h ${m}m` : `in ${m}m`,
      dayPct: pct,
    };
  }, []);

  const next = PRAYERS[nextIdx];

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* header */}
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Prayer Times</Text>
          <View style={s.locationRow}>
            <MapPin size={12} color={BLUE} strokeWidth={2.4} />
            <Text style={s.locationText}>Lahore, Pakistan</Text>
          </View>
        </View>
        <AnimatedPressable
          style={s.qiblaChip}
          onPress={() => haptics.light()}
        >
          <Compass size={15} color={BLUE_LIGHT} strokeWidth={2.2} />
          <Text style={s.qiblaText}>QIBLA</Text>
        </AnimatedPressable>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* next prayer hero */}
        <View style={s.heroCard}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="ph" cx="0.5" cy="0" r="1">
                <Stop offset="0" stopColor="#1B4E5E" />
                <Stop offset="0.7" stopColor="#12262E" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#ph)" />
          </Svg>
          <Text style={[s.heroStar, { top: 16, left: 18, color: BLUE }]}>✦</Text>
          <Text style={[s.heroStar, { top: 22, right: 24, color: dq.gold }]}>✦</Text>
          <Text style={s.heroLabel}>
            NEXT PRAYER · {next.name.toUpperCase()}
          </Text>
          <Text style={s.heroTime}>
            {fmt(next.hour, next.minute).split(" ")[0]}
            <Text style={s.heroSuffix}>
              {" "}
              {fmt(next.hour, next.minute).split(" ")[1]}
            </Text>
          </Text>
          <View style={s.countdownChip}>
            <View style={s.countdownDot} />
            <Text style={s.countdownText}>{countdown}</Text>
          </View>
          <View style={s.heroTrack}>
            <LinearGradient
              colors={[BLUE, BLUE_LIGHT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.heroFill, { width: `${Math.round(dayPct * 100)}%` }]}
            />
          </View>
        </View>

        {/* prayer list */}
        <View style={s.listCard}>
          {PRAYERS.map((p, i) => {
            const isNext = i === nextIdx;
            const isPast = i < nextIdx;
            const last = i === PRAYERS.length - 1;
            return (
              <View
                key={p.name}
                style={[
                  s.row,
                  !last && s.rowBorder,
                  isNext && s.rowNext,
                  !isNext && !isPast && s.rowFuture,
                ]}
              >
                <View
                  style={[
                    s.rowTile,
                    { backgroundColor: p.tileBg },
                    isNext && s.rowTileNext,
                  ]}
                >
                  <Text style={[s.rowGlyph, { color: p.tileFg }]}>
                    {p.glyph}
                  </Text>
                </View>
                <Text style={[s.rowName, isNext && s.rowNameNext]}>
                  {p.name}
                </Text>
                <Text style={[s.rowTime, isNext && s.rowTimeNext]}>
                  {fmt(p.hour, p.minute)}
                </Text>
                {isPast ? (
                  <View style={s.doneDot}>
                    <Check size={12} color={dq.onGreen} strokeWidth={3.5} />
                  </View>
                ) : isNext ? (
                  <View style={s.nextChip}>
                    <Text style={s.nextChipText}>NEXT</Text>
                  </View>
                ) : (
                  <View style={s.futureDot} />
                )}
              </View>
            );
          })}
        </View>

        {/* adhan reminders */}
        <AnimatedPressable
          style={s.reminderCard}
          onPress={() => {
            haptics.light();
            setRemindersOn((v) => !v);
          }}
        >
          <Bell size={16} color={dq.gold} strokeWidth={2.2} />
          <Text style={s.reminderText}>Adhan reminders · 10 min before</Text>
          <View style={[s.toggle, remindersOn ? s.toggleOn : s.toggleOff]}>
            <View
              style={[s.knob, remindersOn ? s.knobOn : s.knobOff]}
            />
          </View>
        </AnimatedPressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontFamily: "Nunito_900Black", color: dq.text },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12.5,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
  },
  qiblaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#12303A",
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  qiblaText: { fontSize: 12, fontFamily: "Nunito_900Black", color: BLUE_LIGHT },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  heroCard: {
    borderWidth: 1,
    borderColor: "#24505F",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  heroStar: { position: "absolute", fontSize: 12, opacity: 0.65 },
  heroLabel: {
    fontSize: 11.5,
    fontFamily: "Nunito_800ExtraBold",
    color: BLUE_LIGHT,
    letterSpacing: 1.8,
  },
  heroTime: {
    fontSize: 52,
    lineHeight: 58,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 10,
  },
  heroSuffix: { fontSize: 24, color: dq.muted },
  countdownChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(11,21,23,0.5)",
    borderWidth: 1,
    borderColor: "#24505F",
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  countdownDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
  countdownText: {
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
    color: BLUE_LIGHT,
  },
  heroTrack: {
    alignSelf: "stretch",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(11,21,23,0.55)",
    overflow: "hidden",
    marginTop: 16,
  },
  heroFill: { height: "100%", borderRadius: 5 },

  listCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dq.rowBorder,
  },
  rowNext: { backgroundColor: "rgba(110,193,232,0.06)" },
  rowFuture: { opacity: 0.6 },
  rowTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTileNext: {
    borderWidth: 1.5,
    borderColor: BLUE,
  },
  rowGlyph: { fontSize: 15 },
  rowName: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
  },
  rowNameNext: { color: BLUE_LIGHT, fontFamily: "Nunito_900Black" },
  rowTime: {
    fontSize: 13.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.muted,
  },
  rowTimeNext: { color: BLUE_LIGHT, fontFamily: "Nunito_900Black" },
  doneDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: dq.green,
    alignItems: "center",
    justifyContent: "center",
  },
  futureDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2C464C",
  },
  nextChip: {
    backgroundColor: "#12303A",
    borderWidth: 1,
    borderColor: "#24505F",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nextChipText: {
    fontSize: 10,
    fontFamily: "Nunito_800ExtraBold",
    color: BLUE_LIGHT,
    letterSpacing: 0.8,
  },

  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  reminderText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
    color: dq.muted,
  },
  toggle: {
    width: 40,
    height: 23,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: dq.green },
  toggleOff: { backgroundColor: "#2C464C" },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: dq.text,
  },
  knobOn: { alignSelf: "flex-end", marginRight: 2.5 },
  knobOff: { alignSelf: "flex-start", marginLeft: 2.5 },
});

export default PrayerTimesScreen;
