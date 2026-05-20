import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { X } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { haptics } from "../../utils/haptics";
import { theme } from "../../theme/themes";
import {
  useGetLevelDetailQuery,
  useCompleteLevelMutation,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { CourseCompletionScreen } from "../../components/level/lesson/CourseCompletionScreen";
import { TapMatchGame } from "../../components/level/lesson/TapMatchGame";
import { FallbackGame } from "../../components/level/lesson/FallbackGame";
import { MCQGame } from "../../components/level/lesson/MCQGame";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "MiniGamePlayer">;

export function MiniGamePlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId, courseType } = route.params;

  const { data: res } = useGetLevelDetailQuery({ levelId, courseType });
  const level = res?.data;
  const [completeLevel] = useCompleteLevelMutation();

  const [completionResult, setCompletionResult] = useState<{
    xpEarned: number;
  } | null>(null);

  const handleFinish = useCallback(
    async () => {
      if (!level) return;
      try {
        const apiRes = await completeLevel({
          levelId: level.id,
          courseType: level.course_type ?? courseType,
        }).unwrap();
        setCompletionResult({
          xpEarned: apiRes.data?.xp_earned ?? level.xp_reward,
        });
      } catch {
        setCompletionResult({ xpEarned: level.xp_reward });
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
          onContinue={handleContinue}
        />
      </ScreenWrapper>
    );
  }

  const game = level.mini_game;
  const GameComponent =
    game.type === "mcq"
      ? MCQGame
      : game.type === "tap_match"
        ? TapMatchGame
        : FallbackGame;

  return (
    <ScreenWrapper>
      <View style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
            style={s.closeBtn}
          >
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>MINI GAME</Text>
        </View>

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.gameTitle}>{game.description}</Text>
          <GameComponent game={game} onFinish={handleFinish} />
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
