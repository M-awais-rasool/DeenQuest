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
import Svg, { Circle } from "react-native-svg";
import { ChevronRight, Lock, Medal, Sparkles } from "lucide-react-native";
import { haptics } from "../../utils/haptics";
import { dq } from "../../theme/designTokens";
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
import { RewardIcon } from "./components/RewardIcon";
import { UnlockModal } from "./components/UnlockModal";

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 12 },
  { name: "Gold", min: 18 },
  { name: "Platinum", min: 24 },
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
  return { tier: current.name, hint };
}

/** A circular gold medallion used for unlocked badges. */
function GoldCircle({
  size,
  children,
  style,
}: {
  size: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <LinearGradient
      colors={[dq.badgeGoldFrom, dq.badgeGoldTo]}
      start={{ x: 0.3, y: 0.28 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

function ProgressRing({ pct, count, total }: { pct: number; count: number; total: number }) {
  const r = 39;
  const c = 2 * Math.PI * r;
  return (
    <View style={s.ringWrap}>
      <Svg width={92} height={92} viewBox="0 0 92 92">
        <Circle cx={46} cy={46} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={9} fill="none" />
        <Circle
          cx={46}
          cy={46}
          r={r}
          stroke={dq.green}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 46 46)"
        />
      </Svg>
      <View style={s.ringCenter}>
        <Text style={s.ringCount}>{count}</Text>
        <Text style={s.ringOf}>of {total}</Text>
      </View>
    </View>
  );
}

function MilestoneCell({
  reward,
  isNew,
  width,
}: {
  reward: RewardWithStatus;
  isNew: boolean;
  width: number;
}) {
  return (
    <View style={[s.cell, { width }]}>
      {reward.unlocked ? (
        <GoldCircle size={62} style={s.badgeUnlocked}>
          <RewardIcon icon={reward.icon} color={dq.onBadgeGold} size={24} />
          {isNew && (
            <View style={s.newBadge}>
              <Text style={s.newBadgeText}>NEW</Text>
            </View>
          )}
        </GoldCircle>
      ) : (
        <View style={s.badgeLocked}>
          <RewardIcon icon={reward.icon} color={dq.lockIcon} size={23} />
          <View style={s.lockSub}>
            <Lock size={10} color={dq.muted} />
          </View>
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
        <View style={s.cellProgress}>
          <View style={s.cellTrack}>
            <View
              style={[s.cellFill, { width: `${Math.round(reward.progress * 100)}%` }]}
            />
          </View>
          <Text style={s.cellProgressText}>
            {reward.current} / {reward.required}
          </Text>
        </View>
      )}
    </View>
  );
}

export function RewardsScreen() {
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const pendingUnlocks = useAppSelector((state) => state.main.pendingRewardUnlocks);

  const { data: rewardsRes, isLoading: rewardsLoading } = useGetRewardsQuery();
  const { data: progressRes } = useGetProgressQuery();

  const rewards: RewardWithStatus[] = rewardsRes?.data ?? [];

  const unlocked = rewards.filter((r) => r.unlocked).length;
  const total = rewards.length;
  const pct = total > 0 ? unlocked / total : 0;
  const { tier, hint } = tierInfo(unlocked, total);

  // The most recently unlocked badge gets the "NEW" flair + celebration banner.
  const newest = useMemo(() => {
    const unlockedRewards = rewards.filter((r) => r.unlocked && r.unlocked_at);
    if (unlockedRewards.length === 0) return undefined;
    return [...unlockedRewards].sort((a, b) =>
      (b.unlocked_at ?? "").localeCompare(a.unlocked_at ?? ""),
    )[0];
  }, [rewards]);

  // grid cell width: screen − 40px padding − 2×8px gaps, split 3 ways
  const cellWidth = (width - 40 - 16) / 3;

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

  const handleBannerPress = () => {
    if (!newest) return;
    openCelebration({
      id: newest.id,
      title: newest.title,
      description: newest.description,
      icon: newest.icon,
      rarity: newest.rarity,
      xp_bonus: newest.xp_bonus,
    });
  };

  return (
    <ScreenWrapper innerStyle={s.wrapper}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={{ gap: 3 }}>
          <Text style={s.title}>Rewards</Text>
          <Text style={s.subtitle}>Collect badges as you learn</Text>
        </View>

        {/* ring card */}
        <View style={s.ringCard}>
          <ProgressRing pct={pct} count={unlocked} total={total} />
          <View style={s.ringInfo}>
            <Text style={s.ringInfoTitle}>Badges unlocked</Text>
            <View style={s.tierPill}>
              <Medal size={12} color={dq.gold} />
              <Text style={s.tierText}>{tier} tier</Text>
            </View>
            <Text style={s.ringHint}>{hint}</Text>
          </View>
        </View>

        {/* celebration banner */}
        {newest && (
          <Pressable
            onPress={handleBannerPress}
            style={({ pressed }) => [s.celebration, pressed && { opacity: 0.9 }]}
          >
            <GoldCircle size={54} style={s.celebrationIcon}>
              <RewardIcon icon={newest.icon} color={dq.onBadgeGold} size={24} />
            </GoldCircle>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.celebrationTopRow}>
                <Sparkles size={14} color={dq.gold} />
                <Text style={s.celebrationEyebrow}>New badge unlocked!</Text>
              </View>
              <Text style={s.celebrationTitle}>{newest.title}</Text>
              <Text style={s.celebrationHint}>Tap to view your reward</Text>
            </View>
            <ChevronRight size={20} color={dq.gold} />
          </Pressable>
        )}

        {/* milestones */}
        <View>
          <View style={s.milestonesHeader}>
            <Text style={s.milestonesTitle}>Milestones</Text>
            <Text style={s.milestonesCount}>
              {unlocked} of {total}
            </Text>
          </View>

          {rewardsLoading ? (
            <Loader />
          ) : rewards.length === 0 ? (
            <Text style={s.empty}>No rewards found.</Text>
          ) : (
            <View style={s.grid}>
              {rewards.map((reward) => (
                <MilestoneCell
                  key={reward.id}
                  reward={reward}
                  isNew={reward.id === newest?.id}
                  width={cellWidth}
                />
              ))}
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 90,
    gap: 18,
  },

  title: { fontSize: 26, fontFamily: "Nunito_900Black", color: dq.white },
  subtitle: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: dq.muted },

  // ring card
  ringCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    padding: 20,
  },
  ringWrap: { width: 92, height: 92 },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCount: { fontSize: 24, fontFamily: "Nunito_900Black", color: dq.white, lineHeight: 24 },
  ringOf: { fontSize: 11, fontFamily: "Nunito_700Bold", color: dq.muted, marginTop: 1 },
  ringInfo: { flex: 1, gap: 8 },
  ringInfoTitle: { fontSize: 18, fontFamily: "Nunito_900Black", color: dq.white },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: dq.gold12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  tierText: { fontSize: 11, fontFamily: "Nunito_800ExtraBold", color: dq.gold },
  ringHint: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: dq.muted },

  // celebration banner
  celebration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,219,60,0.09)",
    borderWidth: 1,
    borderColor: dq.gold25,
  },
  celebrationIcon: {
    borderWidth: 2,
    borderColor: dq.gold55,
  },
  celebrationTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  celebrationEyebrow: { fontSize: 14, fontFamily: "Nunito_900Black", color: dq.gold },
  celebrationTitle: { fontSize: 13, fontFamily: "Nunito_700Bold", color: dq.text },
  celebrationHint: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: "#8DA5A3" },

  // milestones
  milestonesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  milestonesTitle: { fontSize: 17, fontFamily: "Nunito_800ExtraBold", color: dq.white },
  milestonesCount: { fontSize: 13, fontFamily: "Nunito_700Bold", color: dq.muted },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
    columnGap: 8,
  },
  cell: { alignItems: "center", gap: 9 },
  badgeUnlocked: {
    borderWidth: 2,
    borderColor: dq.gold55,
    shadowColor: dq.gold,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeLocked: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: dq.lockFill,
    borderWidth: 1,
    borderColor: dq.lockBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  lockSub: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: dq.lockBadge,
    borderWidth: 2,
    borderColor: dq.screen,
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: dq.gold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: dq.screen,
  },
  newBadgeText: { fontSize: 8, fontFamily: "Nunito_900Black", color: "#3A2A08", letterSpacing: 0.3 },
  cellTitle: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
    textAlign: "center",
    lineHeight: 14,
  },
  unlockedLabel: { fontSize: 9, fontFamily: "Nunito_800ExtraBold", color: dq.green, letterSpacing: 0.4 },
  cellProgress: { alignItems: "center", gap: 4 },
  cellTrack: {
    width: 56,
    height: 5,
    borderRadius: 99,
    backgroundColor: dq.trackWhite07,
    overflow: "hidden",
  },
  cellFill: { height: "100%", backgroundColor: dq.green },
  cellProgressText: { fontSize: 9, fontFamily: "Nunito_700Bold", color: dq.faint },

  empty: { fontSize: 14, color: dq.muted, textAlign: "center", paddingTop: 12 },
});
