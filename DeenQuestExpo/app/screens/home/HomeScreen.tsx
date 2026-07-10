import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Flame,
  Trophy,
  Check,
  BookOpen,
  BookMarked,
  RotateCw,
  AudioLines,
  Feather,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { dq } from "../../theme/designTokens";
import {
  useGetDailyTasksQuery,
  useGetProgressQuery,
  useGetProfileQuery,
} from "../../store/services/api";
import type { DailyTask } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

// Icon shown on each mission row, keyed by the task's category.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  salah: Flame,
  quran: BookMarked,
  dhikr: RotateCw,
  learning: BookOpen,
  character: AudioLines,
  social: Check,
  reflection: Feather,
};

// Per-category icon tile tint + icon colour, straight from the B1 mock.
const CATEGORY_TINTS: Record<string, { bg: string; fg: string }> = {
  salah: { bg: "#123B34", fg: "#2CC9B5" },
  quran: { bg: "#16303E", fg: "#6EC1E8" },
  dhikr: { bg: "#3A2F16", fg: "#EFB65A" },
  learning: { bg: "#2A2440", fg: "#A78BFA" },
  character: { bg: "#3A2030", fg: "#F27FB2" },
  social: { bg: "#123B34", fg: "#2CC9B5" },
  reflection: { bg: "#16303E", fg: "#6EC1E8" },
};
const DEFAULT_TINT = { bg: "#123B34", fg: "#2CC9B5" };

const XP_PER_LEVEL = 500;

// Day letters indexed by Date.getDay() (Sun..Sat). weekly_completions is
// relative to today (index 0 = 6 days ago, index 6 = today), so the labels are
// derived from real dates rather than a fixed Mon..Sun.
function buildWeek(): { letter: string; isToday: boolean }[] {
  const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { letter: LETTERS[d.getDay()] ?? "", isToday: i === 6 };
  });
}

const WEEK = buildWeek();

