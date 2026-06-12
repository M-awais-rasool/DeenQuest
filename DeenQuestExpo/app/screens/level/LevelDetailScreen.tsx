import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import {
  ArrowLeft,
  Check,
  Lock,
  Play,
  Gamepad2,
  Gift,
  Star,
  Trophy,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { theme } from "../../theme/themes";
import { useGetLevelDetailQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { FadeInView } from "../../components/level/lesson/shared";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "LevelDetail">;

type TypeMeta = { icon: string; label: string; color: string; tint: string };

const LESSON_TYPE_META: Record<string, TypeMeta> = {
  qaida: { icon: "📖", label: "Letters", color: theme.colors.primary, tint: theme.colors.primary12 },
  hadith: { icon: "🕌", label: "Hadith", color: theme.colors.cyan, tint: "rgba(79,195,247,0.12)" },
  dua: { icon: "🤲", label: "Dua", color: theme.colors.secondary, tint: theme.colors.secondary12 },
  quiz: { icon: "❓", label: "Quiz", color: theme.colors.lavender, tint: "rgba(179,157,219,0.14)" },
  pronunciation: { icon: "🗣️", label: "Pronunciation", color: theme.colors.primary, tint: theme.colors.primary12 },
  manners: { icon: "🌟", label: "Manners", color: theme.colors.secondary, tint: theme.colors.secondary12 },
  revision: { icon: "📝", label: "Revision", color: theme.colors.warning, tint: theme.colors.warning15 },
};

const DIFFICULTY_META: Record<string, { color: string; tint: string }> = {
  easy: { color: theme.colors.primary, tint: theme.colors.primary15 },
  medium: { color: theme.colors.secondary, tint: theme.colors.secondary15 },
  hard: { color: theme.colors.warning, tint: theme.colors.warning15 },
};

export function LevelDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId, courseType } = route.params;

  const { data: res, isLoading } = useGetLevelDetailQuery({ levelId, courseType });
  const level = res?.data;

  const startLesson = useCallback(
    (lessonIndex: number) => {
      if (!level) return;
      navigation.navigate("LessonPlayer", {
        levelId: level.id,
        startLessonIndex: lessonIndex,
        courseType: level.course_type ?? courseType,
      });
    },
    [courseType, level, navigation],
  );

  const startMiniGame = useCallback(() => {
    if (!level) return;
    navigation.navigate("MiniGamePlayer", {
      levelId: level.id,
      courseType: level.course_type ?? courseType,
    });
  }, [courseType, level, navigation]);

  if (isLoading || !level) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  const total = level.lessons.length;
  const done = level.lessons_complete;
  const allLessonsDone = done >= total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const courseLevel = level.course_level || level.id;
  const isTreasureLevel = courseLevel % 5 === 0;
  const diff = DIFFICULTY_META[level.difficulty] ?? DIFFICULTY_META.easy;

  // Primary CTA
  let ctaLabel = "START LEVEL";
  let ctaAction = () => startLesson(0);
  if (level.status === "completed") {
    ctaLabel = "REPLAY LEVEL";
    ctaAction = () => startLesson(0);
  } else if (allLessonsDone) {
    ctaLabel = "PLAY MINI-GAME";
    ctaAction = startMiniGame;
  } else if (done > 0) {
    ctaLabel = "CONTINUE";
    ctaAction = () => startLesson(done);
  }

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.root}>
        <ScrollView
          style={s.container}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#235021", "#18301a", theme.colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={s.hero}
          >
            <View style={s.heroTopRow}>
              <AnimatedPressable
                onPress={() => {
                  navigation.goBack();
                }}
                style={s.backBtn}
                activeOpacity={0.8}
              >
                <ArrowLeft size={20} color={theme.colors.white} />
              </AnimatedPressable>
              <View style={[s.diffPill, { backgroundColor: diff.tint }]}>
                <Text style={[s.diffText, { color: diff.color }]}>
                  {level.difficulty.toUpperCase()}
                </Text>
              </View>
            </View>

            <FadeInView delay={60}>
              <Text style={s.levelBadge}>LEVEL {courseLevel}</Text>
              <Text style={s.levelTitle}>{level.title}</Text>
              <Text style={s.levelTheme}>{level.theme}</Text>

              <View style={s.goalRow}>
                <View style={s.xpPill}>
                  <Star size={13} color={theme.colors.secondary} fill={theme.colors.secondary} />
                  <Text style={s.xpText}>+{level.xp_reward} XP</Text>
                </View>
                <Text style={s.goalText} numberOfLines={2}>
                  {level.goal}
                </Text>
              </View>

              {/* Progress */}
              <View style={s.progressBlock}>
                <View style={s.segmentRow}>
                  {level.lessons.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.segment,
                        i < done ? s.segmentDone : s.segmentTodo,
                      ]}
                    />
                  ))}
                </View>
                <Text style={s.progressLabel}>
                  {done}/{total} lessons · {pct}%
                </Text>
              </View>
            </FadeInView>
          </LinearGradient>

          {/* ── Lesson path ──────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>YOUR PATH</Text>

            <View style={s.path}>
              {level.lessons.map((lesson, index) => {
                const status =
                  index < done ? "done" : index === done ? "current" : "locked";
                const meta = LESSON_TYPE_META[lesson.type] ?? {
                  icon: "📘",
                  label: lesson.type,
                  color: theme.colors.primary,
                  tint: theme.colors.primary12,
                };
                const locked = status === "locked";
                const prevDone = index <= done;

                return (
                  <View key={index}>
                    {index > 0 && (
                      <View
                        style={[
                          s.connector,
                          prevDone ? s.connectorDone : s.connectorIdle,
                        ]}
                      />
                    )}
                    <FadeInView delay={index * 60}>
                      <TactilePressable
                        edgeColor={
                          status === "current"
                            ? theme.colors.primary
                            : status === "done"
                              ? theme.colors.primary30
                              : theme.colors.outline
                        }
                        depth={3}
                        radius={18}
                        haptic="light"
                        dimWhenDisabled={false}
                        faceStyle={[
                          s.lessonRow,
                          status === "current" && s.lessonRowCurrent,
                          status === "done" && s.lessonRowDone,
                          locked && s.lessonRowLocked,
                        ]}
                        onPress={() => startLesson(index)}
                        disabled={locked}
                      >
                        <View
                          style={[
                            s.node,
                            status === "done" && s.nodeDone,
                            status === "current" && s.nodeCurrent,
                            locked && s.nodeLocked,
                          ]}
                        >
                          {status === "done" ? (
                            <Check size={20} color={theme.colors.onPrimary} strokeWidth={3} />
                          ) : status === "current" ? (
                            <Play size={18} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
                          ) : (
                            <Lock size={16} color={theme.colors.textMuted} />
                          )}
                        </View>

                        <View style={s.lessonBody}>
                          <View
                            style={[s.typeChip, { backgroundColor: meta.tint }]}
                          >
                            <Text style={s.typeIcon}>{meta.icon}</Text>
                            <Text style={[s.typeLabel, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                          <Text
                            style={[s.lessonTitle, locked && s.mutedText]}
                            numberOfLines={1}
                          >
                            {lesson.title}
                          </Text>
                          <Text
                            style={[s.lessonDesc, locked && s.mutedText]}
                            numberOfLines={2}
                          >
                            {lesson.description}
                          </Text>
                        </View>
                      </TactilePressable>
                    </FadeInView>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Mini game ────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>FINAL CHALLENGE</Text>
            <FadeInView>
              <TactilePressable
                edgeColor={theme.colors.secondary20}
                depth={3}
                radius={18}
                haptic="light"
                dimWhenDisabled={false}
                faceStyle={[s.miniGame, !allLessonsDone && s.miniGameLocked]}
                onPress={startMiniGame}
                disabled={!allLessonsDone}
              >
                <View style={s.miniGameIcon}>
                  <Gamepad2
                    size={26}
                    color={allLessonsDone ? theme.colors.secondary : theme.colors.textMuted}
                  />
                </View>
                <View style={s.lessonBody}>
                  <Text style={[s.miniGameType, !allLessonsDone && s.mutedText]}>
                    MINI GAME
                  </Text>
                  <Text
                    style={[s.miniGameDesc, !allLessonsDone && s.mutedText]}
                    numberOfLines={2}
                  >
                    {level.mini_game.description}
                  </Text>
                </View>
                {allLessonsDone ? (
                  <Play size={20} color={theme.colors.secondary} fill={theme.colors.secondary} />
                ) : (
                  <Lock size={16} color={theme.colors.textMuted} />
                )}
              </TactilePressable>
            </FadeInView>
          </View>

          {/* ── Treasure + reward ────────────────────────────────── */}
          <View style={s.section}>
            {isTreasureLevel && (
              <FadeInView style={s.treasure}>
                <Gift size={22} color={theme.colors.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.treasureTitle}>Treasure Chest</Text>
                  <Text style={s.treasureText}>
                    A special reward unlocks when you finish this level
                  </Text>
                </View>
              </FadeInView>
            )}

            <FadeInView style={s.reward} delay={80}>
              <View style={s.rewardIcon}>
                <Trophy size={20} color={theme.colors.secondary} fill={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rewardLabel}>UNLOCK REWARD</Text>
                <Text style={s.rewardValue}>{formatReward(level.unlock_reward)}</Text>
              </View>
            </FadeInView>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Sticky CTA ─────────────────────────────────────────── */}
        <View style={s.footer}>
          <TactilePressable
            edgeColor={theme.colors.primaryContainer}
            depth={5}
            radius={18}
            haptic="medium"
            faceStyle={s.cta}
            onPress={ctaAction}
          >
            <Text style={s.ctaText}>{ctaLabel}</Text>
          </TactilePressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

