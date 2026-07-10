import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { TactilePressable } from "../../ui";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { dq } from "../../../theme/designTokens";
import type { NewlyGrantedReward } from "../../../store/services/api";
import { RewardIcon } from "../../../screens/reward/components/RewardIcon";

interface CourseCompletionScreenProps {
  xpEarned: number;
  accuracy: number;
  timeString: string;
  currentTotalXP?: number;
  levelTitle?: string;
  unlockReward?: string;
  treasureOpen?: boolean;
  newRewards?: NewlyGrantedReward[];
  /** "5/5" lessons chip (C5 mock) — hidden when not provided. */
  lessonsDone?: number;
  lessonsTotal?: number;
  onContinue: () => void;
}

const SPRING = { friction: 7, tension: 120, useNativeDriver: true };

// Multicolour confetti positions lifted from the C5 mockup — small rotated
// rectangles plus a few dots in the brand accent colours.
const CONFETTI: {
  top: number;
  left?: number;
  right?: number;
  w: number;
  h: number;
  rotate?: string;
  round?: boolean;
  color: string;
}[] = [
  { top: 120, left: 52, w: 10, h: 14, rotate: "24deg", color: "#EFB65A" },
  { top: 88, right: 74, w: 9, h: 13, rotate: "-18deg", color: "#2CC9B5" },
  { top: 190, left: 98, w: 8, h: 8, round: true, color: "#F27FB2" },
  { top: 160, right: 44, w: 9, h: 13, rotate: "40deg", color: "#A78BFA" },
  { top: 260, left: 38, w: 9, h: 13, rotate: "-32deg", color: "#6EC1E8" },
  { top: 236, right: 96, w: 8, h: 8, round: true, color: "#EFB65A" },
  { top: 330, left: 120, w: 7, h: 11, rotate: "12deg", color: "#F27FB2" },
  { top: 308, right: 52, w: 9, h: 13, rotate: "-45deg", color: "#2CC9B5" },
];

// Gold / purple / teal medallion themes for the "new rewards" cards.
type Medal = { from: string; to: string; border: string; on: string; pillBg: string; pillText: string };
const MEDALS: Record<string, Medal> = {
  legendary: { from: dq.badgeGoldFrom, to: dq.badgeGoldTo, border: "rgba(239,182,90,0.5)", on: dq.onBadgeGold, pillBg: "rgba(239,182,90,0.12)", pillText: dq.gold },
  rare: { from: dq.badgeGoldFrom, to: dq.badgeGoldTo, border: "rgba(239,182,90,0.5)", on: dq.onBadgeGold, pillBg: "rgba(239,182,90,0.12)", pillText: dq.gold },
  epic: { from: "#C4B2FF", to: "#7B5BD6", border: "rgba(167,139,250,0.5)", on: "#241A45", pillBg: "rgba(167,139,250,0.14)", pillText: "#A78BFA" },
  common: { from: "#5EE0CE", to: "#1B9484", border: "rgba(44,201,181,0.5)", on: dq.onGreen, pillBg: "rgba(44,201,181,0.12)", pillText: dq.green },
};
const medalFor = (rarity: string): Medal => MEDALS[rarity] ?? MEDALS.rare;

function formatReward(raw?: string): string {
  if (!raw) return "";
  const value = raw.includes(":") ? raw.split(":")[1] : raw;
  return value
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function useCountUp(target: number, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now() + delay;
    let lastHaptic = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setValue(current);
      if (current - lastHaptic >= Math.max(5, Math.round(target / 12))) {
        lastHaptic = current;
        haptics.light();
      }
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return value;
}

/** A single XP label that rises and fades, looping (the mockup's "flying XP"). */
function RisingXP({
  left,
  top,
  label,
  color,
  delay,
}: {
  left: number;
  top: number;
  label: string;
  color: string;
  delay: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [t, delay]);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.Text
      pointerEvents="none"
      style={[styles.risingXp, { left, top, color, opacity, transform: [{ translateY }] }]}
    >
      {label}
    </Animated.Text>
  );
}

