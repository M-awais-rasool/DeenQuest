import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { home } from "./tokens";

const FLAME = require("../../../assets/home/flame.png");
const COIN = require("../../../assets/home/coin.png");
const SPARK_ON = require("../../../assets/home/spark-on.png");
const SPARK_OFF = require("../../../assets/home/spark-off.png");

export const StatsCard = memo(function StatsCard({
  streak,
  xp,
  week,
  onPress,
}: {
  streak: number;
  xp: number;
  week: boolean[];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
    >
      <View style={s.top}>
        <View style={s.half}>
          <Image source={FLAME} style={s.flame} resizeMode="contain" />
          <View style={s.figures}>
            <Text style={s.value} numberOfLines={1}>
              Day {streak}
            </Text>
            <Text style={s.label}>Streak</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.half}>
          <Image source={COIN} style={s.coin} resizeMode="contain" />
          <View style={s.figures}>
            <Text style={s.value} numberOfLines={1}>
              {xp.toLocaleString()}
            </Text>
            <Text style={s.label}>XP</Text>
          </View>
        </View>
      </View>

      <View style={s.well}>
        {week.map((done, i) => (
          <Image
            key={i}
            source={done ? SPARK_ON : SPARK_OFF}
            style={s.spark}
            resizeMode="contain"
          />
        ))}
        <ChevronRight size={20} color={home.text} strokeWidth={2.6} />
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
    backgroundColor: home.card,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
  },
  half: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  figures: {
    flex: 1,
    minWidth: 0,
  },
  flame: {
    width: 40,
    height: 52,
  },
  coin: {
    width: 42,
    height: 42,
  },
  value: {
    color: home.text,
    fontSize: 22,
    fontFamily: "Nunito_900Black",
  },
  label: {
    color: home.muted,
    fontSize: 13.5,
    fontFamily: "Nunito_500Medium",
    marginTop: -1,
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 6,
    marginHorizontal: 12,
    backgroundColor: home.divider,
  },
  well: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: home.wellBorder,
    backgroundColor: home.well,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  spark: {
    width: 25,
    height: 25,
  },
});
