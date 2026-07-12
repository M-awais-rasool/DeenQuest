import React, { useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TactilePressable, AnimatedPressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { setOnboardingCompleted } from "../../store/storage/authStorage";
import { useAppSelector } from "../../store/hooks";
import type { RootState } from "../../store";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "OnboardingScreen">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ───────────────────────── Hero illustrations (A1 mocks) ───────────────── */

/** Slide 1 — mosque under a golden moon. */
function HeroMosque() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 342 360" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="m1bg" cx="0.5" cy="0.16" r="1">
          <Stop offset="0" stopColor="#1B4E42" />
          <Stop offset="0.55" stopColor="#0E2327" />
          <Stop offset="1" stopColor="#0A171A" />
        </RadialGradient>
        <LinearGradient id="m1g" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBE3A8" />
          <Stop offset="1" stopColor="#D6912F" />
        </LinearGradient>
        <RadialGradient id="m1w" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#F9DDA0" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#F9DDA0" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="m1m" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F5F4E" />
          <Stop offset="1" stopColor="#0C2925" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="342" height="360" fill="url(#m1bg)" />
      <Circle cx="258" cy="66" r="60" fill="url(#m1w)" />
      <Circle cx="258" cy="66" r="42" stroke="#F9DDA0" strokeWidth="1.5" strokeDasharray="2 10" opacity="0.45" />
      <Path d="M258 38 A28 28 0 1 0 258 94 A37 37 0 0 1 258 38 Z" fill="url(#m1g)" transform="rotate(-24 258 66)" />
      <Path d="M56 44l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#F9DDA0" />
      <Rect x="300" y="140" width="7" height="7" transform="rotate(45 303.5 143.5)" fill="#5EE0CE" opacity="0.9" />
      <Rect x="36" y="120" width="6" height="6" transform="rotate(45 39 123)" fill="#A78BFA" opacity="0.9" />
      <Circle cx="112" cy="70" r="2.5" fill="#9AD5F2" />
      <Circle cx="180" cy="42" r="2" fill="#F8A9CC" />
      <Circle cx="80" cy="160" r="2" fill="#5EE0CE" opacity="0.8" />
      <Circle cx="146" cy="112" r="1.8" fill="#F9DDA0" opacity="0.8" />
      <G opacity="0.5" fill="#143630">
        <Rect x="0" y="252" width="342" height="108" />
        <Circle cx="52" cy="252" r="26" />
        <Rect x="16" y="214" width="8" height="42" rx="4" />
        <Circle cx="304" cy="254" r="20" />
        <Rect x="322" y="222" width="7" height="36" rx="3.5" />
      </G>
      <Ellipse cx="171" cy="354" rx="230" ry="30" fill="#0B1E1D" />
      <Circle cx="171" cy="300" r="42" fill="url(#m1w)" />
      <G fill="url(#m1m)">
        <Rect x="70" y="158" width="16" height="122" rx="7" />
        <Rect x="256" y="158" width="16" height="122" rx="7" />
      </G>
      <Rect x="63" y="200" width="30" height="7" rx="3.5" fill="#1F5F4E" />
      <Rect x="249" y="200" width="30" height="7" rx="3.5" fill="#1F5F4E" />
      <Path d="M70 158 C70 145 86 145 86 158 Z" fill="#1F5F4E" />
      <Path d="M256 158 C256 145 272 145 272 158 Z" fill="#1F5F4E" />
      <Circle cx="78" cy="140" r="3" fill="url(#m1g)" />
      <Circle cx="264" cy="140" r="3" fill="url(#m1g)" />
      <Rect x="76" y="172" width="4" height="14" rx="2" fill="#F9DDA0" opacity="0.8" />
      <Rect x="262" y="172" width="4" height="14" rx="2" fill="#F9DDA0" opacity="0.8" />
      <Rect x="100" y="268" width="142" height="66" rx="3" fill="url(#m1m)" />
      <Rect x="100" y="268" width="142" height="3.5" fill="url(#m1g)" opacity="0.55" />
      <Path d="M171 126 C214 146 226 198 226 270 H116 C116 198 128 146 171 126 Z" fill="url(#m1m)" />
      <Path d="M171 126 C214 146 226 198 226 270 H116 C116 198 128 146 171 126 Z" stroke="url(#m1g)" strokeWidth="2" opacity="0.35" />
      <Line x1="171" y1="126" x2="171" y2="105" stroke="url(#m1g)" strokeWidth="2.5" />
      <Circle cx="171" cy="100" r="4" fill="url(#m1g)" />
      <Path d="M119 318 v-16 a8 8 0 0 1 16 0 v16 z" fill="#F9DDA0" opacity="0.7" />
      <Path d="M207 318 v-16 a8 8 0 0 1 16 0 v16 z" fill="#F9DDA0" opacity="0.7" />
      <Path d="M153 334 v-34 a18 18 0 0 1 36 0 v34 z" fill="url(#m1g)" />
      <Path d="M160 334 v-27 a11 11 0 0 1 22 0 v27 z" fill="#8A5A16" opacity="0.55" />
    </Svg>
  );
}

