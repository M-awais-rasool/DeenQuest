import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Rect } from "react-native-svg";
import { Crown, Flame, Gem, Trophy, Zap } from "lucide-react-native";

import type { RewardIcon, RewardWithStatus } from "../../../store/services/api";
import { WORLD, type WorldFamily } from "./worldTheme";

/**
 * What the learner is climbing towards.
 *
 * The mockup puts a "Daily Challenge" here. This app has no daily challenge —
 * it has daily *tasks*, which live on their own screen — so the slot shows the
 * next reward instead: the same card, carrying something the learner is
 * actually working towards on this screen rather than a duplicate of another
 * one.
 */

const ICONS: Record<RewardIcon, typeof Crown> = {
  crown: Crown,
  flame: Flame,
  gem: Gem,
  trophy: Trophy,
  zap: Zap,
};

const RARITY_TONE: Record<string, string> = {
  legendary: "#EFB65A",
  epic: "#A78BFA",
  rare: "#6EC1E8",
};

export const NextRewardCard = memo(function NextRewardCard({
  reward,
  family,
}: {
  /** The closest unearned reward, or null when every one is claimed. */
  reward: RewardWithStatus | null;
  family: WorldFamily;
}) {
  if (!reward) {
    return (
      <View style={[s.card, { borderColor: family.challengeBorder }]}>
        <View style={s.body}>
          <Text style={s.title}>Every reward claimed</Text>
          <Text style={s.goal}>
            Nothing left to unlock — keep the streak alive.
          </Text>
        </View>
        <GiftBox family={family} />
      </View>
    );
  }

  const Icon = ICONS[reward.icon] ?? Trophy;
  const tone = RARITY_TONE[reward.rarity] ?? WORLD.progressFrom;
  const pct = Math.min(1, Math.max(0, reward.progress));

  return (
    <View style={[s.card, { borderColor: family.challengeBorder }]}>
      <View style={s.body}>
        <View style={s.titleRow}>
          <Icon size={15} color={tone} strokeWidth={2.6} />
          <Text style={s.title} numberOfLines={1}>
            {reward.title}
          </Text>
        </View>
        <Text style={s.goal} numberOfLines={2}>
          {reward.description}
        </Text>
        <View style={s.progressRow}>
          <View style={s.track}>
            <LinearGradient
              colors={[tone, WORLD.progressTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.fill, { width: `${pct * 100}%` }]}
            />
          </View>
          <Text style={s.count}>
            {reward.current} / {reward.required}
          </Text>
        </View>
      </View>

      <GiftBox family={family} />
    </View>
  );
});

/** The mockup's wrapped gift — kept, because here it is literally the subject. */
function GiftBox({ family }: { family: WorldFamily }) {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48">
      <Rect x={8} y={20} width={32} height={22} rx={4} fill={family.giftBox} />
      <Rect x={8} y={20} width={32} height={22} rx={4} fill="#000" opacity={0.14} />
      <Rect x={8} y={15} width={32} height={8} rx={3} fill={family.giftLid} />
      <Rect x={21} y={15} width={6} height={27} fill={WORLD.gold} />
      <Path d="M24 15 C20 9 13 9 14 13 C15 16 20 16 24 15 Z" fill={WORLD.gold} />
      <Path d="M24 15 C28 9 35 9 34 13 C33 16 28 16 24 15 Z" fill={WORLD.gold} />
    </Svg>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginTop: 12,
    backgroundColor: WORLD.panelStrong,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  title: {
    flexShrink: 1,
    color: WORLD.text,
    fontSize: 16,
    fontFamily: "Nunito_900Black",
  },
  goal: {
    marginTop: 3,
    color: WORLD.textMuted,
    fontSize: 12,
    lineHeight: 17.4,
    fontFamily: "Nunito_600SemiBold",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 10,
  },
  track: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  count: {
    color: WORLD.textMuted,
    fontSize: 11,
    fontFamily: "Nunito_900Black",
  },
});
