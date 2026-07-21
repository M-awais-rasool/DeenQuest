import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { haptics } from "../../utils/haptics";
import { dq } from "../../theme/designTokens";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import {
  useGetRewardsQuery,
  type NewlyGrantedReward,
  type RewardWithStatus,
} from "../../store/services/api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearPendingRewardUnlocks } from "../../store/slices/mainSlice";
import { RewardIcon } from "./components/RewardIcon";
import { UnlockModal } from "./components/UnlockModal";

const TIERS = [
  {
    name: "Bronze",
    min: 0,
    gradient: ["#D9A06B", "#95602F"] as [string, string],
    iconColor: "#3A2008",
    glow: "rgba(217,160,107,0.18)",
  },
  {
    name: "Silver",
    min: 12,
    gradient: ["#C9D4D9", "#8FA0A8"] as [string, string],
    iconColor: "#3B4A52",
    glow: "rgba(201,212,217,0.18)",
  },
  {
    name: "Gold",
    min: 18,
    gradient: ["#F9DDA0", "#C98F35"] as [string, string],
    iconColor: "#3A2A08",
    glow: "rgba(239,182,90,0.22)",
  },
  {
    name: "Platinum",
    min: 24,
    gradient: ["#D9F0FC", "#6EC1E8"] as [string, string],
    iconColor: "#0E2A3A",
    glow: "rgba(110,193,232,0.2)",
  },
];

function tierInfo(unlocked: number, total: number) {
  const current =
    [...TIERS].reverse().find((t) => unlocked >= t.min) ?? TIERS[0];
  const next = TIERS.find((t) => t.min > unlocked);
  let hint: string;
  if (total > 0 && unlocked >= total) hint = "All badges unlocked";
  else if (next && next.min <= total)
    hint = `${next.min - unlocked} more to reach ${next.name}`;
  else hint = `${Math.max(total - unlocked, 0)} more to collect them all`;
  return { tier: current, hint };
}