/** Slide 2 — gamified shield with flame, XP + streak chips. */
function HeroShield() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 342 360" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="s2bg" cx="0.5" cy="0.36" r="1">
          <Stop offset="0" stopColor="#2C2250" />
          <Stop offset="0.62" stopColor="#181328" />
          <Stop offset="1" stopColor="#110E1D" />
        </RadialGradient>
        <LinearGradient id="s2fl" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F9DDA0" />
          <Stop offset="1" stopColor="#E8892E" />
        </LinearGradient>
        <RadialGradient id="s2glow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#EFB65A" stopOpacity="0.4" />
          <Stop offset="1" stopColor="#EFB65A" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="s2ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C4B2FF" />
          <Stop offset="1" stopColor="#6D4FD1" />
        </LinearGradient>
        <LinearGradient id="s2medal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3D3468" />
          <Stop offset="1" stopColor="#1E1838" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="342" height="360" fill="url(#s2bg)" />
      <Circle cx="171" cy="176" r="120" stroke="#3B2F6B" strokeWidth="2" strokeDasharray="3 13" />
      <Circle cx="171" cy="176" r="112" fill="url(#s2glow)" />
      <Circle cx="171" cy="56" r="14" fill="#2CC9B5" />
      <Path d="M165 56l4.5 4.5 8-8" stroke="#06302B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="63" cy="235" r="11" fill="#F27FB2" />
      <Path d="M63 229l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z" fill="#3A1024" />
      <Circle cx="284" cy="228" r="11" fill="#6EC1E8" />
      <Circle cx="284" cy="228" r="4" fill="#0E2A3A" />
      <Path d="M171 88 L242 116 V190 C242 236 211 266 171 280 C131 266 100 236 100 190 V116 Z" fill="url(#s2medal)" />
      <Path d="M171 88 L242 116 V190 C242 236 211 266 171 280 C131 266 100 236 100 190 V116 Z" stroke="url(#s2ring)" strokeWidth="4" strokeLinejoin="round" />
      <Path d="M171 102 L228 125 V188 C228 224 204 248 171 261 C138 248 114 224 114 188 V125 Z" stroke="#A78BFA" strokeWidth="1.5" opacity="0.4" strokeLinejoin="round" />
      <Path d="M171 102 L228 125 V188 C228 224 204 248 171 261 C138 248 114 224 114 188 V125 Z" fill="#F9DDA0" opacity="0.05" />
      <Path
        d="M12 2c1.2 4.2-5 6.5-5 12a5 5 0 0 0 10 0c0-2.6-1.2-4.2-2.3-5.8-.5 1.2-1.2 1.8-2.2 2.4C13 8.5 12.6 5.5 12 2z"
        fill="url(#s2fl)"
        transform="translate(121 133) scale(4.2)"
      />
      <Path
        d="M12 2c1.2 4.2-5 6.5-5 12a5 5 0 0 0 10 0c0-2.6-1.2-4.2-2.3-5.8-.5 1.2-1.2 1.8-2.2 2.4C13 8.5 12.6 5.5 12 2z"
        fill="#FDF0D5"
        opacity="0.95"
        transform="translate(146 172) scale(2.1)"
      />
      <Path d="M171 224 l2.4 5.2 5.2 2.4-5.2 2.4-2.4 5.2-2.4-5.2-5.2-2.4 5.2-2.4z" fill="#F9DDA0" opacity="0.9" />
      <G transform="rotate(-7 278 104)">
        <Rect x="238" y="86" width="80" height="36" rx="18" fill="#3A2F16" stroke="#EFB65A" strokeWidth="2" />
        <SvgText x="278" y="110" textAnchor="middle" fontFamily="Nunito_900Black" fontSize="15" fill="#F9DDA0">
          +20 XP
        </SvgText>
      </G>
      <G transform="rotate(7 56 116)">
        <Rect x="24" y="98" width="64" height="36" rx="18" fill="#123B34" stroke="#2CC9B5" strokeWidth="2" />
        <SvgText x="56" y="122" textAnchor="middle" fontFamily="Nunito_900Black" fontSize="15" fill="#5EE0CE">
          ✓ 12
        </SvgText>
      </G>
      <Path d="M264 286l4 8.5 8.5 4-8.5 4-4 8.5-4-8.5-8.5-4 8.5-4z" fill="#F9DDA0" opacity="0.95" />
      <Rect x="80" y="294" width="8" height="8" transform="rotate(45 84 298)" fill="#5EE0CE" opacity="0.9" />
      <Rect x="148" y="320" width="7" height="11" rx="2" transform="rotate(24 151.5 325.5)" fill="#F27FB2" />
      <Rect x="208" y="322" width="7" height="11" rx="2" transform="rotate(-20 211.5 327.5)" fill="#A78BFA" />
      <Circle cx="46" cy="52" r="2.5" fill="#C4B2FF" />
      <Circle cx="306" cy="60" r="2" fill="#F8A9CC" />
    </Svg>
  );
}

