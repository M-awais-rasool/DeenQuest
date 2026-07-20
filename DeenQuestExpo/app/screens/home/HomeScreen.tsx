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
  Sparkles,
  Clock,
  Brain,
  Swords,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { dq } from "../../theme/designTokens";
import {
  useGetDailyTasksQuery,
  useGetProgressQuery,
  useGetProfileQuery,
  useGetCoachInsightsQuery,
} from "../../store/services/api";
import type { DailyTask } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  COACH_PRACTICE_COURSE,
  coachHasTopInsight,
  type CoachState,
} from "../../services/coach";
import {
  trackCoachCardShown,
  trackCoachCTATapped,
} from "../../services/telemetry";

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

// Quick links to the new power-feature screens (H1–H4).
const EXPLORE_LINKS: {
  route: "PrayerTimes" | "HifzTracker" | "Challenges" | "ParentDashboard";
  label: string;
  Icon: LucideIcon;
  bg: string;
  fg: string;
}[] = [
  { route: "PrayerTimes", label: "Prayers", Icon: Clock, bg: "#12303A", fg: "#6EC1E8" },
  { route: "HifzTracker", label: "My Hifz", Icon: Brain, bg: "#3A2F16", fg: "#EFB65A" },
  { route: "Challenges", label: "Challenges", Icon: Swords, bg: "#2A2440", fg: "#A78BFA" },
  { route: "ParentDashboard", label: "Family", Icon: Users, bg: "#3A2030", fg: "#F8A9CC" },
];

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

type Nav = NativeStackNavigationProp<AppStackParamList>;

/* ─────────────────────────── G1 pieces ─────────────────────────── */

/** Small conic-style progress ring for the condensed level card. */
function LevelRing({ pct }: { pct: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.ringWrap}>
      <Svg width={34} height={34} viewBox="0 0 34 34">
        <Circle cx={17} cy={17} r={r} stroke="#1B3036" strokeWidth={5} fill="none" />
        <Circle
          cx={17}
          cy={17}
          r={r}
          stroke={dq.green}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 17 17)"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}

