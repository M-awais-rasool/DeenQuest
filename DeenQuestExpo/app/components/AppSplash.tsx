import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { dq } from "../theme/designTokens";
import {
  getCurrentAppIconMood,
  LAST_MOOD_KEY,
  normalizeOverride,
  type Mood,
} from "../services/appIcon";

// Noor artwork per mood, so the splash mirrors the current dynamic app icon.
// Static requires (Metro resolves them at build time). "happy" is logo.png.
const MOOD_IMAGES: Record<Mood, ImageSourcePropType> = {
  happy: require("../../assets/logo/logo.png"),
  onfire: require("../../assets/logo/logo-1.png"),
  worried: require("../../assets/logo/logo-2.png"),
  fading: require("../../assets/logo/logo-3.png"),
  sleeping: require("../../assets/logo/logo-4.png"),
  celebrating: require("../../assets/logo/logo-5.png"),
};

const TRACK_W = 196;
const PROGRESS_MS = 1700;
const EXIT_MS = 380;

const SPARKLES: {
  top: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  size: number;
  color: string;
  radius: number;
  rotate: string;
  delay: number;
}[] = [
  { top: "20%", left: "16%", size: 13, color: dq.green, radius: 4, rotate: "20deg", delay: 0 },
  { top: "23%", right: "20%", size: 12, color: dq.gold, radius: 6, rotate: "45deg", delay: 350 },
  { top: "70%", right: "17%", size: 10, color: "#6EC1E8", radius: 5, rotate: "0deg", delay: 700 },
  { top: "76%", left: "14%", size: 12, color: "#A78BFA", radius: 3, rotate: "45deg", delay: 500 },
];

function Sparkle({ s }: { s: (typeof SPARKLES)[number] }) {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          delay: s.delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, s.delay]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: s.top,
        left: s.left,
        right: s.right,
        width: s.size,
        height: s.size,
        borderRadius: s.radius,
        backgroundColor: s.color,
        opacity: pulse,
        transform: [{ rotate: s.rotate }],
      }}
    />
  );
}

export function AppSplash({
  appReady,
  onDone,
  onLayout,
}: {
  appReady: boolean;
  onDone: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const root = useRef(new Animated.Value(1)).current; // exit fade
  const logo = useRef(new Animated.Value(0)).current; // logo fade+scale in
  const content = useRef(new Animated.Value(0)).current; // wordmark/tagline in
  const progress = useRef(new Animated.Value(0)).current; // loading bar fill

  // Which Noor to show: the current device icon's mood, falling back to the
  // last persisted mood when the native icon module isn't available yet.
  const [mood, setMood] = useState<Mood>(() => getCurrentAppIconMood() ?? "happy");
  useEffect(() => {
    if (getCurrentAppIconMood() != null) return;
    AsyncStorage.getItem(LAST_MOOD_KEY)
      .then((v) => {
        const m = normalizeOverride(v);
        if (m) setMood(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logo, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(content, {
        toValue: 1,
        duration: 520,
        delay: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 0.92,
        duration: PROGRESS_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [logo, content, progress]);

  // When the app is ready: finish the bar, then fade out and hand off.
  useEffect(() => {
    if (!appReady) return;
    Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(root, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [appReady, progress, root, onDone]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_W],
  });

  return (
    <Animated.View
      style={[styles.root, { opacity: root }]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      <StatusBar style="light" />

      {/* Center glow behind Noor */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="42%" r="62%">
            <Stop offset="0" stopColor="#123B34" stopOpacity="0.9" />
            <Stop offset="0.55" stopColor="#0C1E1E" stopOpacity="1" />
            <Stop offset="1" stopColor={dq.screen} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      {SPARKLES.map((s, i) => (
        <Sparkle key={i} s={s} />
      ))}

      {/* Brand block */}
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logo,
            transform: [
              { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
            ],
          }}
        >
          <Image source={MOOD_IMAGES[mood]} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View
          style={{
            opacity: content,
            transform: [
              { translateY: content.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          }}
        >
          <Text style={styles.wordmark}>
            <Text style={styles.wordDeen}>Deen</Text>
            <Text style={styles.wordQuest}>Quest</Text>
          </Text>
          <Text style={styles.tagline}>LEARN · PLAY · GROW</Text>
        </Animated.View>
      </View>

      {/* Loading */}
      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.fillClip, { width: fillWidth }]}>
            <LinearGradient
              colors={[dq.green, dq.greenBright, dq.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fill}
            />
          </Animated.View>
        </View>
        <Text style={styles.loading}>
          <Text style={styles.bismillah}>بِسْمِ اللّٰه</Text>
          <Text style={styles.loadingDot}>{"  ·  "}</Text>
          Loading your journey…
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: dq.screen,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  center: {
    alignItems: "center",
    gap: 26,
    marginBottom: 40,
  },
  logo: {
    width: 132,
    height: 132,
    borderRadius: 30,
    shadowColor: dq.green,
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
  },
  wordmark: {
    fontSize: 34,
    fontFamily: "Nunito_900Black",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  wordDeen: { color: dq.text },
  wordQuest: { color: dq.gold },
  tagline: {
    marginTop: 10,
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 4,
    textAlign: "center",
    color: dq.faint,
  },
  bottom: {
    position: "absolute",
    bottom: "12%",
    alignItems: "center",
    gap: 18,
  },
  track: {
    width: TRACK_W,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(237,245,244,0.08)",
    overflow: "hidden",
  },
  fillClip: {
    height: "100%",
    overflow: "hidden",
  },
  fill: {
    width: TRACK_W,
    height: "100%",
    borderRadius: 3,
  },
  loading: {
    fontSize: 13.5,
    color: dq.muted,
    fontFamily: "Nunito_700Bold",
  },
  bismillah: {
    fontFamily: "Amiri_700Bold",
    fontSize: 15,
    color: dq.faint,
  },
  loadingDot: { color: dq.chevron },
});
