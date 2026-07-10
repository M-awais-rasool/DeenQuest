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
  qaida: { label: "LETTERS", color: "#5EE0CE", tint: "#123B34", onColor: "#06302B", Icon: BookOpen },
  pronunciation: { label: "PRONUNCIATION", color: "#F79A59", tint: "#3D2A14", onColor: "#3A2A08", Icon: AudioLines },
  hadith: { label: "HADITH", color: "#EFB65A", tint: "#3A2F16", onColor: "#3A2A08", Icon: ScrollText },
  dua: { label: "DUA", color: "#2CC9B5", tint: "#123B34", onColor: "#06302B", Icon: MoonStar },
  quiz: { label: "QUIZ", color: "#C4B2FF", tint: "#2A2440", onColor: "#241A45", Icon: ListChecks },
  manners: { label: "MANNERS", color: "#F27FB2", tint: "#3A2030", onColor: "#3A1024", Icon: Heart },
  revision: { label: "REVISION", color: "#6EC1E8", tint: "#16303E", onColor: "#0E2A3A", Icon: RotateCw },
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
          {/* ── Header row ──────────────────────────────────────── */}
          <View style={s.headerRow}>
            <AnimatedPressable
              onPress={() => navigation.goBack()}
              style={s.backBtn}
              haptic="light"
            >
              <ArrowLeft size={18} color={dq.text} strokeWidth={2.5} />
            </AnimatedPressable>
          </View>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#123B34", "#16272B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={s.hero}
          >
            <FadeInView delay={60}>
              <View style={s.heroPills}>
                <View style={s.diffPill}>
                  <DiffIcon size={13} color="#5EE0CE" />
                  <Text style={s.diffText}>{diff.label}</Text>
                </View>
                <View style={s.goalPill}>
                  <Star size={13} color={dq.gold} fill={dq.gold} />
                  <Text style={s.goalText}>+{level.xp_reward} XP</Text>
                </View>
              </View>
              <Text style={s.levelTitle}>
                Level {courseLevel} · {level.title}
              </Text>
              <Text style={s.levelTheme}>{level.theme}</Text>

              {/* Progress lives inside the hero card (C2 mock) */}
              <View style={s.progressBlock}>
                <Text style={s.progressCount}>
                  {done} / {total} lessons
                </Text>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${pct}%` }]} />
                </View>
              </View>
            </FadeInView>
          </LinearGradient>

          {/* ── Body ─────────────────────────────────────────────── */}
          <View style={s.body}>
            {/* Path */}
            <View>
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
                            status === "done" && s.nodeDone,
                            status === "current" && s.nodeCurrent,
                            locked && s.nodeLocked,
                          ]}
                        >
                          {status === "done" ? (
                            <Check size={19} color={dq.onGreen} strokeWidth={3.5} />
                          ) : status === "current" ? (
                            <Play size={17} color="#3A2A08" fill="#3A2A08" />
                          ) : (
                            <Lock size={17} color={dq.faint} />
                          )}
                        </View>

                        {/* card */}
                        <View
                          style={[
                            s.card,
                            status === "current" && s.cardCurrent,
                            locked && s.cardLocked,
                          ]}
                        >
                          <View style={s.cardBody}>
                            <View
                              style={[s.typeChip, { backgroundColor: meta.tint }]}
                            >
                              <Text style={[s.typeLabel, { color: meta.color }]}>
                                {meta.label}
                              </Text>
                            </View>
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

                          <Text
                            style={[
                              s.xpTag,
                              status === "current" && { color: dq.gold },
                            ]}
                          >
                            +{lessonXp}
                          </Text>
                        </View>
                      </AnimatedPressable>
                    </FadeInView>
                  );
                })}

                {/* mini-game */}
                <FadeInView delay={total * 55} style={s.row}>
                  <AnimatedPressable
                    style={[s.rowPress, !allLessonsDone && { opacity: 0.6 }]}
                    haptic="light"
                    onPress={startMiniGame}
                    disabled={!allLessonsDone}
                  >
                    <LinearGradient
                      colors={["#2A2440", "#1C1636"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={[s.node, s.nodeGame]}
                    >
                      <Gamepad2 size={20} color="#A78BFA" />
                    </LinearGradient>

                    <LinearGradient
                      colors={["#1C1636", "#16272B"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[s.card, s.cardGame]}
                    >
                      <View style={s.cardBody}>
                        <Text style={s.gameLabel}>MINI-GAME FINALE</Text>
                        <Text style={s.lessonTitleActive} numberOfLines={1}>
                          {miniGameTitle}
                        </Text>
                        <Text style={s.gameSub}>
                          {allLessonsDone
                            ? "Bonus reward"
                            : "Unlocks when all lessons are done"}
                        </Text>
                      </View>
                      {allLessonsDone ? (
                        <ChevronRight size={18} color="#A78BFA" />
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
          colors={["rgba(11,21,23,0)", dq.screen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.4 }}
          style={[s.footer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}
        >
          <TactilePressable
            edgeColor={dq.greenDark}
            faceUnderlayColor={dq.green}
            depth={5}
            radius={18}
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

  // Header
  headerRow: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero
  hero: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1F5148",
  },
  heroPills: {
    flexDirection: "row",
    gap: 8,
  },
  diffPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#123B34",
    borderWidth: 1,
    borderColor: "#2CC9B5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  diffText: {
    fontSize: 10.5,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.8,
    color: "#5EE0CE",
  },
  goalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3A2F16",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  goalText: {
    fontSize: 10.5,
    fontFamily: "Nunito_900Black",
    color: dq.gold,
  },
  levelTitle: {
    fontSize: 24,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 12,
  },
  levelTheme: {
    fontSize: 13.5,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 4,
  },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 20 },

  // Progress
  progressBlock: { marginTop: 16, gap: 7 },
  progressCount: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: dq.green,
  },

  // Path
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
    zIndex: 1,
  },
  nodeDone: {
    backgroundColor: dq.green,
  },
  nodeCurrent: {
    backgroundColor: dq.gold,
    shadowColor: dq.goldDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nodeLocked: {
    backgroundColor: dq.lockFill,
    borderWidth: 2.5,
    borderColor: dq.lockBorder,
  },
  nodeGame: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#3B2F6B",
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: dq.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: dq.cardBorder,
  },
  cardCurrent: {
    borderWidth: 1.5,
    borderColor: dq.gold,
  },
  cardLocked: {
    backgroundColor: dq.lockFill,
    borderColor: dq.lockBorder,
    opacity: 0.75,
  },
  cardGame: {
    borderColor: "#3B2F6B",
  },
  cardBody: { flex: 1, gap: 5, alignItems: "flex-start" },
  typeChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeLabel: { fontSize: 10, fontFamily: "Nunito_900Black", letterSpacing: 0.8 },
  lessonTitle: { fontSize: 14.5, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  lessonTitleActive: { fontSize: 14.5, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  lessonSub: { fontSize: 11, fontFamily: "Nunito_700Bold" },
  lessonSubMuted: { fontSize: 11, fontFamily: "Nunito_600SemiBold", color: dq.muted },
  xpTag: { fontSize: 11, fontFamily: "Nunito_800ExtraBold", color: dq.faint },
  gameLabel: {
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1,
    color: "#A78BFA",
  },
  gameSub: { fontSize: 11.5, fontFamily: "Nunito_600SemiBold", color: dq.faint },

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
    height: 56,
    borderRadius: 18,
    backgroundColor: dq.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 16, fontFamily: "Nunito_900Black", letterSpacing: 1.2, color: dq.onGreen },
});
