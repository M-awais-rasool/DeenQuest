import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { dq } from "../../theme/designTokens";
import { haptics } from "../../utils/haptics";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { PRAYER_LABELS } from "../../types/prayer";
import { ADHAN_SOUND } from "../../services/adhanAudio";
import { getPrayerSettings } from "../../hooks/usePrayerSettings";
import { computeTimes, formatTime } from "../../utils/prayerTimes";
import { scheduleTestAdhanInSeconds } from "../../services/adhanScheduler";

type Props = NativeStackScreenProps<AppStackParamList, "AdhanAlarm">;

const SCREEN_W = Dimensions.get("window").width;
const GLOW = 540;

export function AdhanScreen({ route, navigation }: Props) {
  const prayer = route.params?.prayer ?? "fajr";
  const label = PRAYER_LABELS[prayer] ?? "Prayer";

  const timeStr = useMemo(() => {
    const loc = getPrayerSettings().location;
    if (!loc) return null;
    const { method, madhab } = getPrayerSettings();
    const t = computeTimes(loc.coords, new Date(), method, madhab).find(
      (x) => x.name === prayer,
    );
    if (!t) return null;
    const { time, suffix } = formatTime(t.date);
    return `${time} ${suffix}`;
  }, [prayer]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Demo", { screen: "HomeScreen" });
  }, [navigation]);

  const stopSound = useCallback(async () => {
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
    } catch {
      // already unloaded
    }
    soundRef.current = null;
  }, []);

  const stop = useCallback(async () => {
    void haptics.heavy();
    await stopSound();
    dismiss();
  }, [stopSound, dismiss]);

  const snooze = useCallback(async () => {
    void haptics.medium();
    await stopSound();
    await scheduleTestAdhanInSeconds(prayer, 5 * 60);
    dismiss();
  }, [stopSound, dismiss, prayer]);

  // Load + play the Adhan; auto-dismiss when it finishes.
  useEffect(() => {
    let mounted = true;
    void haptics.success();
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          ADHAN_SOUND,
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) dismiss();
          },
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {
        // Audio failed — the screen still shows and STOP still dismisses.
      }
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [dismiss]);

  // Float (moon) + pulse (now-playing dot / ring) loops.
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    floatLoop.start();
    pulseLoop.start();
    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [float, pulse]);

  const insets = useSafeAreaInsets();
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const dotOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 1],
  });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#0A1A2A", "#0D2433", "#0F2E2B", "#08201C"]}
        locations={[0, 0.44, 0.76, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* gold glow */}
      <Svg
        pointerEvents="none"
        width={GLOW}
        height={GLOW}
        style={{ position: "absolute", top: 70, left: (SCREEN_W - GLOW) / 2 }}
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#EFB65A" stopOpacity={0.2} />
            <Stop offset="0.58" stopColor="#EFB65A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={GLOW} height={GLOW} fill="url(#glow)" />
      </Svg>

      {/* decorative stars */}
      <Text style={[s.star, { top: 96 + insets.top, left: 52, color: "#F9DDA0", fontSize: 15 }]}>
        ✦
      </Text>
      <Text style={[s.star, { top: 150 + insets.top, right: 58, color: "#9AD5F2", fontSize: 11 }]}>
        ✦
      </Text>
      <View style={[s.dotStar, { top: 230 + insets.top, left: 76, backgroundColor: "#9AD5F2" }]} />
      <View style={[s.dotStar, { top: 70 + insets.top, right: 110, backgroundColor: "#F9DDA0" }]} />

      <View style={[s.content, { paddingTop: insets.top + 14 }]}>
        {/* now playing pill */}
        <View style={s.pill}>
          <Animated.View style={[s.pillDot, { opacity: dotOpacity }]} />
          <Text style={s.pillText}>ADHAN · NOW PLAYING</Text>
        </View>

        {/* center */}
        <View style={s.center}>
          <View style={s.moonWrap}>
            <Animated.View
              style={[
                s.expandRing,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <View style={s.ringInner} />
            <View style={s.ringOuter} />
            <Animated.View style={{ transform: [{ translateY }] }}>
              <CrescentMoon />
            </Animated.View>
          </View>

          <Text style={s.arabicBig}>حَيَّ عَلَى الصَّلَاةِ</Text>
          <Text style={s.comeToPrayer}>COME TO PRAYER</Text>

          <View style={s.nameRow}>
            <Text style={s.prayerName}>{label}</Text>
            {timeStr ? <Text style={s.prayerTime}>{timeStr}</Text> : null}
          </View>

          {prayer === "fajr" ? (
            <Text style={s.arabicSmall}>الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ</Text>
          ) : null}
        </View>
      </View>

      {/* mosque skyline */}
      <MosqueSkyline />

      {/* actions */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TactilePressable
          style={{ alignSelf: "stretch" }}
          faceStyle={s.stopFace}
          edgeColor="#B97F1E"
          radius={22}
          depth={6}
          haptic="heavy"
          onPress={stop}
        >
          <LinearGradient
            colors={["#F7D48E", "#E29A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.stopGrad}
          >
            <Text style={s.stopText}>STOP ADHAN</Text>
          </LinearGradient>
        </TactilePressable>

        <AnimatedPressable style={s.snoozeBtn} onPress={snooze}>
          <Text style={s.snoozeText}>SNOOZE · 5 MIN</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

/** Golden crescent + star (ported from the design SVG). */
function CrescentMoon() {
  return (
    <Svg width={128} height={128} viewBox="0 0 100 100">
      <Defs>
        <SvgLinearGradient
          id="adg"
          x1="20"
          y1="16"
          x2="70"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#FFE9AE" />
          <Stop offset="1" stopColor="#E29A2E" />
        </SvgLinearGradient>
      </Defs>
      <G rotation={-18} origin="50, 50">
        <Path d="M62 8 A44 44 0 1 0 62 92 A54 54 0 0 1 62 8 Z" fill="url(#adg)" />
      </G>
      <Path
        d="M66 36 l3.2 7 7 3.2-7 3.2-3.2 7-3.2-7-7-3.2 7-3.2z"
        fill="#FDF6E3"
      />
      <Circle cx={76} cy={24} r={2} fill="#FDF6E3" opacity={0.9} />
    </Svg>
  );
}

/** Mosque silhouette skyline (ported from the design SVG). */
function MosqueSkyline() {
  return (
    <Svg
      width={SCREEN_W}
      height={158}
      viewBox="30 22 330 194"
      preserveAspectRatio="xMidYMax slice"
      style={{ marginBottom: -1 }}
    >
      <G fill="#04101A">
        <Rect x={0} y={156} width={390} height={60} />
        <Path d="M195 64 C240 90 254 122 254 156 H136 C136 122 150 90 195 64 Z" />
        <Rect x={193} y={46} width={4} height={20} rx={2} />
        <Path d="M195 32 A7 7 0 1 0 195 46 A9 9 0 0 1 195 32 Z" />
        <Path d="M112 116 C136 130 144 144 144 158 H80 C80 144 88 130 112 116 Z" />
        <Path d="M278 116 C302 130 310 144 310 158 H246 C246 144 254 130 278 116 Z" />
        <Rect x={34} y={76} width={13} height={92} rx={6} />
        <Path d="M40.5 50 L50 76 H31 Z" />
        <Circle cx={40.5} cy={45} r={3.2} />
        <Rect x={343} y={76} width={13} height={92} rx={6} />
        <Path d="M349.5 50 L359 76 H340 Z" />
        <Circle cx={349.5} cy={45} r={3.2} />
      </G>
      <G fill="#EFB65A">
        <Path d="M188 156 v-17 a7 7 0 0 1 14 0 v17 z" opacity={0.85} />
        <Path d="M106 158 v-12 a6 6 0 0 1 12 0 v12 z" opacity={0.55} />
        <Path d="M272 158 v-12 a6 6 0 0 1 12 0 v12 z" opacity={0.55} />
      </G>
    </Svg>
  );
}

export default AdhanScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08201C", overflow: "hidden" },
  star: { position: "absolute", opacity: 0.65 },
  dotStar: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
  },
  content: { flex: 1, paddingHorizontal: 26 },

  pill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(239,182,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,182,90,0.40)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#EFB65A" },
  pillText: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    color: "#F5CE8A",
    letterSpacing: 1.6,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  moonWrap: { width: 214, height: 214, alignItems: "center", justifyContent: "center" },
  expandRing: {
    position: "absolute",
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: "rgba(239,182,90,0.28)",
  },
  ringInner: {
    position: "absolute",
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: "rgba(239,182,90,0.28)",
  },
  ringOuter: {
    position: "absolute",
    width: 214,
    height: 214,
    borderRadius: 107,
    borderWidth: 1,
    borderColor: "rgba(239,182,90,0.12)",
  },
  arabicBig: {
    fontSize: 33,
    fontFamily: "Amiri_700Bold",
    color: "#F5CE8A",
    marginTop: 40,
    textShadowColor: "rgba(239,182,90,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  comeToPrayer: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: "#9AD5F2",
    letterSpacing: 3,
    marginTop: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginTop: 20,
  },
  prayerName: {
    fontSize: 46,
    lineHeight: 48,
    fontFamily: "Nunito_900Black",
    color: dq.text,
  },
  prayerTime: { fontSize: 19, fontFamily: "Nunito_800ExtraBold", color: dq.gold },
  arabicSmall: {
    fontSize: 16,
    fontFamily: "Amiri_700Bold",
    color: "#7E9997",
    marginTop: 10,
  },

  footer: {
    backgroundColor: "#04101A",
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 12,
  },
  stopFace: { backgroundColor: "#E29A2E", borderRadius: 22 },
  stopGrad: {
    borderRadius: 22,
    paddingVertical: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  stopText: {
    fontSize: 16,
    fontFamily: "Nunito_900Black",
    color: "#3A2408",
    letterSpacing: 1.6,
  },
  snoozeBtn: {
    borderWidth: 2,
    borderColor: "rgba(154,213,242,0.35)",
    borderRadius: 20,
    paddingVertical: 13,
    alignItems: "center",
  },
  snoozeText: {
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    color: "#9AD5F2",
    letterSpacing: 1.2,
  },
});
