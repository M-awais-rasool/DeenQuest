import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, Lock, Verified } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { type RewardWithStatus } from "../../../store/services/api";
import { RewardIcon } from "./RewardIcon";
import { rarityTheme, formatTrigger } from "./rarityTheme";

type Props = {
  reward: RewardWithStatus;
  index: number;
};

export const RewardCard = memo(function RewardCard({ reward, index }: Props) {
  const rt = rarityTheme(reward.rarity);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        delay: index * 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        s.card,
        {
          borderColor: rt.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        !reward.unlocked && s.cardLocked,
      ]}
    >
      <View style={[s.accentBar, { backgroundColor: rt.accent }]} />

      <View style={s.cardInner}>
        <View style={[s.iconWrap, { backgroundColor: rt.iconBg }]}>
          <RewardIcon
            icon={reward.icon}
            color={reward.unlocked ? rt.iconColor : theme.colors.textMuted}
            size={22}
          />
        </View>

        <View style={s.cardBody}>
          <View style={s.titleRow}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {reward.title}
            </Text>
            <View style={[s.rarityPill, { backgroundColor: rt.pillBg }]}>
              <Text style={[s.rarityText, { color: rt.pillText }]}>
                {reward.rarity}
              </Text>
            </View>
          </View>

          <Text style={s.cardDesc} numberOfLines={2}>
            {reward.description}
          </Text>

          {reward.unlocked ? (
            <View style={s.unlockedRow}>
              <CheckCircle2 size={13} color={theme.colors.primary} />
              <Text style={s.unlockedLabel}>
                Unlocked · +{reward.xp_bonus} XP bonus
              </Text>
            </View>
          ) : (
            <>
              <View style={s.progressRow}>
                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${Math.round(reward.progress * 100)}%` as any,
                        backgroundColor: rt.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={s.progressPct}>
                  {Math.round(reward.progress * 100)}%
                </Text>
              </View>
              <Text style={s.goalText}>
                {formatTrigger(reward.trigger, reward.required)}
              </Text>
            </>
          )}
        </View>

        <View style={s.statusIcon}>
          {reward.unlocked ? (
            <Verified
              size={18}
              color={theme.colors.primary}
              fill={theme.colors.primary}
            />
          ) : (
            <Lock size={18} color={theme.colors.textMuted} />
          )}
        </View>
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardLocked: {
    opacity: 0.58,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    marginVertical: 10,
    marginLeft: 2,
  },
  cardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    flexShrink: 1,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
  },
  unlockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  unlockedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.textMuted,
    minWidth: 28,
  },
  goalText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statusIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
});
