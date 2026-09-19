import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AudioLines,
  BookMarked,
  BookOpen,
  Check,
  Feather,
  Flame,
  RotateCw,
  type LucideIcon,
} from "lucide-react-native";
import { home, tileFor } from "./tokens";

const COIN = require("../../../assets/home/coin.png");
const PEAKS = require("../../../assets/home/peaks.png");

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  salah: Flame,
  quran: BookMarked,
  dhikr: RotateCw,
  learning: BookOpen,
  character: AudioLines,
  social: Check,
  reflection: Feather,
};

const ARABIC_TILE: Record<string, string> = { learning: "ع" };

export function QuestTile({
  category,
  size = 60,
  icon,
}: {
  category: string;
  size?: number;
  icon?: LucideIcon;
}) {
  const [from, to] = tileFor(category);
  const Icon = icon ?? CATEGORY_ICONS[category] ?? BookOpen;
  const letter = icon ? undefined : ARABIC_TILE[category];

  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[s.tile, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {letter ? (
        <Text style={[s.tileLetter, { fontSize: size * 0.5 }]}>{letter}</Text>
      ) : (
        <Icon size={size * 0.44} color="#EAFBF9" strokeWidth={2.1} />
      )}
    </LinearGradient>
  );
}

export const QuestCard = memo(function QuestCard({
  title,
  category,
  xp,
  done,
  icon,
  subtitle,
  onPress,
}: {
  title: string;
  category: string;
  xp: number;
  done: boolean;
  icon?: LucideIcon;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
    >
      <Image source={PEAKS} style={s.peaks} resizeMode="stretch" />

      <View style={s.inner}>
        <QuestTile category={category} icon={icon} />

        <View style={s.body}>
          <Text style={s.title} numberOfLines={2}>
            {title}
          </Text>

          <View style={s.progressRow}>
            <View style={s.track}>
              {done && (
                <LinearGradient
                  colors={[home.tealBright, home.teal]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.fill}
                />
              )}
            </View>
            <Text
              style={[s.state, done && { color: home.teal }]}
              numberOfLines={1}
            >
              {subtitle ?? (done ? "Done" : "To do")}
            </Text>
          </View>
        </View>

        <View style={s.rewardDivider} />

        <View style={s.reward}>
          <Image source={COIN} style={s.coin} resizeMode="contain" />
          <Text style={s.rewardText}>+{xp}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    marginHorizontal: home.gutter,
    borderRadius: home.radius,
    borderWidth: 1,
    borderColor: home.cardBorder,
    // The lit ground the ridge was painted against. On the darker card the
    // mountains all but disappeared — they are cut from this exact teal.
    backgroundColor: home.ridgeCard,
    // No padding here, and none on any card that carries artwork: an
    // absolutely positioned child is laid out inside its parent's padding, so
    // the ridge stopped short of the card's own edges and left a band of bare
    // card under it. The padding lives on the row instead.
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 13,
    paddingRight: 14,
    paddingVertical: 12,
    gap: 15,
  },
  peaks: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "62%",
    height: "100%",
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
  tileLetter: {
    color: "#EAFBF9",
    fontFamily: "Amiri_700Bold",
    includeFontPadding: false,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  title: {
    color: home.text,
    fontSize: 16.5,
    lineHeight: 21,
    fontFamily: "Nunito_700Bold",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: home.track,
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  state: {
    color: home.muted,
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    minWidth: 38,
    textAlign: "right",
  },
  rewardDivider: {
    width: 1,
    height: 40,
    backgroundColor: home.divider,
    marginLeft: -3,
  },
  reward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coin: {
    width: 26,
    height: 26,
  },
  rewardText: {
    color: home.gold,
    fontSize: 15,
    fontFamily: "Nunito_900Black",
  },
});
