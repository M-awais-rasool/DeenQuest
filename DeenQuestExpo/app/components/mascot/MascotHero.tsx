import React, { memo, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Moon, Sparkles, Star } from "lucide-react-native";
import { theme } from "../../theme/themes";
import { FloatingMascot } from "../ui";

const MASCOT = require("../../../assets/login-logo.png");

const GlowDot = memo(function GlowDot({
  core,
  color,
}: {
  core: number;
  color: string;
}) {
  const mid = core * 2;
  const outer = core * 3.2;
  return (
    <View style={[s.dotWrap, { width: outer, height: outer }]}>
      <View
        style={{
          position: "absolute",
          width: outer,
          height: outer,
          borderRadius: outer,
          backgroundColor: color,
          opacity: 0.1,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: mid,
          height: mid,
          borderRadius: mid,
          backgroundColor: color,
          opacity: 0.24,
        }}
      />
      <View
        style={{
          width: core,
          height: core,
          borderRadius: core,
          backgroundColor: color,
        }}
      />
    </View>
  );
});

/* ----------------------------- twinkle ------------------------------- */

type TwinkleProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger so accents never blink in unison. */
  delay?: number;
  /** Add a gentle vertical drift on top of the twinkle. */
  float?: boolean;
};

const Twinkle = memo(function Twinkle({
  children,
  style,
  delay = 0,
  float = false,
}: TwinkleProps) {
  const t = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sine = Easing.inOut(Easing.sin);
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: 1300,
          easing: sine,
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 1300,
          easing: sine,
          useNativeDriver: true,
        }),
      ]),
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 2600,
          easing: sine,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 2600,
          easing: sine,
          useNativeDriver: true,
        }),
      ]),
    );
    twinkle.start();
    if (float) floatLoop.start();
    return () => {
      twinkle.stop();
      floatLoop.stop();
    };
  }, [t, drift, delay, float]);

  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.12] });
  const translateY = float
    ? drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] })
    : 0;

  return (
    <Animated.View
      style={[
        s.accent,
        style,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
});

/* ------------------------------ stage -------------------------------- */

export const MascotHero = memo(function MascotHero({
  size = 220,
}: {
  size?: number;
}) {
  const stage = size * 1.78;
  const center = stage / 2;

  // Place a point on a ring: `r` px from centre, `deg` measured clockwise
  // from the top. `box` is the dot's own size, so it stays centred on the ring.
  const onRing = (r: number, deg: number, box: number): ViewStyle => {
    const rad = (deg * Math.PI) / 180;
    return {
      position: "absolute",
      top: center - r * Math.cos(rad) - box / 2,
      left: center + r * Math.sin(rad) - box / 2,
    };
  };

  const outerR = stage * 0.43; // matches ring r=86 in the 0..200 viewBox
  const innerR = stage * 0.34; // matches ring r=68
  const cometBox = size * 0.06 * 3.2;
  const dotBox = size * 0.035 * 3.2;

  const entrance = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const spinReverse = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      friction: 7,
      tension: 55,
      useNativeDriver: true,
    }).start();

    const sine = Easing.inOut(Easing.sin);
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 26000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.timing(spinReverse, {
          toValue: 1,
          duration: 34000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 2600,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 2600,
            easing: sine,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bloom, {
            toValue: 1,
            duration: 1900,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(bloom, {
            toValue: 0,
            duration: 1900,
            easing: sine,
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [entrance, spin, spinReverse, pulse, bloom]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const rotateReverse = spinReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.92],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });
  const bloomOpacity = bloom.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const bloomScale = bloom.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.1],
  });
  const entranceScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View
      style={[
        s.root,
        {
          width: stage,
          height: stage,
          opacity: entrance,
          transform: [{ scale: entranceScale }],
        },
      ]}
    >
      {/* Wide ambient glow — the softest, furthest layer */}
      <View style={[StyleSheet.absoluteFill, s.center]}>
        <Svg width={stage} height={stage} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="ambient" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0%"
                stopColor={theme.colors.primary}
                stopOpacity={0.22}
              />
              <Stop
                offset="55%"
                stopColor={theme.colors.primary}
                stopOpacity={0.06}
              />
              <Stop
                offset="100%"
                stopColor={theme.colors.primary}
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="100" fill="url(#ambient)" />
        </Svg>
      </View>

      {/* Main halo — gently breathes behind the mascot */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          s.center,
          { opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      >
        <Svg width={stage} height={stage} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0%"
                stopColor={theme.colors.primary}
                stopOpacity={0.5}
              />
              <Stop
                offset="36%"
                stopColor={theme.colors.primary}
                stopOpacity={0.16}
              />
              <Stop
                offset="70%"
                stopColor={theme.colors.secondary}
                stopOpacity={0.06}
              />
              <Stop
                offset="100%"
                stopColor={theme.colors.primary}
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="100" fill="url(#halo)" />
        </Svg>
      </Animated.View>

      {/* Core bloom — bright concentrated light right behind the mascot */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          s.center,
          { opacity: bloomOpacity, transform: [{ scale: bloomScale }] },
        ]}
      >
        <Svg width={stage} height={stage} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0%"
                stopColor={theme.colors.white}
                stopOpacity={0.4}
              />
              <Stop
                offset="35%"
                stopColor={theme.colors.primary}
                stopOpacity={0.22}
              />
              <Stop
                offset="100%"
                stopColor={theme.colors.primary}
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="42" fill="url(#bloom)" />
        </Svg>
      </Animated.View>

      {/* Faint solid containment ring */}
      <View style={[StyleSheet.absoluteFill, s.center]}>
        <Svg width={stage} height={stage} viewBox="0 0 200 200">
          <Circle
            cx="100"
            cy="100"
            r="57"
            fill="none"
            stroke={theme.colors.primary}
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* Outer orbit — dashed, slow clockwise, carrying a bright comet dot */}
      <Animated.View
        style={[StyleSheet.absoluteFill, s.center, { transform: [{ rotate }] }]}
      >
        <Svg
          width={stage}
          height={stage}
          viewBox="0 0 200 200"
          style={StyleSheet.absoluteFill}
        >
          <Circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke={theme.colors.primary}
            strokeOpacity={0.22}
            strokeWidth={1.4}
            strokeDasharray="2 12"
            strokeLinecap="round"
          />
        </Svg>
        <View style={onRing(outerR, 28, cometBox)}>
          <GlowDot core={size * 0.06} color={theme.colors.secondary} />
        </View>
      </Animated.View>

      {/* Inner orbit — finer, counter-rotating, with two companion dots */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          s.center,
          { transform: [{ rotate: rotateReverse }] },
        ]}
      >
        <Svg
          width={stage}
          height={stage}
          viewBox="0 0 200 200"
          style={StyleSheet.absoluteFill}
        >
          <Circle
            cx="100"
            cy="100"
            r="68"
            fill="none"
            stroke={theme.colors.secondary}
            strokeOpacity={0.16}
            strokeWidth={1}
            strokeDasharray="1 15"
            strokeLinecap="round"
          />
        </Svg>
        <View style={onRing(innerR, 165, dotBox)}>
          <GlowDot core={size * 0.035} color={theme.colors.primary} />
        </View>
        <View style={onRing(innerR, 310, dotBox)}>
          <GlowDot core={size * 0.03} color={theme.colors.primary} />
        </View>
      </Animated.View>

      {/* Scattered particle field — faint twinkling dust */}
      <Twinkle style={{ top: stage * 0.2, left: stage * 0.24 }} delay={300}>
        <View style={[s.particle, { backgroundColor: theme.colors.primary }]} />
      </Twinkle>
      <Twinkle style={{ top: stage * 0.16, right: stage * 0.3 }} delay={1200}>
        <View
          style={[s.particle, { backgroundColor: theme.colors.secondary }]}
        />
      </Twinkle>
      <Twinkle style={{ bottom: stage * 0.32, left: stage * 0.3 }} delay={700}>
        <View style={[s.particle, { backgroundColor: theme.colors.white70 }]} />
      </Twinkle>
      <Twinkle
        style={{ bottom: stage * 0.26, right: stage * 0.26 }}
        delay={1800}
      >
        <View style={[s.particle, { backgroundColor: theme.colors.primary }]} />
      </Twinkle>

      {/* Grounding glow beneath the mascot */}
      <View
        style={[
          s.pedestal,
          {
            width: size * 0.62,
            height: size * 0.13,
            borderRadius: size,
            bottom: stage * 0.205,
          },
        ]}
      />

      {/* The mascot itself, floating + breathing */}
      <View style={[StyleSheet.absoluteFill, s.center]}>
        <FloatingMascot
          source={MASCOT}
          size={size}
          floatDistance={size * 0.045}
          breathScale={1.03}
          duration={2200}
        />
      </View>

      {/* Twinkling accents orbiting the stage */}
      <Twinkle
        style={{ top: stage * 0.11, right: stage * 0.13 }}
        delay={0}
        float
      >
        <Star
          size={size * 0.17}
          color={theme.colors.secondary}
          fill={theme.colors.secondary}
        />
      </Twinkle>
      <Twinkle style={{ top: stage * 0.27, left: stage * 0.07 }} delay={850}>
        <Sparkles size={size * 0.12} color={theme.colors.primary} />
      </Twinkle>
      <Twinkle
        style={{ bottom: stage * 0.27, right: stage * 0.09 }}
        delay={1500}
      >
        <Sparkles size={size * 0.09} color={theme.colors.secondary} />
      </Twinkle>
      <Twinkle
        style={{ top: stage * 0.05, left: stage * 0.31 }}
        delay={2100}
        float
      >
        <Moon
          size={size * 0.11}
          color={theme.colors.primary}
          fill={theme.colors.primary}
        />
      </Twinkle>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  dotWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  pedestal: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    opacity: 0.13,
  },
  particle: {
    width: 4,
    height: 4,
    borderRadius: 4,
  },
  accent: {
    position: "absolute",
  },
});

export default MascotHero;
