import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Star, Trophy, Gift, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";

export function CompletionScreen({
  stars,
  xpEarned,
  hasRewards,
  onDone,
  onClaimReward,
}: {
  stars: number;
  xpEarned: number;
  hasRewards: boolean;
  onDone: () => void;
  onClaimReward: () => void;
}) {
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const star0Scale = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0)).current;
  const star2Scale = useRef(new Animated.Value(0)).current;
  const xpCounterAnim = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const rewardBadgeScale = useRef(new Animated.Value(0)).current;
  const rewardBadgeOpacity = useRef(new Animated.Value(0)).current;
  const rewardPulse = useRef(new Animated.Value(1)).current;
  const doneBtnOpacity = useRef(new Animated.Value(0)).current;
  const doneBtnTranslateY = useRef(new Animated.Value(12)).current;

  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    const listenerId = xpCounterAnim.addListener(({ value }) =>
      setDisplayXP(Math.round(value)),
    );

    Animated.sequence([
      // Trophy spring entrance
      Animated.spring(trophyScale, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Stars stagger pop — start from 0.4 so the bounce feels natural
      Animated.stagger(
        110,
        [star0Scale, star1Scale, star2Scale].map((anim) => {
          anim.setValue(0.4);
          return Animated.spring(anim, {
            toValue: 1,
            tension: 200,
            friction: 6,
            useNativeDriver: true,
          });
        }),
      ),
      // XP counter
      Animated.parallel([
        Animated.timing(xpOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(xpCounterAnim, {
          toValue: xpEarned,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      // Reward badge + done button appear
      Animated.parallel([
        Animated.spring(rewardBadgeScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rewardBadgeOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(doneBtnOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(doneBtnTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Trophy sway loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyRotate, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotate, {
          toValue: -1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    if (hasRewards) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rewardPulse, {
            toValue: 1.04,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rewardPulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    return () => xpCounterAnim.removeListener(listenerId);
  }, []);

  const trophyRotateDeg = trophyRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  return (
    <View style={s.completionContainer}>
      <Animated.View
        style={{
          transform: [{ scale: trophyScale }, { rotate: trophyRotateDeg }],
          marginBottom: 12,
        }}
      >
        <Trophy
          size={72}
          color={theme.colors.secondary}
          fill={theme.colors.secondary}
        />
      </Animated.View>

      <Animated.Text
        style={[
          s.completionTitle,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        Level Complete!
      </Animated.Text>

      <View style={s.starsRow}>
        {([star0Scale, star1Scale, star2Scale] as Animated.Value[]).map(
          (sc, i) => (
            <Animated.View key={i} style={{ transform: [{ scale: sc }] }}>
              <Star
                size={44}
                color={
                  i < stars ? theme.colors.secondary : theme.colors.surfaceHigh
                }
                fill={i < stars ? theme.colors.secondary : "transparent"}
              />
            </Animated.View>
          ),
        )}
      </View>

      <Animated.Text style={[s.xpText, { opacity: xpOpacity }]}>
        +{displayXP} XP
      </Animated.Text>

      {hasRewards && (
        <Animated.View
          style={{
            opacity: rewardBadgeOpacity,
            transform: [{ scale: rewardBadgeScale }],
            width: "100%",
            marginBottom: 14,
          }}
        >
          <Animated.View style={{ transform: [{ scale: rewardPulse }] }}>
            <TouchableOpacity
              style={s.claimRewardBtn}
              onPress={onClaimReward}
              activeOpacity={0.85}
            >
              <Gift size={18} color={theme.colors.onSecondary} />
              <Text style={s.claimRewardText}>🎁 Claim Your Reward!</Text>
              <ChevronRight size={16} color={theme.colors.onSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      <Animated.View
        style={{
          opacity: doneBtnOpacity,
          transform: [{ translateY: doneBtnTranslateY }],
          width: "100%",
        }}
      >
        <TouchableOpacity
          style={s.doneBtn}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={s.doneBtnText}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  completionContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    backgroundColor: theme.colors.background,
  },
  completionTitle: {
    fontSize: 30,
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  xpText: {
    fontSize: 26,
    color: theme.colors.secondary,
    fontWeight: "900",
    marginBottom: 32,
    letterSpacing: 1,
  },
  claimRewardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.goldDark,
  },
  claimRewardText: {
    color: theme.colors.onSecondary,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: "center",
  },
  doneBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  doneBtnText: {
    color: theme.colors.textMuted,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 1,
  },
});
