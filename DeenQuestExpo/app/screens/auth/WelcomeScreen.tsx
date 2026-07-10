import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { SocialAuthButton, TactilePressable } from "../../components/ui";
import { TactileButton } from "../../components/TactileButton";
import { theme } from "../../theme/themes";
import MascotHero from "../../components/mascot/MascotHero";

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
  const { width, height } = useWindowDimensions();

  const mascotSize = Math.min(
    170,
    Math.max(120, Math.min(width * 0.38, height * 0.2)),
  );

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
        {/* Hero + brand */}
        <View style={s.hero}>
          <MascotHero size={mascotSize} />
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
            title="Get Started"
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
