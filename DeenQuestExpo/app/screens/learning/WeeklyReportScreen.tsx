import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Flame, Star, CheckCircle2, Trophy } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import { useQuranFont } from "../../hooks/useQuranFont";
import { LearningHeader } from "../../components/learning/parts";
import { useGetWeeklyReportQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeeklyReportScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch, isFetching } = useGetWeeklyReportQuery();
  const { fontFamily } = useQuranFont();
  const r = data?.data;

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader title="Weekly Report" subtitle="Your week at a glance" onBack={() => navigation.goBack()} />
      {isLoading || !r ? (
        <Loader fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
        >
          <View style={s.headlineCard}>
            <Text style={s.headline}>{r.headline}</Text>
            {r.narrative ? <Text style={s.narrative}>{r.narrative}</Text> : null}
          </View>

          {/* Activity dots */}
          <View style={s.card}>
            <Text style={s.cardLabel}>THIS WEEK · {r.active_days}/7 ACTIVE</Text>
            <View style={s.weekRow}>
              {r.weekly_activity.map((on, i) => (
                <View key={i} style={s.dayCol}>
                  <View style={[s.dayDot, on && s.dayDotOn]}>
                    {on ? <CheckCircle2 size={15} color={theme.colors.onPrimary} /> : null}
                  </View>
                  <Text style={s.dayLabel}>{DAYS[i]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stat tiles */}
          <View style={s.grid}>
            <Stat icon={Flame} color={theme.colors.secondary} value={`${r.current_streak}`} label="Day streak" />
            <Stat icon={Star} color={theme.colors.primary} value={`${r.xp}`} label="Total XP" />
            <Stat icon={Trophy} color={theme.colors.lavender} value={`${r.levels_completed}`} label="Levels done" />
            <Stat icon={CheckCircle2} color={theme.colors.cyan} value={`L${r.level}`} label="Current level" />
          </View>

          {r.weak_areas?.length ? (
            <View style={s.card}>
              <Text style={s.cardLabel}>FOCUS NEXT</Text>
              <View style={s.chipRow}>
                {r.weak_areas.map((w, i) => (
                  <View key={i} style={s.chip}>
                    <Text style={[s.chipText, !w.startsWith("level:") && { fontFamily, fontSize: 18 }]}>
                      {w.startsWith("level:") ? `Level ${w.slice(6)}` : w}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

function Stat({ icon: Icon, color, value, label }: { icon: typeof Flame; color: string; value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + "1F" }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 40, gap: 12 },
  headlineCard: {
    backgroundColor: theme.colors.primary12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
  },
  headline: { color: theme.colors.text, fontSize: 17, fontWeight: "900", lineHeight: 23 },
  narrative: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  card: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  cardLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", gap: 6 },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
  },
  dayDotOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dayLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: { color: theme.colors.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minWidth: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
  },
  chipText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
});