/** Turns "badge:first_step" / "title:word_builder" into "First Step" */
function formatReward(raw: string): string {
  const value = raw.includes(":") ? raw.split(":")[1] : raw;
  return value
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 24 },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.white10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.white20,
  },
  diffPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  diffText: { fontWeight: "900", fontSize: 11, letterSpacing: 0.5 },
  levelBadge: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  levelTitle: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  levelTheme: {
    color: theme.colors.white70,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.black20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  xpText: { color: theme.colors.secondary, fontWeight: "900", fontSize: 13 },
  goalText: {
    flex: 1,
    color: theme.colors.white70,
    fontSize: 12,
    lineHeight: 17,
  },
  progressBlock: { marginTop: 20 },
  segmentRow: { flexDirection: "row", gap: 5 },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  segmentDone: { backgroundColor: theme.colors.secondary },
  segmentTodo: { backgroundColor: theme.colors.white10 },
  progressLabel: {
    color: theme.colors.white70,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  // Path
  path: {},
  connector: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginLeft: 34, // aligns under the 44px node center (row padding 14 + node radius 22)
  },
  connectorDone: { backgroundColor: theme.colors.primary50 },
  connectorIdle: { backgroundColor: theme.colors.outline },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  lessonRowDone: {
    borderColor: theme.colors.primary30,
    backgroundColor: theme.colors.primary05,
  },
  lessonRowCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primary08,
  },
  lessonRowLocked: { opacity: 0.55 },
  node: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceHigh,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  nodeDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  nodeCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary90,
  },
  nodeLocked: { backgroundColor: theme.colors.surfaceLow },
  lessonBody: { flex: 1, gap: 4 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeIcon: { fontSize: 11 },
  typeLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  lessonTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  lessonDesc: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 16 },
  mutedText: { color: theme.colors.textMuted },

  // Mini game
  miniGame: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.colors.secondary08,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.secondary20,
  },
  miniGameLocked: { opacity: 0.55 },
  miniGameIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary10,
    justifyContent: "center",
    alignItems: "center",
  },
  miniGameType: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  miniGameDesc: { color: theme.colors.text, fontSize: 13, lineHeight: 18 },

  // Treasure / reward
  treasure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.secondary10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.secondary25,
    marginBottom: 12,
  },
  treasureTitle: { color: theme.colors.secondary, fontSize: 14, fontWeight: "900" },
  treasureText: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  reward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary10,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  rewardValue: {
    color: theme.colors.secondary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
  },
  ctaText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
