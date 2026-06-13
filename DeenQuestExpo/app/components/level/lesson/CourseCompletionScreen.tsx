import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from "react-native";
import { TactilePressable } from "../../ui";
import { Trophy, Star, Target, Clock, Gift, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { NewlyGrantedReward } from "../../../store/services/api";
import { RewardIcon } from "../../../screens/reward/components/RewardIcon";
import { rarityTheme } from "../../../screens/reward/components/rarityTheme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

type Particle = {
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
};

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

function formatReward(raw?: string): string {
  if (!raw) return "";
  const value = raw.includes(":") ? raw.split(":")[1] : raw;
  return value
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function CourseCompletionScreen({
  xpEarned = 20,
  accuracy = 80,
  timeString = "0:00",
  currentTotalXP = 0,
  levelTitle,
  unlockReward,
  treasureOpen = false,
  newRewards = [],
  onContinue,
}: CourseCompletionScreenProps) {
  const [claimed, setClaimed] = useState(false);
  const [showFlyingXP, setShowFlyingXP] = useState(false);

  // Entrance values
  const badgeScale = useRef(new Animated.Value(0.5)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineY = useRef(new Animated.Value(16)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(24)).current;
  const achieveOpacity = useRef(new Animated.Value(0)).current;
  const achieveY = useRef(new Animated.Value(24)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(20)).current;

  // Header chip
  const headerScale = useRef(new Animated.Value(1)).current;

  // Trophy float + glow pulse
  const trophyFloat = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  // Flying XP
  const flyY = useRef(new Animated.Value(0)).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const flyOpacity = useRef(new Animated.Value(0)).current;

  // Particles (created once, no hooks in loop)
  const particlesRef = useRef<Particle[]>([]);
  if (particlesRef.current.length === 0) {
    particlesRef.current = Array.from({ length: 14 }, () => ({
      size: 4 + Math.random() * 7,
      left: 8 + Math.random() * 84,
      top: 6 + Math.random() * 84,
      delay: Math.random() * 1600,
      duration: 1800 + Math.random() * 1800,
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.4),
    }));
  }
  const particles = particlesRef.current;

  const [xpTrigger, setXpTrigger] = useState(false);
  const [accTrigger, setAccTrigger] = useState(false);
  const displayXP = useCountUp(xpEarned, 1100, xpTrigger ? 0 : Infinity);
  const displayAccuracy = useCountUp(accuracy, 1000, accTrigger ? 0 : Infinity);
  const finalTotalXP = currentTotalXP + xpEarned;

  useEffect(() => {
    sfx.complete();

    // Badge
    Animated.parallel([
      Animated.timing(badgeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.spring(ringScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start(() => haptics.success());

    // Float + glow loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyFloat, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(trophyFloat, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();

    // Particles
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 1, duration: p.duration * 0.25, useNativeDriver: true }),
            Animated.timing(p.translateY, { toValue: -28 - Math.random() * 40, duration: p.duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(p.scale, { toValue: 1, duration: p.duration * 0.3, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 0, duration: p.duration * 0.3, useNativeDriver: true }),
            Animated.timing(p.scale, { toValue: 0.3, duration: p.duration * 0.3, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    });

    // Staggered content
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
    seq(achieveOpacity, achieveY, 750);
    seq(buttonOpacity, buttonY, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaim = () => {
    if (claimed) return;
    haptics.success();
    sfx.pick();
    setShowFlyingXP(true);
    flyY.setValue(0);
    flyScale.setValue(1.2);
    flyOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(flyY, { toValue: -SCREEN_HEIGHT * 0.78, duration: 950, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), useNativeDriver: true }),
      Animated.timing(flyScale, { toValue: 0.4, duration: 950, useNativeDriver: true }),
      Animated.timing(flyOpacity, { toValue: 0, duration: 800, delay: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowFlyingXP(false);
      setClaimed(true);
      Animated.sequence([
        Animated.timing(headerScale, { toValue: 1.3, duration: 160, useNativeDriver: true }),
        Animated.spring(headerScale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
      ]).start();
      haptics.success();
      setTimeout(onContinue, 1100);
    });
  };

  const floatY = trophyFloat.interpolate({ inputRange: [0, 1], outputRange: [4, -8] });
  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });

  // The API sends `null` (not undefined) when no rewards were granted, so the
  // destructuring default above doesn't apply — normalize defensively here.
  const safeRewards = newRewards ?? [];
  const hasAchievements = safeRewards.length > 0;

  return (
    <LinearGradient
      colors={["#1b3a1d", "#16231a", theme.colors.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.9 }}
      style={styles.container}
    >
      {/* Header chip */}
      <Animated.View style={[styles.headerChip, { transform: [{ scale: headerScale }] }]}>
        <Text style={styles.headerEmoji}>🔥</Text>
        <Text style={styles.headerLabel}>TOTAL XP</Text>
        <Text style={styles.headerValue}>
          {(claimed ? finalTotalXP : currentTotalXP).toLocaleString()}
        </Text>
        {claimed && <Text style={styles.headerPlus}>+{xpEarned}</Text>}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <Animated.View
          style={[styles.badgeFrame, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}
        >
          <Animated.View
            style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
          />
          <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }] }]} />
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <Trophy size={104} color={theme.colors.secondary} fill={theme.colors.secondary} strokeWidth={1.5} />
          </Animated.View>

          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  width: p.size,
                  height: p.size,
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  opacity: p.opacity,
                  transform: [{ translateY: p.translateY }, { scale: p.scale }],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Headline */}
        <Animated.View
          style={[styles.headline, { opacity: headlineOpacity, transform: [{ translateY: headlineY }] }]}
        >
          <Text style={styles.title}>Level Complete!</Text>
          <Text style={styles.subtitle}>
            {levelTitle ? `MashaAllah — ${levelTitle} done!` : "MashaAllah, beautifully done!"}
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          style={[styles.statsRow, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}
        >
          <View style={[styles.statCard, styles.statXp]}>
            <Star size={16} color={theme.colors.onSecondary} fill={theme.colors.onSecondary} />
            <Text style={[styles.statValue, styles.statValueDark]}>{displayXP}</Text>
            <Text style={[styles.statLabel, styles.statLabelDark]}>XP</Text>
          </View>
          <View style={[styles.statCard, styles.statAcc]}>
            <Target size={16} color={theme.colors.onPrimary} />
            <Text style={[styles.statValue, styles.statValueDark]}>{displayAccuracy}%</Text>
            <Text style={[styles.statLabel, styles.statLabelDark]}>ACCURACY</Text>
          </View>
          <View style={[styles.statCard, styles.statTime]}>
            <Clock size={16} color={theme.colors.text} />
            <Text style={[styles.statValue, styles.statValueLight]}>{timeString}</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>TIME</Text>
          </View>
        </Animated.View>

        {/* Achievements / unlock */}
        <Animated.View
          style={[styles.achieveBlock, { opacity: achieveOpacity, transform: [{ translateY: achieveY }] }]}
        >
          {treasureOpen && (
            <View style={styles.treasure}>
              <Gift size={20} color={theme.colors.secondary} />
              <Text style={styles.treasureText}>Treasure chest opened! 🎁</Text>
            </View>
          )}

          {hasAchievements ? (
            <>
              <View style={styles.achieveHeadingRow}>
                <Sparkles size={13} color={theme.colors.secondary} />
                <Text style={styles.achieveHeading}>NEW ACHIEVEMENTS</Text>
              </View>
              {safeRewards.map((r) => {
                const rt = rarityTheme(r.rarity);
                return (
                  <View key={r.id} style={[styles.achieveCard, { borderColor: rt.border }]}>
                    <View style={[styles.achieveIcon, { backgroundColor: rt.iconBg }]}>
                      <RewardIcon icon={r.icon} color={rt.iconColor} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.achieveTitle}>{r.title}</Text>
                      <Text style={styles.achieveDesc} numberOfLines={2}>
                        {r.description}
                      </Text>
                    </View>
                    <View style={[styles.rarityPill, { backgroundColor: rt.pillBg }]}>
                      <Text style={[styles.rarityText, { color: rt.pillText }]}>
                        {r.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : unlockReward ? (
            <View style={[styles.achieveCard, { borderColor: theme.colors.secondary30 }]}>
              <View style={[styles.achieveIcon, { backgroundColor: theme.colors.secondary10 }]}>
                <Trophy size={22} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.achieveHeadingInline}>ACHIEVEMENT UNLOCKED</Text>
                <Text style={styles.achieveTitle}>{formatReward(unlockReward)}</Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <Animated.View
        style={[styles.footer, { opacity: buttonOpacity, transform: [{ translateY: buttonY }] }]}
      >
        <TactilePressable
          edgeColor={
            claimed ? theme.colors.surfaceLow : theme.colors.primaryContainer
          }
          depth={6}
          radius={20}
          haptic="medium"
          dimWhenDisabled={false}
          faceStyle={[styles.claimBtn, claimed && styles.claimedBtn]}
          onPress={handleClaim}
          disabled={claimed}
        >
          <Text style={[styles.claimText, claimed && styles.claimedText]}>
            {claimed ? "CLAIMED! 🎉" : "CLAIM REWARDS"}
          </Text>
        </TactilePressable>

        {showFlyingXP && (
          <Animated.View
            style={[
              styles.flyingXp,
              { transform: [{ translateY: flyY }, { scale: flyScale }], opacity: flyOpacity },
            ]}
          >
            <Text style={styles.flyingXpText}>+{xpEarned} XP</Text>
          </Animated.View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },

  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: theme.colors.black20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.white10,
    marginTop: 4,
  },
  headerEmoji: { fontSize: 14 },
  headerLabel: { fontSize: 11, fontWeight: "800", color: theme.colors.white60, letterSpacing: 0.5 },
  headerValue: { fontSize: 15, fontWeight: "900", color: theme.colors.secondary },
  headerPlus: { fontSize: 12, fontWeight: "900", color: theme.colors.primary },

  scrollView: { flex: 1, width: "100%" },
  scroll: { alignItems: "center", paddingBottom: 16 },

  badgeFrame: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  glow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: theme.colors.secondary,
  },
  ring: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: theme.colors.secondary30,
    backgroundColor: theme.colors.secondary08,
  },
  particle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
  },

  headline: { alignItems: "center", marginTop: 4, marginBottom: 22 },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.colors.white,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.white70,
    textAlign: "center",
    marginTop: 6,
  },

  statsRow: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 22 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 5,
  },
  statXp: { backgroundColor: theme.colors.secondary, borderBottomColor: theme.colors.goldDark },
  statAcc: { backgroundColor: theme.colors.primary, borderBottomColor: theme.colors.primaryContainer },
  statTime: { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceLow },
  statValue: { fontSize: 22, fontWeight: "900" },
  statValueDark: { color: theme.colors.background },
  statValueLight: { color: theme.colors.text },
  statLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  statLabelDark: { color: theme.colors.background, opacity: 0.75 },
  statLabelLight: { color: theme.colors.textMuted },

  achieveBlock: { width: "100%", gap: 10 },
  achieveHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  achieveHeading: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.secondary,
    letterSpacing: 1,
  },
  achieveHeadingInline: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  treasure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.secondary10,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.secondary25,
  },
  treasureText: { color: theme.colors.secondary, fontWeight: "800", fontSize: 13 },
  achieveCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1.5,
  },
  achieveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  achieveTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  achieveDesc: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  rarityPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  rarityText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },

  footer: { paddingVertical: 16, position: "relative" },
  claimBtn: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  claimedBtn: { backgroundColor: theme.colors.surface },
  claimText: { color: theme.colors.onPrimary, fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
  claimedText: { color: theme.colors.textMuted },
  flyingXp: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.goldDark,
  },
  flyingXpText: { fontWeight: "900", fontSize: 18, color: theme.colors.background },
});