/** Slide 3 — winding golden path with checkpoints. */
function HeroPath() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 342 360" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="s3bg" cx="0.5" cy="0.22" r="1">
          <Stop offset="0" stopColor="#33291A" />
          <Stop offset="0.6" stopColor="#1C1508" />
          <Stop offset="1" stopColor="#130F06" />
        </RadialGradient>
        <LinearGradient id="s3gold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F9DDA0" />
          <Stop offset="1" stopColor="#D6912F" />
        </LinearGradient>
        <RadialGradient id="s3glow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#F9DDA0" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#F9DDA0" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="s3teal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3BE3CB" />
          <Stop offset="1" stopColor="#1B9484" />
        </LinearGradient>
        <LinearGradient id="s3hill1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E2412" />
          <Stop offset="1" stopColor="#1C1508" />
        </LinearGradient>
        <LinearGradient id="s3hill2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2D15" />
          <Stop offset="1" stopColor="#221A0A" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="342" height="360" fill="url(#s3bg)" />
      <Ellipse cx="70" cy="396" rx="210" ry="84" fill="url(#s3hill1)" />
      <Ellipse cx="300" cy="404" rx="230" ry="92" fill="url(#s3hill2)" />
      <Path
        d="M74 322C180 296 268 274 244 214 222 158 96 186 110 126 120 82 196 68 240 58"
        stroke="#6B5426"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.4"
      />
      <Path
        d="M74 322C180 296 268 274 244 214 222 158 96 186 110 126 120 82 196 68 240 58"
        stroke="url(#s3gold)"
        strokeWidth="6"
        strokeDasharray="1 17"
        strokeLinecap="round"
      />
      <Circle cx="74" cy="322" r="26" fill="url(#s3teal)" />
      <Circle cx="74" cy="322" r="26" stroke="#5EE0CE" strokeWidth="2" opacity="0.5" />
      <Path d="M63 322l8 8 14-14" stroke="#06302B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="244" cy="214" r="26" fill="url(#s3teal)" />
      <Circle cx="244" cy="214" r="26" stroke="#5EE0CE" strokeWidth="2" opacity="0.5" />
      <Path d="M233 214l8 8 14-14" stroke="#06302B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="110" cy="126" r="58" fill="url(#s3glow)" />
      <Circle cx="110" cy="126" r="44" stroke="#EFB65A" strokeWidth="2" strokeDasharray="3 10" opacity="0.6" />
      <Circle cx="110" cy="126" r="32" fill="url(#s3gold)" />
      <Circle cx="110" cy="126" r="32" stroke="#FDF6E3" strokeWidth="2" opacity="0.5" />
      <Path d="M110 108 l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#3A2A08" />
      <Circle cx="240" cy="60" r="36" fill="url(#s3glow)" opacity="0.8" />
      <Ellipse cx="240" cy="86" rx="38" ry="10" fill="#221A0A" />
      <Rect x="222" y="64" width="36" height="22" rx="3" fill="#2E2412" />
      <Path d="M240 40 C253 46 257 56 257 64 H223 C223 56 227 46 240 40 Z" fill="url(#s3gold)" />
      <Line x1="240" y1="40" x2="240" y2="30" stroke="url(#s3gold)" strokeWidth="2" />
      <Circle cx="240" cy="27" r="2.5" fill="#F9DDA0" />
      <Rect x="214" y="50" width="5" height="36" rx="2.5" fill="#2E2412" />
      <Rect x="261" y="50" width="5" height="36" rx="2.5" fill="#2E2412" />
      <Circle cx="216.5" cy="47" r="2.5" fill="#F9DDA0" opacity="0.9" />
      <Circle cx="263.5" cy="47" r="2.5" fill="#F9DDA0" opacity="0.9" />
      <Path d="M235 86 v-8 a5 5 0 0 1 10 0 v8 z" fill="#F9DDA0" />
      <Path d="M289 94l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#F9DDA0" />
      <Rect x="42" y="86" width="7" height="7" transform="rotate(45 45.5 89.5)" fill="#5EE0CE" opacity="0.9" />
      <Circle cx="170" cy="44" r="2.5" fill="#F8A9CC" />
      <Circle cx="60" cy="196" r="2.5" fill="#C4B2FF" />
      <Circle cx="300" cy="160" r="2" fill="#9AD5F2" />
    </Svg>
  );
}

