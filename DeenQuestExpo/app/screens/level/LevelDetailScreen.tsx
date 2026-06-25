import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  Lock,
  ChevronRight,
  Star,
  Gamepad2,
  BookOpen,
  AudioLines,
  ScrollText,
  MoonStar,
  ListChecks,
  Heart,
  RotateCw,
  SignalLow,
  SignalMedium,
  SignalHigh,
  type LucideIcon,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { dq } from "../../theme/designTokens";
import {
  useGetLevelDetailQuery,
  type LessonType,
  type LevelDifficulty,
  type MiniGameType,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { FadeInView } from "../../components/level/lesson/shared";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "LevelDetail">;

/** Per-lesson-type palette from the mockup: accent, tinted node fill, on-accent text. */
type TypeMeta = { label: string; color: string; tint: string; onColor: string; Icon: LucideIcon };

const LESSON_TYPE_META: Record<LessonType, TypeMeta> = {
  qaida: { label: "LETTERS", color: "#88D982", tint: "rgba(136,217,130,0.14)", onColor: "#13351a", Icon: BookOpen },
  pronunciation: { label: "PRONUNCIATION", color: "#E5A77A", tint: "rgba(229,167,122,0.14)", onColor: "#3a1f0c", Icon: AudioLines },
  hadith: { label: "HADITH", color: "#FFDB3C", tint: "rgba(255,219,60,0.16)", onColor: "#3a2f06", Icon: ScrollText },
  dua: { label: "DUA", color: "#7FC8C0", tint: "rgba(127,200,192,0.14)", onColor: "#0e2b28", Icon: MoonStar },
  quiz: { label: "QUIZ", color: "#B59CE0", tint: "rgba(181,156,224,0.16)", onColor: "#241640", Icon: ListChecks },
  manners: { label: "MANNERS", color: "#E58FA8", tint: "rgba(229,143,168,0.16)", onColor: "#3a1622", Icon: Heart },
  revision: { label: "REVISION", color: "#8FB3E0", tint: "rgba(143,179,224,0.16)", onColor: "#16263a", Icon: RotateCw },
};

const DEFAULT_META: TypeMeta = {
  label: "LESSON",
  color: dq.green,
  tint: dq.trackGreenTint,
  onColor: dq.onGreenAlt,
  Icon: BookOpen,
};

const DIFFICULTY_META: Record<LevelDifficulty, { label: string; Icon: LucideIcon }> = {
  easy: { label: "BEGINNER", Icon: SignalLow },
  medium: { label: "INTERMEDIATE", Icon: SignalMedium },
  hard: { label: "ADVANCED", Icon: SignalHigh },
};

const MINI_GAME_TITLE: Record<MiniGameType, string> = {
  mcq: "Quiz Challenge",
  tap_match: "Tap Match",
  memory_cards: "Memory Match",
  drag_drop: "Build It",
  listen_choose: "Listen & Choose",
  repeat_voice: "Repeat Aloud",
};

/** XP isn't tracked per-lesson, so split the level reward evenly (rounded to 5). */
function perLessonXp(levelXp: number, total: number): number {
  if (total <= 0) return levelXp;
  return Math.max(5, Math.round(levelXp / total / 5) * 5);
}

export function LevelDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
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
  const lessonXp = perLessonXp(level.xp_reward, total);
  const diff = DIFFICULTY_META[level.difficulty] ?? DIFFICULTY_META.easy;
  const DiffIcon = diff.Icon;

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

  const miniGameTitle = MINI_GAME_TITLE[level.mini_game.type] ?? "Mini Game";

  return (
    <ScreenWrapper innerStyle={s.fill}>
      <View style={s.root}>
        <ScrollView
          style={s.fill}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#9be08f", "#4f9e54"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.hero}
          >
            <View style={s.heroTopRow}>
              <AnimatedPressable
                onPress={() => navigation.goBack()}
                style={s.backBtn}
                haptic="light"
              >
                <ArrowLeft size={19} color="#0e2a12" />
              </AnimatedPressable>
              <View style={s.diffPill}>
                <DiffIcon size={13} color="#0e2a12" />
                <Text style={s.diffText}>{diff.label}</Text>
              </View>
            </View>

            <FadeInView delay={60}>
              <Text style={s.levelBadge}>LEVEL {courseLevel}</Text>
              <Text style={s.levelTitle}>{level.title}</Text>
              <Text style={s.levelTheme}>{level.theme}</Text>

              <View style={s.goalPill}>
                <Star size={14} color="#0e2a12" fill="#0e2a12" />
                <Text style={s.goalText}>Earn {level.xp_reward} XP to complete</Text>
              </View>
            </FadeInView>
          </LinearGradient>

          {/* ── Body ─────────────────────────────────────────────── */}
          <View style={s.body}>
            {/* Progress */}
            <View style={s.progressBlock}>
              <View style={s.progressTop}>
                <Text style={s.progressLabel}>Lesson progress</Text>
                <Text style={s.progressCount}>
                  {done} / {total} lessons
                </Text>
              </View>
              <View style={s.progressTrack}>
                <LinearGradient
                  colors={[dq.greenDark, dq.green]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${pct}%` }]}
                />
              </View>
            </View>

            {/* Path */}
            <View>
              <Text style={s.pathHeading}>Your path</Text>
              <View style={s.path}>
                <View style={s.pathLine} />

                {level.lessons.map((lesson, index) => {
                  const status =
                    index < done ? "done" : index === done ? "current" : "locked";
                  const meta = LESSON_TYPE_META[lesson.type] ?? DEFAULT_META;
                  const TypeIcon = meta.Icon;
                  const locked = status === "locked";

                  return (
                    <FadeInView key={index} delay={index * 55} style={s.row}>
                      <AnimatedPressable
                        style={s.rowPress}
                        haptic="light"
                        onPress={() => startLesson(index)}
                        disabled={locked}
                      >
                        {/* node */}
                        <View
                          style={[
                            s.node,
                            status === "done" && { backgroundColor: meta.color },
                            status === "current" && {
                              backgroundColor: meta.tint,
                              borderColor: meta.color,
                              shadowColor: meta.color,
                            },
                            status === "current" && s.nodeGlow,
                            locked && { backgroundColor: meta.tint },
                          ]}
                        >
                          {status === "done" ? (
                            <Check size={19} color={meta.onColor} strokeWidth={3} />
                          ) : (
                            <TypeIcon size={19} color={meta.color} />
                          )}
                        </View>

                        {/* card */}
                        <View
                          style={[
                            s.card,
                            status === "current" && {
                              borderColor: hexToRgba(meta.color, 0.3),
                              shadowColor: meta.color,
                              shadowOpacity: 0.12,
                              shadowRadius: 14,
                              shadowOffset: { width: 0, height: 0 },
                            },
                          ]}
                        >
                          <View style={s.cardBody}>
                            <Text style={[s.typeLabel, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                            <Text
                              style={[s.lessonTitle, status === "current" && s.lessonTitleActive]}
                              numberOfLines={1}
                            >
                              {lesson.title}
                            </Text>
                            <Text
                              style={
                                status === "current"
                                  ? [s.lessonSub, { color: meta.color }]
                                  : s.lessonSubMuted
                              }
                            >
                              {status === "done"
                                ? `Done · +${lessonXp} XP`
                                : status === "current"
                                  ? `In progress · +${lessonXp} XP`
                                  : `+${lessonXp} XP`}
                            </Text>
                          </View>

                          {status === "current" ? (
                            <Play size={18} color={meta.color} fill={meta.color} />
                          ) : status === "locked" ? (
                            <Lock size={16} color={dq.chevron} />
                          ) : null}
                        </View>
                      </AnimatedPressable>
                    </FadeInView>
                  );
                })}

                {/* mini-game */}
                <FadeInView delay={total * 55} style={s.row}>
                  <AnimatedPressable
                    style={s.rowPress}
                    haptic="light"
                    onPress={startMiniGame}
                    disabled={!allLessonsDone}
                  >
                    <LinearGradient
                      colors={[dq.badgeGoldFrom, dq.badgeGoldTo]}
                      start={{ x: 0.32, y: 0.28 }}
                      end={{ x: 1, y: 1 }}
                      style={[s.node, s.nodeGame, !allLessonsDone && { opacity: 0.5 }]}
                    >
                      <Gamepad2 size={20} color={dq.onBadgeGold} />
                    </LinearGradient>

                    <LinearGradient
                      colors={["rgba(255,219,60,0.12)", "rgba(255,219,60,0.03)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[s.card, s.cardGame, !allLessonsDone && { opacity: 0.6 }]}
                    >
                      <View style={s.cardBody}>
                        <Text style={s.gameLabel}>MINI-GAME</Text>
                        <Text style={s.lessonTitleActive} numberOfLines={1}>
                          {miniGameTitle}
                        </Text>
                        <Text style={s.gameSub}>Bonus reward</Text>
                      </View>
                      {allLessonsDone ? (
                        <ChevronRight size={18} color={dq.gold} />
                      ) : (
                        <Lock size={16} color={dq.chevron} />
                      )}
                    </LinearGradient>
                  </AnimatedPressable>
                </FadeInView>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Sticky CTA ─────────────────────────────────────────── */}
        <LinearGradient
          colors={["rgba(22,22,22,0)", dq.screen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.4 }}
          style={[s.footer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}
        >
          <TactilePressable
            edgeColor="#2E7D32"
            faceUnderlayColor={dq.green}
            depth={4}
            radius={16}
            haptic="medium"
            faceStyle={s.cta}
            onPress={ctaAction}
          >
            <Text style={s.ctaText}>{ctaLabel}</Text>
            <ArrowRight size={18} color={dq.onGreen} />
          </TactilePressable>
        </LinearGradient>
      </View>
    </ScreenWrapper>
  );
}

/** #RRGGBB → rgba() with the given alpha (mockup borders are accent-at-30%). */
function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  root: { flex: 1, backgroundColor: dq.screen },
  scrollContent: { paddingBottom: 120 },

  // Hero
  hero: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(14,42,18,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  diffPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#0e2a12",
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.9,
    color: "rgba(14,42,18,0.7)",
  },
  levelTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#0e2a12",
    marginTop: 5,
  },
  levelTheme: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(14,42,18,0.82)",
    marginTop: 4,
  },
  goalPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    marginTop: 16,
    backgroundColor: "rgba(14,42,18,0.14)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },
  goalText: { fontSize: 12, fontWeight: "800", color: "#0e2a12" },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 20 },

  // Progress
  progressBlock: { gap: 9 },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: { fontSize: 13, fontWeight: "800", color: dq.text },
  progressCount: { fontSize: 12, fontWeight: "700", color: dq.muted },
  progressTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: dq.trackWhite06,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 99 },

  // Path
  pathHeading: { fontSize: 17, fontWeight: "800", color: dq.white, marginBottom: 14 },
  path: { position: "relative", gap: 12 },
  pathLine: {
    position: "absolute",
    left: 21,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: dq.trackWhite08,
  },
  row: {},
  rowPress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  node: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: dq.screen,
    zIndex: 1,
  },
  nodeGlow: {
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  nodeGame: {
    borderColor: dq.screen,
    shadowColor: dq.gold,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: dq.card,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: dq.cardBorder,
  },
  cardGame: {
    borderColor: dq.gold25,
  },
  cardBody: { flex: 1, gap: 2 },
  typeLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.45 },
  lessonTitle: { fontSize: 14, fontWeight: "800", color: dq.text },
  lessonTitleActive: { fontSize: 14, fontWeight: "800", color: dq.white },
  lessonSub: { fontSize: 11, fontWeight: "700" },
  lessonSubMuted: { fontSize: 11, fontWeight: "600", color: dq.muted },
  gameLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.45, color: dq.gold },
  gameSub: { fontSize: 11, fontWeight: "700", color: "#a99a6a" },

  // Sticky CTA
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    backgroundColor: dq.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: dq.green,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaText: { fontSize: 15, fontWeight: "900", letterSpacing: 0.6, color: dq.onGreen },
});
