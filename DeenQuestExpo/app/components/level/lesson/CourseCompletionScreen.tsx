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
import Svg, { Defs, RadialGradient, Stop, Rect, Line, G } from "react-native-svg";
import {
  Trophy,
  Star,
  Target,
  Clock,
  ArrowRight,
  Sparkles,
  Sparkle,
} from "lucide-react-native";
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
  onContinue: () => void;
}

const SPRING = { friction: 7, tension: 120, useNativeDriver: true };

// Sunburst rays drawn from the centre outward (matches the mockup conic burst).
const RAYS = Array.from({ length: 18 }, (_, i) => i * 20);

// Confetti positions lifted from the mockup.
const CONFETTI: { top: number; left: number; size: number; square?: boolean; color: string }[] = [
  { top: 108, left: 54, size: 9, color: dq.green },
  { top: 168, left: 336, size: 8, square: true, color: dq.gold },
  { top: 240, left: 38, size: 8, square: true, color: dq.gold },
  { top: 96, left: 248, size: 7, color: dq.gold },
  { top: 210, left: 78, size: 7, square: true, color: dq.green },
  { top: 300, left: 352, size: 9, color: dq.green },
  { top: 88, left: 120, size: 7, square: true, color: dq.gold },
];

// Gold / purple / green medallion themes for the "new rewards" cards.
type Medal = { from: string; to: string; border: string; on: string; pillBg: string; pillText: string };
const MEDALS: Record<string, Medal> = {
  legendary: { from: dq.badgeGoldFrom, to: dq.badgeGoldTo, border: "rgba(255,219,60,0.5)", on: dq.onBadgeGold, pillBg: "rgba(255,219,60,0.12)", pillText: dq.gold },
  rare: { from: dq.badgeGoldFrom, to: dq.badgeGoldTo, border: "rgba(255,219,60,0.5)", on: dq.onBadgeGold, pillBg: "rgba(255,219,60,0.12)", pillText: dq.gold },
  epic: { from: "#D9C4F2", to: "#9D7BD6", border: "rgba(181,156,224,0.5)", on: "#34225a", pillBg: "rgba(181,156,224,0.14)", pillText: "#B59CE0" },
  common: { from: "#A8E9A2", to: dq.greenDark, border: "rgba(136,217,130,0.5)", on: dq.onGreen, pillBg: "rgba(136,217,130,0.12)", pillText: dq.green },
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
      {/* ambient glow */}
      <View style={styles.glow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="dq-glow" cx="50%" cy="24%" r="62%">
              <Stop offset="0%" stopColor={dq.gold} stopOpacity={0.18} />
              <Stop offset="45%" stopColor={dq.gold} stopOpacity={0.05} />
              <Stop offset="70%" stopColor={dq.screen} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dq-glow)" />
        </Svg>
      </View>

      {/* sunburst */}
      <Animated.View
        style={[styles.sunburst, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        pointerEvents="none"
      >
        <Svg width={340} height={340} viewBox="0 0 340 340">
          <G>
            {RAYS.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <Line
                  key={deg}
                  x1={170 + Math.cos(rad) * 50}
                  y1={170 + Math.sin(rad) * 50}
                  x2={170 + Math.cos(rad) * 140}
                  y2={170 + Math.sin(rad) * 140}
                  stroke={dq.gold}
                  strokeOpacity={0.12}
                  strokeWidth={8}
                />
              );
            })}
          </G>
        </Svg>
      </Animated.View>

      {/* confetti */}
      {CONFETTI.map((c, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: c.square ? 0 : c.size / 2,
            transform: c.square ? [{ rotate: "45deg" }] : undefined,
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
        {/* trophy */}
        <Animated.View
          style={[styles.trophyFrame, { opacity: badgeOpacity, transform: [{ scale: badgeScale }, { translateY: floatY }] }]}
        >
          <View style={styles.dashedRing} />
          <LinearGradient
            colors={["#FFF0C2", "#F0B93B", "#D2922A"]}
            start={{ x: 0.34, y: 0.28 }}
            end={{ x: 1, y: 1 }}
            style={styles.trophyCore}
          >
            <Trophy size={52} color="#6e4a06" />
          </LinearGradient>
          <Sparkles size={22} color={dq.gold} style={styles.sparkTop} />
          <Sparkle size={15} color={dq.gold} style={styles.sparkBottom} />
        </Animated.View>

        {/* headline */}
        <Animated.View
          style={[styles.headline, { opacity: headlineOpacity, transform: [{ translateY: headlineY }] }]}
        >
          <Text style={styles.eyebrow}>LEVEL COMPLETE</Text>
          <Text style={styles.title}>MashaAllah!</Text>
          <Text style={styles.subtitle}>
            {levelTitle ? `You finished ${levelTitle}` : "Beautifully done"}
          </Text>
        </Animated.View>

        {/* stat tiles */}
        <Animated.View
          style={[styles.statsRow, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}
        >
          <View style={styles.statTile}>
            <Star size={19} color={dq.gold} />
            <Text style={styles.statValue}>{displayXP}</Text>
            <Text style={styles.statLabel}>XP earned</Text>
          </View>
          <View style={styles.statTile}>
            <Target size={19} color={dq.green} />
            <Text style={styles.statValue}>{displayAccuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statTile}>
            <Clock size={19} color={dq.gold} />
            <Text style={styles.statValue}>{timeString}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </Animated.View>

        {/* new rewards */}
        {(safeRewards.length > 0 || unlockReward) && (
          <Animated.View
            style={[styles.rewardsBlock, { opacity: rewardsOpacity, transform: [{ translateY: rewardsY }] }]}
          >
            <Text style={styles.rewardsHeading}>NEW REWARDS</Text>
            <View style={styles.rewardsRow}>
              {safeRewards.length > 0
                ? safeRewards.map((r) => {
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
                  })
                : (
                  <View style={styles.rewardCard}>
                    <LinearGradient
                      colors={[dq.badgeGoldFrom, dq.badgeGoldTo]}
                      start={{ x: 0.32, y: 0.28 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.rewardMedal, { borderColor: "rgba(255,219,60,0.5)", shadowColor: dq.gold }]}
                    >
                      <Trophy size={22} color={dq.onBadgeGold} />
                    </LinearGradient>
                    <Text style={styles.rewardTitle} numberOfLines={2}>
                      {formatReward(unlockReward)}
                    </Text>
                    <View style={[styles.rarityPill, { backgroundColor: "rgba(255,219,60,0.12)" }]}>
                      <Text style={[styles.rarityText, { color: dq.gold }]}>UNLOCKED</Text>
                    </View>
                  </View>
                )}
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
          <ArrowRight size={18} color={dq.onGreen} />
        </TactilePressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: dq.screen, overflow: "hidden" },

  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 520 },
  sunburst: { position: "absolute", top: 70, left: 0, right: 0, alignItems: "center" },

  scrollView: { flex: 1 },
  scroll: { alignItems: "center", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16 },

  // trophy
  trophyFrame: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 26,
  },
  dashedRing: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "rgba(255,219,60,0.4)",
    borderStyle: "dashed",
  },
  trophyCore: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,233,168,0.7)",
    shadowColor: dq.gold,
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  sparkTop: { position: "absolute", top: 6, right: 8 },
  sparkBottom: { position: "absolute", bottom: 12, left: 4 },

  // headline
  headline: { alignItems: "center" },
  eyebrow: { fontSize: 12, fontFamily: "Nunito_900Black", letterSpacing: 2.16, color: dq.gold },
  title: { fontSize: 30, fontFamily: "Nunito_900Black", color: dq.white, marginTop: 8 },
  subtitle: { fontSize: 14, fontFamily: "Nunito_600SemiBold", color: "#a7b0a6", marginTop: 8 },

  // stat tiles
  statsRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 26 },
  statTile: {
    flex: 1,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 8,
  },
  statValue: { fontSize: 20, lineHeight: 20, fontFamily: "Nunito_900Black", color: dq.white },
  statLabel: { fontSize: 11, fontFamily: "Nunito_600SemiBold", color: dq.muted },

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
    height: 54,
    borderRadius: 16,
    backgroundColor: dq.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: dq.green,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  continueText: { fontSize: 15, fontFamily: "Nunito_900Black", letterSpacing: 0.6, color: dq.onGreen },
  risingXp: { position: "absolute", fontSize: 13, fontFamily: "Nunito_900Black", zIndex: 1 },
});