/* ───────────────────────────── Slide copy ───────────────────────────────── */

const SLIDES = [
  {
    Hero: HeroMosque,
    titleTop: "Begin Your",
    titleAccent: "Sacred Journey",
    accentColor: "#EFB65A",
    body: "Learn to read the Qur'an from the very first letter — five minutes a day.",
  },
  {
    Hero: HeroShield,
    titleTop: "Spiritual Growth,",
    titleAccent: "Gamified",
    accentColor: "#A78BFA",
    body: "Streaks, XP and badges keep you coming back — with a tone that honors worship.",
  },
  {
    Hero: HeroPath,
    titleTop: "Your Personalized",
    titleAccent: "Path",
    accentColor: "#EFB65A",
    body: "A guided journey from the alphabet to fluent recitation, built around your pace.",
  },
] as const;

/* ───────────────────────────── Screen ───────────────────────────────────── */

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const { isAuthenticated } = useAppSelector(
    (state: RootState) => state.main,
  );

  const completeOnboarding = async () => {
    await setOnboardingCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: isAuthenticated ? "Demo" : "Welcome" }],
    });
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const next = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
    );
    if (next !== index) setIndex(next);
  };

  const handleNext = () => {
    if (index >= SLIDES.length - 1) {
      completeOnboarding();
      return;
    }
    const next = index + 1;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* SKIP */}
      <View style={s.skipRow}>
        <AnimatedPressable onPress={completeOnboarding} hitSlop={12}>
          <Text style={s.skipText}>SKIP</Text>
        </AnimatedPressable>
      </View>

      {/* slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        style={s.pager}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[s.slide, { width: SCREEN_WIDTH }]}>
            <View style={s.heroCard}>
              <slide.Hero />
            </View>
            <View style={s.copy}>
              <Text style={s.title}>
                {slide.titleTop}
                {"\n"}
                <Text style={{ color: slide.accentColor }}>
                  {slide.titleAccent}
                </Text>
              </Text>
              <Text style={s.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* dots + CTA */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 20 }]}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === index && s.dotActive]}
            />
          ))}
        </View>
        <TactilePressable
          style={s.ctaWrap}
          faceStyle={s.cta}
          edgeColor={theme.colors.shadowGreen}
          radius={18}
          depth={5}
          haptic="medium"
          onPress={handleNext}
        >
          <Text style={s.ctaText}>{isLast ? "GET STARTED" : "NEXT"}</Text>
        </TactilePressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  skipText: {
    fontSize: 13,
    fontFamily: "Nunito_800ExtraBold",
    color: "#5F7E7C",
    letterSpacing: 0.8,
  },
  pager: { flex: 1 },
  slide: { flex: 1 },
  heroCard: {
    marginTop: 18,
    marginHorizontal: 24,
    height: 360,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1E3238",
    overflow: "hidden",
    backgroundColor: "#0E2327",
  },
  copy: {
    paddingTop: 34,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 33,
    lineHeight: 38,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 15.5,
    lineHeight: 24,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 14,
  },
  footer: {
    paddingHorizontal: 26,
    alignItems: "center",
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2C464C",
  },
  dotActive: {
    width: 22,
    backgroundColor: theme.colors.primary,
  },
  ctaWrap: {
    alignSelf: "stretch",
  },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Nunito_900Black",
    color: theme.colors.onPrimary,
    letterSpacing: 1.3,
  },
});