function BadgeCell({
  reward,
  isNew,
  width,
  onPress,
}: {
  reward: RewardWithStatus;
  isNew: boolean;
  width: number;
  onPress?: () => void;
}) {
  const pct = Math.min(Math.max(reward.progress, 0), 1);
  const progressLabel =
    reward.required > 0
      ? `${reward.current} / ${reward.required}`
      : `${Math.round(pct * 100)}%`;

  return (
    <Pressable
      style={({ pressed }) => [
        s.cell,
        { width },
        !reward.unlocked && s.cellLocked,
        pressed && reward.unlocked && { opacity: 0.85 },
      ]}
      onPress={onPress}
      disabled={!reward.unlocked}
    >
      {isNew && (
        <View style={s.newTag}>
          <Text style={s.newTagText}>NEW</Text>
        </View>
      )}

      {reward.unlocked ? (
        <LinearGradient
          colors={[dq.gold, dq.goldDark]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[s.medal, isNew && s.medalGlow]}
        >
          <RewardIcon icon={reward.icon} color={dq.onGold} size={24} />
        </LinearGradient>
      ) : (
        <View style={s.medalLocked}>
          <RewardIcon icon={reward.icon} color="#5F7E7C" size={20} />
        </View>
      )}

      <Text
        style={[s.cellTitle, !reward.unlocked && { color: dq.muted }]}
        numberOfLines={2}
      >
        {reward.title}
      </Text>

      {reward.unlocked ? (
        <Text style={s.unlockedLabel}>UNLOCKED</Text>
      ) : (
        <>
          <View style={s.cellTrack}>
            <View style={[s.cellFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <Text style={s.cellProgressText}>{progressLabel}</Text>
        </>
      )}
    </Pressable>
  );
}

export function RewardsScreen() {
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const pendingUnlocks = useAppSelector((state) => state.main.pendingRewardUnlocks);

  const { data: rewardsRes, isLoading: rewardsLoading } = useGetRewardsQuery();

  const rewards: RewardWithStatus[] = rewardsRes?.data ?? [];

  const unlocked = rewards.filter((r) => r.unlocked).length;
  const total = rewards.length;
  const { tier, hint } = tierInfo(unlocked, total);

  // The most recently unlocked badge gets the "NEW" tag.
  const newest = useMemo(() => {
    const unlockedRewards = rewards.filter((r) => r.unlocked && r.unlocked_at);
    if (unlockedRewards.length === 0) return undefined;
    return [...unlockedRewards].sort((a, b) =>
      (b.unlocked_at ?? "").localeCompare(a.unlocked_at ?? ""),
    )[0];
  }, [rewards]);

  // grid cell width: screen − 2×22px padding − 2×14px gaps, split 3 ways
  const cellWidth = (width - 46 - 28) / 3;

  const [activeUnlock, setActiveUnlock] = useState<NewlyGrantedReward | null>(null);
  const popAnim = useRef(new Animated.Value(0.75)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0.5)).current;

  const openCelebration = useCallback(
    (reward: NewlyGrantedReward) => {
      setActiveUnlock(reward);
      haptics.success();
      popAnim.setValue(0.75);
      fadeAnim.setValue(0);
      ringAnim.setValue(0.5);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 130, useNativeDriver: true }),
        Animated.timing(ringAnim, {
          toValue: 1.35,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [fadeAnim, popAnim, ringAnim],
  );

  useEffect(() => {
    if (pendingUnlocks.length === 0 || activeUnlock) return;
    const toShow = pendingUnlocks[pendingUnlocks.length - 1];
    dispatch(clearPendingRewardUnlocks());
    openCelebration(toShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUnlocks]);

  const closeModal = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
      () => setActiveUnlock(null),
    );
  }, [fadeAnim]);

  const handleBadgePress = (reward: RewardWithStatus) => {
    openCelebration({
      id: reward.id,
      title: reward.title,
      description: reward.description,
      icon: reward.icon,
      rarity: reward.rarity,
      xp_bonus: reward.xp_bonus,
    });
  };

  return (
    <ScreenWrapper innerStyle={s.wrapper}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* tier header */}
        <View style={s.tierHeader}>
          <LinearGradient
            colors={tier.gradient}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[s.tierMedal, { shadowColor: tier.gradient[0] }]}
          >
            <Text style={[s.tierMedalIcon, { color: tier.iconColor }]}>✦</Text>
          </LinearGradient>
          <Text style={s.tierTitle}>{tier.name} Collector</Text>
          <Text style={s.tierSub}>
            {unlocked} / {total} badges unlocked
          </Text>
          <View style={s.hintChip}>
            <Text style={s.hintStar}>✦</Text>
            <Text style={s.hintText}>{hint}</Text>
          </View>
        </View>

        {/* badge grid */}
        {rewardsLoading ? (
          <Loader />
        ) : rewards.length === 0 ? (
          <Text style={s.empty}>No rewards found.</Text>
        ) : (
          <View style={s.grid}>
            {rewards.map((reward) => (
              <BadgeCell
                key={reward.id}
                reward={reward}
                isNew={reward.id === newest?.id}
                width={cellWidth}
                onPress={() => handleBadgePress(reward)}
              />
            ))}
          </View>
        )}
      </ScrollView>

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
  wrapper: { flex: 1 },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // tier header
  tierHeader: {
    alignItems: "center",
  },
  tierMedal: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  tierMedalIcon: {
    fontSize: 38,
    lineHeight: 46,
  },
  tierTitle: {
    fontSize: 22,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 14,
  },
  tierSub: {
    fontSize: 13.5,
    fontFamily: "Nunito_700Bold",
    color: dq.muted,
    marginTop: 3,
  },
  hintChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: dq.goldTint,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 12,
  },
  hintStar: { fontSize: 14, color: dq.gold },
  hintText: { fontSize: 12.5, fontFamily: "Nunito_800ExtraBold", color: dq.gold },

  // badge grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 26,
  },
  cell: {
    alignItems: "center",
    gap: 5,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  cellLocked: {
    backgroundColor: dq.lockFill,
    borderColor: dq.lockBorder,
  },
  newTag: {
    position: "absolute",
    top: -7,
    right: 10,
    backgroundColor: "#F27FB2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  newTagText: {
    fontSize: 9,
    fontFamily: "Nunito_900Black",
    color: "#3A1024",
    letterSpacing: 0.7,
  },
  medal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  medalGlow: {
    shadowColor: dq.gold,
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  medalLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: dq.card,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2C464C",
    alignItems: "center",
    justifyContent: "center",
  },
  cellTitle: {
    fontSize: 11.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
    textAlign: "center",
    lineHeight: 14,
  },
  unlockedLabel: {
    fontSize: 9,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.gold,
    letterSpacing: 1,
  },
  cellTrack: {
    alignSelf: "stretch",
    height: 6,
    borderRadius: 4,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  cellFill: { height: "100%", backgroundColor: dq.gold, borderRadius: 4 },
  cellProgressText: { fontSize: 9.5, fontFamily: "Nunito_700Bold", color: dq.faint },

  empty: { fontSize: 14, color: dq.muted, textAlign: "center", paddingTop: 24 },
});
