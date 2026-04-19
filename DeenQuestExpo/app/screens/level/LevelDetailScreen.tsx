import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  ArrowLeft,
  Star,
  Lock,
  CheckCircle2,
  PlayCircle,
  Gamepad2,
  Gift,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { theme } from "../../theme/themes";
import { useGetLevelDetailQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "LevelDetail">;

const LESSON_TYPE_ICON: Record<string, string> = {
  qaida: "📖",
  hadith: "🕌",
  dua: "🤲",
  quiz: "❓",
  pronunciation: "🗣️",
  manners: "🌟",
  revision: "📝",
};

export function LevelDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId } = route.params;

  const { data: res, isLoading } = useGetLevelDetailQuery(levelId);
  const level = res?.data;

  const handleStartLesson = useCallback(
    (lessonIndex: number) => {
      if (!level) return;
      navigation.navigate("LessonPlayer", {
        levelId: level.id,
        startLessonIndex: lessonIndex,
      });
    },
    [level, navigation],
  );

  const handleStartMiniGame = useCallback(() => {
    if (!level) return;
    navigation.navigate("MiniGamePlayer", { levelId: level.id });
  }, [level, navigation]);

  if (isLoading || !level) {
    return (
      <ScreenWrapper>
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>Loading level...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const allLessonsDone = level.lessons_complete >= level.lessons.length;
  const isTreasureLevel = level.id % 5 === 0;

  return (
    <ScreenWrapper>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
          >
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={s.headerInfo}>
            <Text style={s.levelBadge}>LEVEL {level.id}</Text>
            <Text style={s.levelTitle}>{level.title}</Text>
          </View>
        </View>

        {/* Theme & Goal card */}
        <View style={s.goalCard}>
          <Text style={s.goalTheme}>{level.theme}</Text>
          <Text style={s.goalText}>{level.goal}</Text>
          <View style={s.goalMeta}>
            <View style={s.metaBadge}>
              <Star size={12} color={theme.colors.secondary} />
              <Text style={s.metaText}>+{level.xp_reward} XP</Text>
            </View>
            <View
              style={[
                s.difficultyBadge,
                {
                  backgroundColor:
                    level.difficulty === "easy"
                      ? "rgba(136,217,130,0.15)"
                      : level.difficulty === "medium"
                        ? "rgba(255,219,60,0.15)"
                        : "rgba(255,138,101,0.15)",
                },
              ]}
            >
              <Text
                style={[
                  s.difficultyText,
                  {
                    color:
                      level.difficulty === "easy"
                        ? theme.colors.primary
                        : level.difficulty === "medium"
                          ? theme.colors.secondary
                          : "#FF8A65",
                  },
                ]}
              >
                {level.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Lessons list */}
        <Text style={s.sectionTitle}>
          LESSONS ({level.lessons_complete}/{level.lessons.length})
        </Text>
        {level.lessons.map((lesson, index) => {
          const isDone = index < level.lessons_complete;
          const isCurrent = index === level.lessons_complete;
          const isLocked = index > level.lessons_complete;

          return (
            <TouchableOpacity
              key={index}
              style={[
                s.lessonCard,
                isDone && s.lessonDone,
                isCurrent && s.lessonCurrent,
                isLocked && s.lessonLocked,
              ]}
              onPress={() => handleStartLesson(index)}
              disabled={isLocked}
              activeOpacity={0.7}
            >
              <View style={s.lessonLeft}>
                <Text style={s.lessonIcon}>
                  {LESSON_TYPE_ICON[lesson.type] ?? "📘"}
                </Text>
                <View style={s.lessonInfo}>
                  <Text style={[s.lessonTitle, isLocked && s.lessonTextLocked]}>
                    {lesson.title}
                  </Text>
                  <Text
                    style={[s.lessonDesc, isLocked && s.lessonTextLocked]}
                    numberOfLines={1}
                  >
                    {lesson.description}
                  </Text>
                </View>
              </View>
              <View style={s.lessonRight}>
                {isDone ? (
                  <CheckCircle2 size={22} color={theme.colors.primary} />
                ) : isCurrent ? (
                  <PlayCircle size={22} color={theme.colors.primary} />
                ) : (
                  <Lock size={18} color={theme.colors.textMuted} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Mini Game */}
        <Text style={s.sectionTitle}>MINI GAME</Text>
        <TouchableOpacity
          style={[s.miniGameCard, !allLessonsDone && s.miniGameLocked]}
          onPress={handleStartMiniGame}
          disabled={!allLessonsDone}
          activeOpacity={0.7}
        >
          <View style={s.miniGameLeft}>
            <Gamepad2
              size={28}
              color={
                allLessonsDone ? theme.colors.secondary : theme.colors.textMuted
              }
            />
            <View style={s.miniGameInfo}>
              <Text
                style={[s.miniGameType, !allLessonsDone && s.lessonTextLocked]}
              >
                {level.mini_game.type.replace(/_/g, " ").toUpperCase()}
              </Text>
              <Text
                style={[s.miniGameDesc, !allLessonsDone && s.lessonTextLocked]}
                numberOfLines={2}
              >
                {level.mini_game.description}
              </Text>
            </View>
          </View>
          {!allLessonsDone ? (
            <Lock size={18} color={theme.colors.textMuted} />
          ) : (
            <PlayCircle size={22} color={theme.colors.secondary} />
          )}
        </TouchableOpacity>

        {/* Treasure indicator */}
        {isTreasureLevel && (
          <View style={s.treasureCard}>
            <Gift size={24} color={theme.colors.secondary} />
            <Text style={s.treasureText}>
              Treasure Chest awaits at completion!
            </Text>
          </View>
        )}

        {/* Reward preview */}
        <View style={s.rewardPreview}>
          <Text style={s.rewardLabel}>UNLOCK REWARD</Text>
          <Text style={s.rewardValue}>{level.unlock_reward}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: theme.colors.textMuted, fontSize: 16 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: { flex: 1 },
  levelBadge: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  levelTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },

  // Goal card
  goalCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  goalTheme: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  goalText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  goalMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,219,60,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaText: {
    color: theme.colors.secondary,
    fontWeight: "800",
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  difficultyText: {
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Section
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },

  // Lesson card
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  lessonDone: {
    borderColor: "rgba(136,217,130,0.3)",
    backgroundColor: "rgba(136,217,130,0.05)",
  },
  lessonCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  lessonLocked: {
    opacity: 0.5,
  },
  lessonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  lessonIcon: { fontSize: 24 },
  lessonInfo: { flex: 1 },
  lessonTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  lessonDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  lessonTextLocked: { color: theme.colors.textMuted },
  lessonRight: { marginLeft: 8 },

  // Mini game card
  miniGameCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,219,60,0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,219,60,0.2)",
  },
  miniGameLocked: { opacity: 0.5 },
  miniGameLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  miniGameInfo: { flex: 1 },
  miniGameType: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  miniGameDesc: {
    color: theme.colors.text,
    fontSize: 13,
    marginTop: 4,
  },

  // Treasure
  treasureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "rgba(255,219,60,0.1)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,219,60,0.25)",
  },
  treasureText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "700",
  },

  // Reward preview
  rewardPreview: {
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  rewardLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  rewardValue: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});
