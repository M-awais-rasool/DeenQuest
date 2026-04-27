import React, { useState, useCallback, useRef, useEffect } from "react";
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
import { theme } from "../../theme/themes";
import {
  useGetLevelDetailQuery,
  useCompleteLevelMutation,
  type NewlyGrantedReward,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { MCQGame } from "./components/MCQGame";
import { TapMatchGame } from "./components/TapMatchGame";
import { FallbackGame } from "./components/FallbackGame";
import { CompletionScreen } from "./components/CompletionScreen";
import { RewardCelebrationModal } from "./components/RewardCelebrationModal";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "MiniGamePlayer">;

export function MiniGamePlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId } = route.params;

  const { data: res } = useGetLevelDetailQuery(levelId);
  const level = res?.data;
  const [completeLevel] = useCompleteLevelMutation();

  const [result, setResult] = useState<{
    stars: number;
    xpEarned: number;
    rewards: NewlyGrantedReward[];
  } | null>(null);
  const [rewardQueueIdx, setRewardQueueIdx] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const rewardTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const handleFinish = useCallback(
    async (stars: number) => {
      if (!level) return;
      try {
        const apiRes = await completeLevel({
          levelId: level.id,
          stars,
        }).unwrap();
        const rewards = apiRes.data?.new_rewards ?? [];
        setResult({
          stars,
          xpEarned: apiRes.data?.xp_earned ?? level.xp_reward,
          rewards,
        });
      } catch {
        setResult({ stars, xpEarned: level.xp_reward, rewards: [] });
      }
    },
    [level, completeLevel],
  );


  useEffect(() => () => clearTimeout(rewardTimerRef.current), []);

  const handleClaimReward = useCallback(() => {
    clearTimeout(rewardTimerRef.current);
    setShowRewardModal(true);
  }, []);

  const handleRewardDismiss = useCallback(() => {
    setShowRewardModal(false);
    const nextIdx = rewardQueueIdx + 1;
    if (result && nextIdx < result.rewards.length) {
      rewardTimerRef.current = setTimeout(() => {
        setRewardQueueIdx(nextIdx);
        setShowRewardModal(true);
      }, 350);
    }
  }, [rewardQueueIdx, result]);

  const handleDone = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (!level) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  if (result) {
    return (
      <ScreenWrapper>
        <CompletionScreen
          stars={result.stars}
          xpEarned={result.xpEarned}
          hasRewards={result.rewards.length > 0}
          onDone={handleDone}
          onClaimReward={handleClaimReward}
        />
        <RewardCelebrationModal
          reward={result.rewards[rewardQueueIdx] ?? null}
          visible={showRewardModal}
          onDismiss={handleRewardDismiss}
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
            onPress={() => navigation.goBack()}
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
