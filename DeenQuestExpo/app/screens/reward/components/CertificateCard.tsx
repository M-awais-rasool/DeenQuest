import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Lock } from "lucide-react-native";
import { dq } from "../../../theme/designTokens";
import { CertificateSeal } from "../../../components/ui";

export interface CertificateEntry {
  levelId: number;
  courseLevel: number;
  title: string;
  sectionTitle: string;
  earned: boolean;
}

export function CertificateCard({
  entry,
  index,
  onPress,
}: {
  entry: CertificateEntry;
  index: number;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: 120 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, index]);

  // RN's transform tuple type rejects a mixed-key array literal.
  const style = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  } as unknown as StyleProp<ViewStyle>;

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
      >
        <LinearGradient
          colors={
            entry.earned ? ["#1B3B33", "#12262B"] : [dq.lockFill, dq.lockFill]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.face, !entry.earned && s.faceLocked]}
        >
          <View style={s.sealWrap}>
            {entry.earned ? (
              <CertificateSeal size={46} id={`seal-${entry.levelId}`} />
            ) : (
              <View style={s.lockCircle}>
                <Lock size={19} color="#5F7E7C" strokeWidth={2.5} />
              </View>
            )}
          </View>

          <View style={s.body}>
            <Text style={s.section} numberOfLines={1}>
              {entry.sectionTitle.toUpperCase()}
            </Text>
            <Text
              style={[s.title, !entry.earned && { color: dq.muted }]}
              numberOfLines={2}
            >
              {entry.title}
            </Text>
            {entry.earned ? (
              <View style={s.earnedRow}>
                <Text style={s.earnedStar}>✦</Text>
                <Text style={s.earnedText}>EARNED</Text>
              </View>
            ) : (
              <Text style={s.lockedText}>
                Finish Level {entry.courseLevel} to earn
              </Text>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 12 },
  face: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  faceLocked: {
    borderColor: dq.lockBorder,
    borderStyle: "dashed",
  },
  sealWrap: { width: 46, alignItems: "center" },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2C464C",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 3 },
  section: {
    fontSize: 9.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 1.3,
  },
  title: {
    fontSize: 16.5,
    fontFamily: "Nunito_900Black",
    color: dq.text,
  },
  earnedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  earnedStar: { fontSize: 11, color: dq.gold },
  earnedText: {
    fontSize: 10,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.gold,
    letterSpacing: 0.8,
  },
  lockedText: {
    fontSize: 11.5,
    fontFamily: "Nunito_700Bold",
    color: dq.faint,
  },
});
