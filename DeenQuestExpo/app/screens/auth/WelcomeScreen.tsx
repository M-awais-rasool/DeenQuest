import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { SocialAuthButton, TactilePressable } from "../../components/ui";
import { TactileButton } from "../../components/TactileButton";
import { theme } from "../../theme/themes";

/** Gold rounded-square app icon with the mosque mark (A2 mock). */
function BrandLogo({ size = 110 }: { size?: number }) {
  return (
    <View style={s.logoShadow}>
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Defs>
          <SvgLinearGradient
            id="lqg"
            gradientUnits="userSpaceOnUse"
            x1="12"
            y1="0"
            x2="62"
            y2="80"
          >
            <Stop offset="0" stopColor="#F9D98C" />
            <Stop offset="1" stopColor="#D08A22" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="1" y="1" width="78" height="78" rx="21" fill="url(#lqg)" />
        <Rect
          x="2.2"
          y="2.2"
          width="75.6"
          height="75.6"
          rx="20"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />
        <G fill="#0B3B33">
          <Path d="M40 16 C55 25 61 38 61 64 H19 C19 38 25 25 40 16 Z" />
          <Rect x="38.7" y="9" width="2.6" height="8" rx="1.3" />
          <Path
            d="M40 1.5 A4.5 4.5 0 1 0 40 10.5 A6 6 0 0 1 40 1.5 Z"
            transform="rotate(-20 40 6)"
          />
        </G>
        <Path d="M33 64 v-12 a7 7 0 0 1 14 0 v12 z" fill="url(#lqg)" />
        <Path
          d="M60 17 l1.8 3.9 3.9 1.8-3.9 1.8-1.8 3.9-1.8-3.9-3.9-1.8 3.9-1.8z"
          fill="#FDF6E3"
        />
        <Circle cx="20" cy="24" r="1.6" fill="#FDF6E3" opacity="0.85" />
      </Svg>
    </View>
  );
}

/** Ambient radial glows behind the hero (teal top, gold bottom). */
function AmbientGlows() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="wg1" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#2CC9B5" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#2CC9B5" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="wg2" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#EFB65A" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#EFB65A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="8%" r="280" fill="url(#wg1)" />
        <Circle cx="50%" cy="96%" r="240" fill="url(#wg2)" />
      </Svg>
    </View>
  );
}

type Nav = NativeStackNavigationProp<AppStackParamList>;

const FadeSlide = memo(function FadeSlide({
  delay,
  children,
  style,
}: {
  delay: number;
  children: React.ReactNode;
  style?: object;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <Animated.View
      style={[style, { opacity: progress, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
});

/** Ornamental gold divider: — ✦ — */
function OrnamentRow() {
  return (
    <View style={s.ornamentRow}>
      <View style={s.ornamentLine} />
      <Text style={s.ornamentStar}>✦</Text>
      <View style={s.ornamentLine} />
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const handleGoogle = useCallback(() => {
    // TODO: wire native Google OAuth (expo-auth-session) once the backend
    // exposes a social token exchange endpoint.
  }, []);

  const handleApple = useCallback(() => {
    // TODO: wire Sign in with Apple (expo-apple-authentication).
  }, []);

  const handleSignup = useCallback(
    () => navigation.navigate("Signup"),
    [navigation],
  );
  const handleLogin = useCallback(
    () => navigation.navigate("Login"),
    [navigation],
  );

  return (
    <ScreenWrapper innerStyle={s.flex}>
      <View style={s.flex}>
        <AmbientGlows />
        {/* Hero + brand */}
        <View style={s.hero}>
          <BrandLogo />
          <FadeSlide delay={60} style={s.brandBlock}>
            <Text style={s.brand}>
              Deen
              <Text style={s.brandAccent}>Quest</Text>
            </Text>
            <Text style={s.tagline}>LEARN · PLAY · GROW</Text>
          </FadeSlide>

          <FadeSlide delay={260} style={s.basmalahBlock}>
            <OrnamentRow />
            <Text style={s.basmalah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            <Text style={s.basmalahTr}>
              In the name of Allah, the Most Gracious, the Most Merciful
            </Text>
            <OrnamentRow />
          </FadeSlide>
        </View>

        {/* Auth actions */}
        <FadeSlide
          delay={420}
          style={[
            s.actions,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <TactileButton
            title="GET STARTED"
            onPress={handleSignup}
            size="lg"
          />
          <TactilePressable
            onPress={handleLogin}
            edgeColor={theme.colors.shadowSurface}
            radius={18}
            haptic="light"
            style={s.loginBtnWrap}
            faceStyle={s.loginBtn}
          >
            <Text style={s.loginText}>I ALREADY HAVE AN ACCOUNT</Text>
          </TactilePressable>

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.divider} />
          </View>

          <View style={s.socialRow}>
            <View style={s.socialItem}>
              <SocialAuthButton provider="google" onPress={handleGoogle} />
            </View>
            <View style={s.socialItem}>
              <SocialAuthButton provider="apple" onPress={handleApple} />
            </View>
          </View>
        </FadeSlide>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  logoShadow: {
    borderRadius: 30,
    shadowColor: "#EFB65A",
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  brandBlock: {
    alignItems: "center",
    marginTop: 22,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 33,
    fontFamily: "Nunito_900Black",
    letterSpacing: -0.3,
  },
  brandAccent: {
    color: theme.colors.secondary,
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 3.2,
    marginTop: 7,
  },
  basmalahBlock: {
    alignItems: "center",
    gap: 16,
    marginTop: 38,
  },
  ornamentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ornamentLine: {
    width: 44,
    height: 1.5,
    backgroundColor: theme.colors.goldDark,
    opacity: 0.7,
  },
  ornamentStar: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  basmalah: {
    fontFamily: "Amiri_400Regular",
    fontSize: 30,
    lineHeight: 54,
    color: theme.colors.yellowSoft,
    textAlign: "center",
    writingDirection: "rtl",
  },
  basmalahTr: {
    color: "#5F7E7C",
    fontSize: 12.5,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
    maxWidth: 270,
  },
  actions: {
    paddingHorizontal: 26,
    gap: 12,
  },
  loginBtnWrap: {},
  loginBtn: {
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loginText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  dividerText: {
    color: "#5F7E7C",
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialItem: {
    flex: 1,
  },
});

export default WelcomeScreen;
