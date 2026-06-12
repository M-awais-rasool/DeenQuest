import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

/**
 * Lightweight star-burst used as the "you did it!" reward moment.
 * Renders nothing until `trigger` changes to a new positive value, then
 * fires a one-shot burst of emoji particles radiating from its center.
 *
 * Pure RN core Animated on the native driver; particles only exist in the
 * tree while the burst is running, so idle cost is zero.
 */

const EMOJIS = ["⭐", "✨", "🌟", "💫"];
const COUNT = 12;
const DURATION = 750;

type Particle = {
  anim: Animated.Value;
  emoji: string;
  angle: number;
  dist: number;
  size: number;
  spin: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    anim: new Animated.Value(0),
    emoji: EMOJIS[i % EMOJIS.length],
    // Even spread with a little jitter so each burst looks unique.
    angle: (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.6,
    dist: 70 + Math.random() * 60,
    size: 14 + Math.random() * 12,
    spin: Math.random() > 0.5 ? 1 : -1,
  }));
}

export function CelebrationOverlay({ trigger }: { trigger: number }) {
  const [bursting, setBursting] = useState(false);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    particles.current = makeParticles();
    setBursting(true);
    Animated.stagger(
      14,
      particles.current.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ).start(() => setBursting(false));
  }, [trigger]);

  if (!bursting) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={s.center}>
        {particles.current.map((p, i) => {
          const translateX = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(p.angle) * p.dist],
          });
          // Slight upward bias so stars feel like they leap before falling.
          const translateY = p.anim.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [
              0,
              Math.sin(p.angle) * p.dist - 18,
              Math.sin(p.angle) * p.dist + 8,
            ],
          });
          const opacity = p.anim.interpolate({
            inputRange: [0, 0.1, 0.7, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = p.anim.interpolate({
            inputRange: [0, 0.25, 1],
            outputRange: [0.3, 1.15, 0.7],
          });
          const rotate = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", `${p.spin * 160}deg`],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                opacity,
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
              }}
            >
              <Text style={{ fontSize: p.size }}>{p.emoji}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CelebrationOverlay;
