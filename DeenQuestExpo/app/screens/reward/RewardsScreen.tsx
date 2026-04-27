import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { Sparkles, Star } from "lucide-react-native";
import { theme } from "../../theme/themes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import {
  useGetRewardsQuery,
  useGetProgressQuery,
  type NewlyGrantedReward,
  type RewardWithStatus,
} from "../../store/services/api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearPendingRewardUnlocks } from "../../store/slices/mainSlice";
import { RewardCard } from "./components/RewardCard";
import { StatsHeader } from "./components/StatsHeader";
import { UnlockModal } from "./components/UnlockModal";

export function RewardsScreen() {
  const dispatch = useAppDispatch();
  const pendingUnlocks = useAppSelector(
    (state) => state.main.pendingRewardUnlocks,
  );

  const { data: rewardsRes, isLoading: rewardsLoading } = useGetRewardsQuery();
  const { data: progressRes } = useGetProgressQuery();

  const rewards: RewardWithStatus[] = rewardsRes?.data ?? [];
  const xp: number = progressRes?.data?.xp ?? 0;

  const [activeUnlock, setActiveUnlock] = useState<NewlyGrantedReward | null>(
    null,
  );
  const popAnim = useRef(new Animated.Value(0.75)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (pendingUnlocks.length === 0 || activeUnlock) return;
    const toShow = pendingUnlocks[pendingUnlocks.length - 1];
    dispatch(clearPendingRewardUnlocks());
    setActiveUnlock(toShow);
    Vibration.vibrate([0, 60, 40, 110]);
    popAnim.setValue(0.75);
    fadeAnim.setValue(0);
    ringAnim.setValue(0.5);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 6,
        tension: 130,
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim, {
        toValue: 1.35,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUnlocks]);

  const closeModal = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setActiveUnlock(null));
  }, [fadeAnim]);

  const renderItem = useCallback(
    ({ item, index }: { item: RewardWithStatus; index: number }) => (
      <RewardCard reward={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: RewardWithStatus) => item.id, []);

  const ListHeader = (
    <>
      <StatsHeader rewards={rewards} xp={xp} />
      <View style={s.sectionHeader}>
        <Sparkles size={18} color={theme.colors.secondary} />
        <Text style={s.sectionTitle}>Milestones</Text>
        <Text style={s.sectionCount}>
          {rewards.filter((r) => r.unlocked).length}/{rewards.length}
        </Text>
      </View>
    </>
  );

  const ListEmpty = rewardsLoading ? (
    <Loader />
  ) : (
    <View style={s.emptyWrap}>
      <Text style={s.emptyText}>No rewards found.</Text>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Rewards</Text>
        <View style={s.xpBadge}>
          <Star
            size={15}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
          <Text style={s.xpText}>{xp.toLocaleString()} XP</Text>
        </View>
      </View>

      <FlatList
        data={rewards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        removeClippedSubviews={false}
      />

      {activeUnlock && (
        <UnlockModal
          reward={activeUnlock}
          fadeAnim={fadeAnim}
          popAnim={popAnim}
          ringAnim={ringAnim}
          onClose={closeModal}
        />
      )}
    </ScreenWrapper>
  );
}


const s = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  topBarTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: theme.colors.text,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.outline20,
  },
  xpText: {
    color: theme.colors.secondary,
    fontWeight: "900",
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.secondary,
  },
  loadingWrap: {
    alignItems: "center",
    gap: 12,
    paddingTop: 40,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 32,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});
