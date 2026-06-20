import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AnimatedPressable } from "../../components/ui";
import { X } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { theme } from "../../theme/themes";
import {
  useGetLevelDetailQuery,
  useCompleteLevelMutation,
  useGetProgressQuery,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import  CourseCompletionScreen  from "../../components/level/lesson/CourseCompletionScreen";
import { TapMatchGame } from "../../components/level/lesson/TapMatchGame";
import { FallbackGame } from "../../components/level/lesson/FallbackGame";
import { MCQGame } from "../../components/level/lesson/MCQGame";
import { MemoryGame } from "../../components/level/lesson/MemoryGame";
import { BuildGame } from "../../components/level/lesson/BuildGame";
import { ListenGame } from "../../components/level/lesson/ListenGame";
import { LessonTelemetryProvider } from "../../components/level/lesson/shared";
import type { MiniGameType, NewlyGrantedReward } from "../../store/services/api";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "MiniGamePlayer">;

export function MiniGamePlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId, courseType } = route.params;

  const { data: res } = useGetLevelDetailQuery({ levelId, courseType });
  const { data: progressRes } = useGetProgressQuery();
  const level = res?.data;
  const [completeLevel] = useCompleteLevelMutation();
  const currentTotalXP = progressRes?.data?.xp ?? 0;

  const startTimeRef = useRef<number>(Date.now());

  const [completionResult, setCompletionResult] = useState<{
    xpEarned: number;
    accuracy: number;
    timeString: string;
    unlockReward?: string;
    treasureOpen?: boolean;
    newRewards?: NewlyGrantedReward[];
  } | null>(null);

  const handleFinish = useCallback(
    async (stats: { accuracy: number }) => {
      if (!level) return;
      const elapsedMs = Date.now() - startTimeRef.current;
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      try {
        const apiRes = await completeLevel({
          levelId: level.id,
          courseType: level.course_type ?? courseType,
        }).unwrap();
        setCompletionResult({
          xpEarned: apiRes.data?.xp_earned ?? level.xp_reward,
          accuracy: stats.accuracy,
          timeString,
          unlockReward: apiRes.data?.unlock_reward ?? level.unlock_reward,
          treasureOpen: apiRes.data?.treasure_open,
          newRewards: apiRes.data?.new_rewards ?? [],
        });
      } catch {
        setCompletionResult({
          xpEarned: level.xp_reward,
          accuracy: stats.accuracy,
          timeString,
          unlockReward: level.unlock_reward,
        });
      }
    },
    [courseType, level, completeLevel],
  );

  const handleContinue = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (!level) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  if (completionResult) {
    return (
      <ScreenWrapper innerStyle={{ flex: 1 }}>
        <CourseCompletionScreen
          xpEarned={completionResult.xpEarned}
          accuracy={completionResult.accuracy}
          timeString={completionResult.timeString}
          currentTotalXP={currentTotalXP}
          levelTitle={level.title}
          unlockReward={completionResult.unlockReward}
          treasureOpen={completionResult.treasureOpen}
          newRewards={completionResult.newRewards}
          onContinue={handleContinue}
        />
      </ScreenWrapper>
    );
  }

  const game = level.mini_game;
  const GAME_MAP: Partial<
    Record<MiniGameType, React.ComponentType<{ game: typeof game; onFinish: (s: { accuracy: number }) => void }>>
  > = {
    mcq: MCQGame,
    tap_match: TapMatchGame,
    memory_cards: MemoryGame,
    drag_drop: BuildGame,
    listen_choose: ListenGame,
  };
  const GameComponent = GAME_MAP[game.type] ?? FallbackGame;

  return (
    <ScreenWrapper>
      <View style={s.container}>
        <View style={s.topBar}>
          <AnimatedPressable
            onPress={() => {
              navigation.goBack();
            }}
            style={s.closeBtn}
          >
            <X size={22} color={theme.colors.text} />
          </AnimatedPressable>
          <Text style={s.topBarTitle}>MINI GAME</Text>
        </View>

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.gameTitle}>{game.description}</Text>
          <LessonTelemetryProvider
            value={{
              levelId: level.id,
              lessonIndex: level.lessons.length,
              courseType: level.course_type ?? courseType,
              skillTags: game.skill_tags,
            }}
          >
            <GameComponent game={game} onFinish={handleFinish} />
          </LessonTelemetryProvider>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: theme.colors.background },
  loadingContainer: { justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    color: theme.colors.secondary,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1.5,
  },
  devBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  devBtnText: {
    fontSize: 18,
  },
  scrollView: {},
  scrollContent: { padding: 20, paddingBottom: 40 },
  gameTitle: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 20,
    lineHeight: 26,
  },
});