/** The G1 coach hero card. */
function CoachCard({
  coach,
  onFix,
  onInsights,
}: {
  coach: CoachState;
  onFix: () => void;
  onInsights: () => void;
}) {
  const m = coach.message;
  return (
    <LinearGradient
      colors={["#0F3A34", "#12262E", "#16272B"]}
      locations={[0, 0.58, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.coachCard}
    >
      <View style={styles.coachHeader}>
        <LinearGradient
          colors={["#2ED9C0", "#0E6B5E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.coachIcon}
        >
          <Sparkles size={24} color="#06302B" strokeWidth={2} />
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.coachTitleRow}>
            <Text style={styles.coachTitle}>Your Coach</Text>
            <View style={styles.aiChip}>
              <Text style={styles.aiChipText}>AI</Text>
            </View>
          </View>
          <Text style={styles.coachSubtitle}>{coach.subtitle}</Text>
        </View>
        <Pressable onPress={onInsights} hitSlop={8} style={styles.coachChevron}>
          <Text style={styles.coachChevronText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.coachMsgBox}>
        <Text style={styles.coachMsg}>
          {m.before}
          <Text style={styles.coachArabicA}>{m.arabicA}</Text>
          {m.middle}
          <Text style={styles.coachArabicB}>{m.arabicB}</Text>
          {m.after}
          <Text style={styles.coachHighlight}>{m.highlight}</Text>
          {m.tail}
        </Text>
      </View>

      <View style={styles.coachBtnRow}>
        <TactilePressable
          style={{ flex: 1 }}
          faceStyle={styles.fixBtn}
          edgeColor={dq.greenDark}
          radius={14}
          depth={4}
          haptic="medium"
          onPress={onFix}
        >
          <Text style={styles.fixBtnText}>
            {coach.fixMinutes > 0
              ? `FIX IT · ${coach.fixMinutes} MIN`
              : "VIEW INSIGHTS"}
          </Text>
        </TactilePressable>
        <AnimatedPressable style={styles.insightsBtn} onPress={onInsights}>
          <Text style={styles.insightsBtnText}>ALL INSIGHTS</Text>
        </AnimatedPressable>
      </View>
    </LinearGradient>
  );
}

/* ─────────────────────────── Screen ─────────────────────────── */

export const HomeScreen = () => {
  const { data: tasksData, isLoading: tasksLoading } = useGetDailyTasksQuery();
  const { data: progressData } = useGetProgressQuery();
  const { data: profileData } = useGetProfileQuery();
  const navigation = useNavigation<Nav>();

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

  // The coach Home variant only renders when the coach actually found
  // something to suggest: no telemetry yet, or telemetry with zero insight
  // tiles, both fall back to the plain B1 Home (a win banner alone is
  // praise, not a suggestion).
  const { data: coachRes } = useGetCoachInsightsQuery();
  const coachData = coachRes?.data ?? null;
  const coach: CoachState | null =
    coachData && coachData.insights.length > 0 ? coachData : null;
  const coachActionable = coach != null && coachHasTopInsight(coach);

  React.useEffect(() => {
    if (coach) trackCoachCardShown();
  }, [coach]);

  const handleTaskPress = (task: DailyTask) => {
    navigation.navigate("DailyTaskDetail", { task });
  };

  const startCoachPractice = () => {
    if (!coach) return;
    trackCoachCTATapped();
    if (!coachHasTopInsight(coach)) {
      navigation.navigate("CoachInsights");
      return;
    }
    navigation.navigate("LessonPlayer", {
      levelId: coach.practiceLevelId,
      startLessonIndex: 0,
      courseType: COACH_PRACTICE_COURSE,
      coachInsightId: coach.insightId,
    });
  };

  const openInsights = () => navigation.navigate("CoachInsights");

  /* ── mission rows (shared by both variants) ── */
  const renderMissionRow = (task: DailyTask, last: boolean) => {
    const Icon = CATEGORY_ICONS[task.category] ?? Feather;
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
              backgroundColor: (CATEGORY_TINTS[task.category] ?? DEFAULT_TINT)
                .bg,
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
            <Text style={styles.missionXpText}>+{task.reward_xp} XP</Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Coach-suggested practice row, injected under the first mission (G1).
  const coachMissionRow = coachActionable && coach ? (
    <Pressable
      key="coach-practice"
      onPress={startCoachPractice}
      style={({ pressed }) => [
        styles.missionRow,
        styles.missionRowBorder,
        styles.coachMissionRow,
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.missionIcon, { backgroundColor: "#12303A" }]}>
        <Sparkles size={17} color="#5EE0CE" strokeWidth={2} />
      </View>
      <View style={styles.missionBody}>
        <Text style={styles.missionTitle} numberOfLines={1}>
          {coach.suggestedMission.title}
        </Text>
        <Text style={styles.coachMissionSub} numberOfLines={1}>
          {coach.suggestedMission.subtitle}
        </Text>
      </View>
      <View style={styles.missionXpPill}>
        <Text style={styles.missionXpText}>
          +{coach.suggestedMission.xp} XP
        </Text>
      </View>
    </Pressable>
  ) : null;

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
          <View style={styles.greetingRight}>
            {coach && (
              <View style={styles.streakChip}>
                <Flame size={14} color={dq.gold} fill={dq.gold} />
                <Text style={styles.streakChipText}>{currentStreak}</Text>
              </View>
            )}
            <LinearGradient
              colors={[dq.green, dq.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.avatar, coach && styles.avatarSmall]}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </View>
        </View>

        {coach ? (
          /* ═══════════ G1 · Home With Coach ═══════════ */
          <>
            <CoachCard
              coach={coach}
              onFix={startCoachPractice}
              onInsights={openInsights}
            />

            {/* condensed streak + level cards */}
            <View style={styles.statCardsRow}>
              <View style={styles.statCard}>
                <Flame size={22} color={dq.gold} fill={dq.gold} />
                <View>
                  <Text style={styles.statCardValue}>
                    {currentStreak} day{currentStreak === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.statCardLabel}>STREAK</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <LevelRing pct={xpInLevel / XP_PER_LEVEL} />
                <View>
                  <Text style={styles.statCardValue}>Lv {level}</Text>
                  <Text style={styles.statCardLabel}>
                    {rankWord(profile?.title).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* ═══════════ B1 · classic streak hero ═══════════ */
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
                      style={[styles.dayLetter, isToday && { color: dq.gold }]}
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
                  <Text style={styles.rankText}>
                    {rankWord(profile?.title)}
                  </Text>
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
        )}

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
              {tasks.length > 0
                ? [
                    renderMissionRow(tasks[0], tasks.length === 1 && !coach),
                    coachMissionRow,
                    ...tasks
                      .slice(1)
                      .map((task, i) =>
                        renderMissionRow(task, i === tasks.length - 2),
                      ),
                  ]
                : coachMissionRow}
            </View>
          )}
        </View>

        {/* ── Explore (H1–H4 quick links) ── */}
        <View>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.exploreRow}>
            {EXPLORE_LINKS.map(({ route, label, Icon, bg, fg }) => (
              <AnimatedPressable
                key={route}
                style={styles.exploreCard}
                onPress={() => navigation.navigate(route)}
              >
                <View style={[styles.exploreIcon, { backgroundColor: bg }]}>
                  <Icon size={19} color={fg} strokeWidth={2.2} />
                </View>
                <Text style={styles.exploreLabel}>{label}</Text>
              </AnimatedPressable>
            ))}
          </View>
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
  greetingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  salaam: { fontSize: 14, fontFamily: "Nunito_700Bold", color: dq.muted },
  name: { fontSize: 24, fontFamily: "Nunito_900Black", color: dq.text },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dq.goldTint,
    borderWidth: 1.5,
    borderColor: dq.gold,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakChipText: { fontSize: 13, fontFamily: "Nunito_900Black", color: dq.gold },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: { fontSize: 18, fontFamily: "Nunito_900Black", color: dq.onGreen },

  // ── G1 coach card ──
  coachCard: {
    borderWidth: 1.5,
    borderColor: dq.green,
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    overflow: "hidden",
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: dq.green,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  coachTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coachTitle: { fontSize: 15.5, fontFamily: "Nunito_900Black", color: dq.text },
  aiChip: {
    backgroundColor: dq.greenTint,
    borderWidth: 1,
    borderColor: dq.green,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  aiChipText: {
    fontSize: 9,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
    letterSpacing: 1,
  },
  coachSubtitle: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 1,
  },
  coachChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  coachChevronText: {
    fontSize: 13,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    lineHeight: 16,
  },
  coachMsgBox: {
    backgroundColor: "rgba(11,21,23,0.55)",
    borderWidth: 1,
    borderColor: "#1E3E3B",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  coachMsg: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: "Nunito_700Bold",
    color: "#D7E7E5",
  },
  coachArabicA: {
    fontSize: 17,
    fontFamily: "Amiri_700Bold",
    color: "#5EE0CE",
  },
  coachArabicB: {
    fontSize: 17,
    fontFamily: "Amiri_700Bold",
    color: "#F79A59",
  },
  coachHighlight: { color: dq.text, fontFamily: "Nunito_800ExtraBold" },
  coachBtnRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },
  fixBtn: {
    backgroundColor: dq.green,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  fixBtnText: {
    fontSize: 12.5,
    fontFamily: "Nunito_900Black",
    color: dq.onGreen,
    letterSpacing: 0.7,
  },
  insightsBtn: {
    backgroundColor: dq.card,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  insightsBtnText: {
    fontSize: 12.5,
    fontFamily: "Nunito_900Black",
    color: dq.muted,
  },

  // condensed stat cards (G1)
  statCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: -6,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  statCardValue: {
    fontSize: 17,
    lineHeight: 19,
    fontFamily: "Nunito_900Black",
    color: dq.text,
  },
  statCardLabel: {
    fontSize: 10,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 0.6,
  },
  ringWrap: { width: 34, height: 34 },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: {
    fontSize: 8.5,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
  },

  // Hero card (B1)
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
  coachMissionRow: {
    backgroundColor: "rgba(94,224,206,0.04)",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  coachMissionSub: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: "#5EE0CE",
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

  // Explore quick links
  exploreRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  exploreCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 14,
  },
  exploreIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  exploreLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.muted,
  },
});