function rankWord(title?: string): string {
  const first = (title || "Seeker").trim().split(/\s+/)[0] || "Seeker";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export const HomeScreen = () => {
  const { data: tasksData, isLoading: tasksLoading } = useGetDailyTasksQuery();
  const { data: progressData } = useGetProgressQuery();
  const { data: profileData } = useGetProfileQuery();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const tasks = tasksData?.data ?? [];
  const progress = progressData?.data;
  const profile = profileData?.data;

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const longestStreak = progress?.longest_streak ?? currentStreak;
  const weeklyCompletions =
    progress?.weekly_completions ?? new Array(7).fill(false);

  const displayName =
    profile?.display_name || profile?.email?.split("@")[0] || "Explorer";
  const initial = displayName.charAt(0).toUpperCase();
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;

  const handleTaskPress = (task: DailyTask) => {
    navigation.navigate("DailyTaskDetail", { task });
  };

  return (
    <ScreenWrapper innerStyle={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greetingRow}>
          <View style={{ gap: 2 }}>
            <Text style={styles.salaam}>Assalamu alaikum</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <LinearGradient
            colors={[dq.green, dq.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        </View>

        {/* ── Streak hero ── */}
        <LinearGradient
          colors={["#26301C", "#16272B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.55, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroStreak}>
              <Flame size={40} color={dq.gold} fill={dq.gold} />
              <View>
                <Text style={styles.heroStreakNum}>{currentStreak}</Text>
                <Text style={styles.heroStreakLabel}>DAY STREAK</Text>
              </View>
            </View>
            <View style={styles.bestPill}>
              <Trophy size={13} color={dq.gold} />
              <Text style={styles.bestText}>Best {longestStreak}</Text>
            </View>
          </View>

          {/* week dots */}
          <View style={styles.weekRow}>
            {WEEK.map((day, i) => {
              const done = weeklyCompletions[i] === true;
              const isToday = day.isToday;
              return (
                <View key={i} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.dayLetter,
                      isToday && { color: dq.gold },
                    ]}
                  >
                    {day.letter}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      done && styles.dayDotDone,
                      isToday && !done && styles.dayDotToday,
                      !done && !isToday && styles.dayDotEmpty,
                    ]}
                  >
                    {done ? (
                      <Check size={15} color={dq.green} strokeWidth={3} />
                    ) : isToday ? (
                      <Flame size={14} color={dq.gold} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* xp */}
          <View style={styles.xpBlock}>
            <View style={styles.xpRow}>
              <Text style={styles.levelText}>
                Level {level} ·{" "}
                <Text style={styles.rankText}>{rankWord(profile?.title)}</Text>
              </Text>
              <Text style={styles.xpText}>
                {xpInLevel} / {XP_PER_LEVEL} XP
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={[dq.green, dq.greenBright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${xpPct}%` }]}
              />
            </View>
          </View>
        </LinearGradient>


        {/* ── Daily Missions ── */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            <View style={styles.missionCountPill}>
              <Text style={styles.missionCountText}>
                {completedCount} / {tasks.length}
              </Text>
            </View>
          </View>

          {tasksLoading ? (
            <Loader />
          ) : (
            <View style={styles.missionCard}>
              {tasks.map((task, i) => {
                const Icon = CATEGORY_ICONS[task.category] ?? Feather;
                const last = i === tasks.length - 1;
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => handleTaskPress(task)}
                    style={({ pressed }) => [
                      styles.missionRow,
                      !last && styles.missionRowBorder,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View
                      style={[
                        styles.missionIcon,
                        {
                          backgroundColor: (
                            CATEGORY_TINTS[task.category] ?? DEFAULT_TINT
                          ).bg,
                        },
                      ]}
                    >
                      <Icon
                        size={18}
                        color={(CATEGORY_TINTS[task.category] ?? DEFAULT_TINT).fg}
                      />
                    </View>
                    <View style={styles.missionBody}>
                      <Text style={styles.missionTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.missionSub} numberOfLines={1}>
                        {task.description || task.category}
                      </Text>
                    </View>
                    {task.completed ? (
                      <View style={styles.missionCheck}>
                        <Check size={15} color={dq.onGreen} strokeWidth={3.5} />
                      </View>
                    ) : (
                      <View style={styles.missionXpPill}>
                        <Text style={styles.missionXpText}>
                          +{task.reward_xp} XP
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 90,
    gap: 20,
  },

  // Greeting
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  salaam: { fontSize: 14, fontFamily: "Nunito_700Bold", color: dq.muted },
  name: { fontSize: 24, fontFamily: "Nunito_900Black", color: dq.text },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 19, fontFamily: "Nunito_900Black", color: dq.onGreen },

  // Hero card
  heroCard: {
    borderWidth: 1,
    borderColor: "#3E4A2C",
    borderRadius: 22,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroStreak: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroStreakNum: { fontSize: 34, fontFamily: "Nunito_900Black", color: dq.text, lineHeight: 36 },
  heroStreakLabel: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.gold,
    letterSpacing: 1.2,
  },
  bestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  bestText: { fontSize: 13, fontFamily: "Nunito_800ExtraBold", color: dq.muted },

  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", gap: 6 },
  dayLetter: { fontSize: 11, fontFamily: "Nunito_800ExtraBold", color: dq.faint },
  dayDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotDone: { backgroundColor: dq.greenTint },
  dayDotToday: {
    borderWidth: 2,
    borderColor: dq.gold,
  },
  dayDotEmpty: {
    borderWidth: 2,
    borderColor: "#2C464C",
  },

  xpBlock: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: dq.cardBorder,
    paddingTop: 14,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelText: { fontSize: 13, fontFamily: "Nunito_900Black", color: dq.text },
  rankText: { color: dq.green },
  xpText: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  xpTrack: {
    height: 12,
    borderRadius: 7,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  xpFill: { height: "100%", borderRadius: 7 },

  // Missions
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Nunito_900Black", color: dq.text },
  missionCountPill: {
    backgroundColor: dq.greenTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  missionCountText: { fontSize: 12, fontFamily: "Nunito_900Black", color: dq.green },
  missionCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 14,
  },
  missionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dq.rowBorder,
  },
  missionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  missionBody: { flex: 1, gap: 1 },
  missionTitle: { fontSize: 14.5, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  missionSub: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: dq.faint },
  missionCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: dq.green,
    alignItems: "center",
    justifyContent: "center",
  },
  missionXpPill: {
    backgroundColor: dq.goldTint,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  missionXpText: { fontSize: 12, fontFamily: "Nunito_900Black", color: dq.gold },
});
