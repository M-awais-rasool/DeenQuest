import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { Star } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { NewlyGrantedReward } from "../../../store/services/api";
import { RewardIcon } from "../../reward/components/RewardIcon";
import { rarityTheme } from "../../reward/components/rarityTheme";

const PARTICLE_COUNT = 10;

export function RewardCelebrationModal({
  reward,
  visible,
  onDismiss,
}: {
  reward: NewlyGrantedReward | null;
  visible: boolean;
  onDismiss: () => void;
}) {
  const rt = useMemo(
    () => (reward ? rarityTheme(reward.rarity) : rarityTheme("rare")),
    [reward],
  );

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.65)).current;
  const cardTranslateY = useRef(new Animated.Value(70)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const text1Opacity = useRef(new Animated.Value(0)).current;
  const text2Opacity = useRef(new Animated.Value(0)).current;
  const text3Opacity = useRef(new Animated.Value(0)).current;
  const bonusOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.8)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  const p0 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p1 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p2 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p3 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p4 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p5 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p6 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p7 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p8 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;
  const p9 = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    o: new Animated.Value(0),
    sc: new Animated.Value(0),
  }).current;

  const particles = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

  const particleColors = useMemo(
    () => [
      rt.accent,
      rt.iconColor,
      theme.colors.secondary,
      theme.colors.white,
      theme.colors.primary,
    ],
    [rt],
  );

  useEffect(() => {
    if (!visible || !reward) return;

    // ── Reset ────────────────────────────────────────────────────────────────
    backdropOpacity.setValue(0);
    cardScale.setValue(0.65);
    cardTranslateY.setValue(70);
    iconScale.setValue(0);
    text1Opacity.setValue(0);
    text2Opacity.setValue(0);
    text3Opacity.setValue(0);
    bonusOpacity.setValue(0);
    btnScale.setValue(0.8);
    btnOpacity.setValue(0);
    particles.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.o.setValue(0);
      p.sc.setValue(0);
    });

    Vibration.vibrate([0, 50, 30, 80, 30, 60]);

    // ── Particle burst ────────────────────────────────────────────────────────
    const particleBurst = Animated.parallel(
      particles.map((p, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const distance = 70 + (i % 3) * 22;
        return Animated.parallel([
          Animated.spring(p.sc, {
            toValue: 1,
            tension: 100,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(p.o, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: Math.cos(angle) * distance,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: Math.sin(angle) * distance,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(280),
            Animated.timing(p.o, {
              toValue: 0,
              duration: 320,
              useNativeDriver: true,
            }),
          ]),
        ]);
      }),
    );

    // ── Entrance sequence ─────────────────────────────────────────────────────
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 62,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          tension: 62,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(160),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 90,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([Animated.delay(200), particleBurst]),
      Animated.sequence([
        Animated.delay(260),
        Animated.timing(text1Opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(360),
        Animated.timing(text2Opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(text3Opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(520),
        Animated.timing(bonusOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(660),
        Animated.parallel([
          Animated.spring(btnScale, {
            toValue: 1,
            tension: 65,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(btnOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [visible, reward]);

  if (!reward) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[s.celebBackdrop, { opacity: backdropOpacity }]}>
        {/* Particle overlay — full screen, non-interactive */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                s.particle,
                {
                  backgroundColor: particleColors[i % particleColors.length],
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { scale: p.sc },
                  ],
                  opacity: p.o,
                },
              ]}
            />
          ))}
        </View>

        {/* Centered card */}
        <View style={s.celebCenterWrap}>
          <Animated.View
            style={[
              s.celebCard,
              {
                borderColor: rt.border,
                transform: [
                  { scale: cardScale },
                  { translateY: cardTranslateY },
                ],
              },
            ]}
          >
            {/* Rarity accent bar */}
            <View style={[s.celebRarityBar, { backgroundColor: rt.accent }]} />

            {/* Icon */}
            <Animated.View
              style={[
                s.celebIconWrap,
                {
                  backgroundColor: rt.iconBg,
                  borderColor: rt.border,
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <RewardIcon icon={reward.icon} color={rt.iconColor} size={54} />
            </Animated.View>

            <Animated.Text
              style={[
                s.celebEyebrow,
                { color: rt.pillText, opacity: text1Opacity },
              ]}
            >
              🎉 REWARD UNLOCKED
            </Animated.Text>
            <Animated.Text style={[s.celebTitle, { opacity: text2Opacity }]}>
              {reward.title}
            </Animated.Text>
            <Animated.Text style={[s.celebDesc, { opacity: text3Opacity }]}>
              {reward.description}
            </Animated.Text>

            {/* XP Bonus pill */}
            <Animated.View
              style={[
                s.celebBonusPill,
                {
                  backgroundColor: rt.pillBg,
                  borderColor: rt.border,
                  opacity: bonusOpacity,
                },
              ]}
            >
              <Star
                size={14}
                color={theme.colors.secondary}
                fill={theme.colors.secondary}
              />
              <Text style={s.celebBonusText}>+{reward.xp_bonus} XP Bonus</Text>
            </Animated.View>

            {/* CTA */}
            <Animated.View
              style={{
                width: "100%",
                transform: [{ scale: btnScale }],
                opacity: btnOpacity,
              }}
            >
              <TouchableOpacity
                style={[s.celebBtn, { backgroundColor: rt.accent }]}
                onPress={onDismiss}
                activeOpacity={0.85}
              >
                <Text
                  style={[s.celebBtnText, { color: theme.colors.background }]}
                >
                  Awesome! 🚀
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  celebBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.background80,
    justifyContent: "center",
    alignItems: "center",
  },
  celebCenterWrap: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  celebCard: {
    width: "100%",
    maxWidth: 370,
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 0,
    alignItems: "center",
    overflow: "hidden",
  },
  celebRarityBar: {
    width: "100%",
    height: 5,
    marginBottom: 24,
    borderRadius: 2,
  },
  celebIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 20,
    zIndex: 2,
  },
  celebEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  celebTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 32,
  },
  celebDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  celebBonusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 22,
  },
  celebBonusText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "900",
  },
  celebBtn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
  },
  celebBtnText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  particle: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
    top: "45%",
    left: "50%",
    marginLeft: -4.5,
    marginTop: -4.5,
  },
});