export default function CourseCompletionScreen({
  xpEarned = 20,
  accuracy = 80,
  timeString = "0:00",
  levelTitle,
  unlockReward,
  newRewards = [],
  lessonsDone,
  lessonsTotal,
  onContinue,
}: CourseCompletionScreenProps) {
  const insets = useSafeAreaInsets();

  // Entrance values
  const badgeScale = useRef(new Animated.Value(0.6)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineY = useRef(new Animated.Value(16)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(24)).current;
  const rewardsOpacity = useRef(new Animated.Value(0)).current;
  const rewardsY = useRef(new Animated.Value(24)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(20)).current;

  // Trophy float + glow pulse
  const trophyFloat = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  const [xpTrigger, setXpTrigger] = useState(false);
  const [accTrigger, setAccTrigger] = useState(false);
  const displayXP = useCountUp(xpEarned, 1100, xpTrigger ? 0 : Infinity);
  const displayAccuracy = useCountUp(accuracy, 1000, accTrigger ? 0 : Infinity);

  useEffect(() => {
    sfx.complete();

    Animated.parallel([
      Animated.timing(badgeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start(() => haptics.success());

    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyFloat, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(trophyFloat, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();

    const seq = (o: Animated.Value, y: Animated.Value, delay: number, cb?: () => void) =>
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(o, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(y, { toValue: 0, ...SPRING }),
        ]).start(cb);
      }, delay);

    seq(headlineOpacity, headlineY, 200);
    seq(statsOpacity, statsY, 450, () => {
      setXpTrigger(true);
      setTimeout(() => setAccTrigger(true), 350);
    });
    seq(rewardsOpacity, rewardsY, 750);
    seq(buttonOpacity, buttonY, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatY = trophyFloat.interpolate({ inputRange: [0, 1], outputRange: [4, -8] });
  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] });

  // The API sends `null` (not undefined) when no rewards were granted.
  const safeRewards = newRewards ?? [];

  return (
    <View style={styles.root}>
      {/* ambient glow — teal halo at the top (C5 mock radial background) */}
      <View style={styles.glow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="dq-glow" cx="50%" cy="30%" r="62%">
              <Stop offset="0%" stopColor="#1A3A33" stopOpacity={1} />
              <Stop offset="65%" stopColor={dq.screen} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dq-glow)" />
        </Svg>
      </View>

      {/* confetti */}
      {CONFETTI.map((c, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            right: c.right,
            width: c.w,
            height: c.h,
            backgroundColor: c.color,
            borderRadius: c.round ? c.w / 2 : 2,
            opacity: glowOpacity,
            transform: [{ rotate: c.rotate ?? "0deg" }, { scale: glowScale }],
          }}
        />
      ))}

      {/* flying XP */}
      <RisingXP left={96} top={250} label={`+${Math.round(xpEarned * 0.1)}`} color={dq.gold} delay={0} />
      <RisingXP left={300} top={270} label={`+${Math.round(xpEarned * 0.05) || 1}`} color={dq.gold} delay={800} />
      <RisingXP left={210} top={232} label={`+${Math.round(xpEarned * 0.12)}`} color={dq.green} delay={1500} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* gold check badge */}
        <Animated.View
          style={[styles.trophyFrame, { opacity: badgeOpacity, transform: [{ scale: badgeScale }, { translateY: floatY }] }]}
        >
          <LinearGradient
            colors={[dq.gold, dq.goldDark]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.trophyCore}
          >
            <Text style={styles.checkMark}>✓</Text>
          </LinearGradient>
        </Animated.View>

        {/* headline */}
        <Animated.View
          style={[styles.headline, { opacity: headlineOpacity, transform: [{ translateY: headlineY }] }]}
        >
          <Text style={styles.title}>Level complete!</Text>
          {!!levelTitle && <Text style={styles.subtitle}>{levelTitle}</Text>}
        </Animated.View>

        {/* XP count-up */}
        <Animated.View
          style={[styles.xpBlock, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}
        >
          <Text style={styles.xpNumber}>
            +{displayXP} <Text style={styles.xpSuffix}>XP</Text>
          </Text>
        </Animated.View>

        {/* stat tiles */}
        <Animated.View
          style={[styles.statsRow, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}
        >
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: dq.green }]}>
              {displayAccuracy}%
            </Text>
            <Text style={styles.statLabel}>ACCURACY</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: "#6EC1E8" }]}>
              {timeString}
            </Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
          {lessonsTotal != null && lessonsTotal > 0 && (
            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: "#F27FB2" }]}>
                {lessonsDone ?? lessonsTotal}/{lessonsTotal}
              </Text>
              <Text style={styles.statLabel}>LESSONS</Text>
            </View>
          )}
        </Animated.View>

        {/* unlock chip */}
        {!!unlockReward && (
          <Animated.View
            style={[styles.unlockChip, { opacity: rewardsOpacity, transform: [{ translateY: rewardsY }] }]}
          >
            <Text style={styles.unlockStar}>✦</Text>
            <Text style={styles.unlockText}>
              {formatReward(unlockReward)} unlocked
            </Text>
          </Animated.View>
        )}

        {/* new badges */}
        {safeRewards.length > 0 && (
          <Animated.View
            style={[styles.rewardsBlock, { opacity: rewardsOpacity, transform: [{ translateY: rewardsY }] }]}
          >
            <Text style={styles.rewardsHeading}>NEW BADGES</Text>
            <View style={styles.rewardsRow}>
              {safeRewards.map((r) => {
                const m = medalFor(r.rarity);
                return (
                  <View key={r.id} style={styles.rewardCard}>
                    <LinearGradient
                      colors={[m.from, m.to]}
                      start={{ x: 0.32, y: 0.28 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.rewardMedal, { borderColor: m.border, shadowColor: m.pillText }]}
                    >
                      <RewardIcon icon={r.icon} color={m.on} size={22} />
                    </LinearGradient>
                    <Text style={styles.rewardTitle} numberOfLines={2}>
                      {r.title}
                    </Text>
                    <View style={[styles.rarityPill, { backgroundColor: m.pillBg }]}>
                      <Text style={[styles.rarityText, { color: m.pillText }]}>
                        {r.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* continue */}
      <Animated.View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 10) + 8, opacity: buttonOpacity, transform: [{ translateY: buttonY }] },
        ]}
      >
        <TactilePressable
          edgeColor="#1B9484"
          faceUnderlayColor={dq.green}
          depth={4}
          radius={16}
          haptic="medium"
          faceStyle={styles.continueBtn}
          onPress={onContinue}
        >
          <Text style={styles.continueText}>CONTINUE</Text>
        </TactilePressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: dq.screen, overflow: "hidden" },

  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 520 },

  scrollView: { flex: 1 },
  scroll: { alignItems: "center", paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16 },

  // gold check badge
  trophyFrame: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  trophyCore: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: dq.gold,
    shadowOpacity: 0.35,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  checkMark: {
    fontSize: 52,
    lineHeight: 62,
    fontFamily: "Nunito_900Black",
    color: dq.onGold,
  },

  // headline
  headline: { alignItems: "center" },
  title: { fontSize: 30, fontFamily: "Nunito_900Black", color: dq.text },
  subtitle: { fontSize: 15, fontFamily: "Nunito_700Bold", color: dq.muted, marginTop: 5 },

  // XP hero number
  xpBlock: { marginTop: 28 },
  xpNumber: {
    fontSize: 54,
    lineHeight: 56,
    fontFamily: "Nunito_900Black",
    color: dq.gold,
  },
  xpSuffix: { fontSize: 26 },

  // stat tiles
  statsRow: { flexDirection: "row", gap: 12, marginTop: 26 },
  statTile: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 2,
  },
  statValue: { fontSize: 19, lineHeight: 24, fontFamily: "Nunito_900Black", color: dq.text },
  statLabel: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 0.8,
  },

  // unlock chip
  unlockChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: dq.goldTint,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 22,
  },
  unlockStar: { fontSize: 18, color: dq.gold },
  unlockText: { fontSize: 13, fontFamily: "Nunito_800ExtraBold", color: dq.gold },

  // new rewards
  rewardsBlock: { width: "100%", marginTop: 24, gap: 14 },
  rewardsHeading: { fontSize: 13, fontFamily: "Nunito_800ExtraBold", letterSpacing: 0.5, color: dq.muted },
  rewardsRow: { flexDirection: "row", gap: 14, justifyContent: "center" },
  rewardCard: {
    flex: 1,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 9,
  },
  rewardMedal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  rewardTitle: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
    textAlign: "center",
    lineHeight: 13,
  },
  rarityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  rarityText: { fontSize: 9, fontFamily: "Nunito_800ExtraBold", letterSpacing: 0.5 },

  // continue
  footer: { paddingHorizontal: 24, paddingTop: 18 },
  continueBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: dq.green,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: { fontSize: 16, fontFamily: "Nunito_900Black", letterSpacing: 1.2, color: dq.onGreen },
  risingXp: { position: "absolute", fontSize: 13, fontFamily: "Nunito_900Black", zIndex: 1 },
});
