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
import { Star } from "lucide-react-native";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { SocialAuthButton, AnimatedPressable } from "../../components/ui";
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

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Scale the mascot with the viewport. The hero stage renders ~1.78x this
  // size (halo + orbit rings + accents), so we keep it conservative to leave
  // breathing room on the sides and clamp it for tablets / small phones.
  const mascotSize = Math.min(
    220,
    Math.max(150, Math.min(width * 0.5, height * 0.26)),
  );

  const handleGoogle = useCallback(() => {
    // TODO: wire native Google OAuth (expo-auth-session) once the backend
    // exposes a social token exchange endpoint.
  }, []);

  const handleApple = useCallback(() => {
    // TODO: wire Sign in with Apple (expo-apple-authentication).
  }, []);

  const handleEmail = useCallback(
    () => navigation.navigate("Login"),
    [navigation],
  );

  return (
    <ScreenWrapper innerStyle={s.flex}>
      <View style={s.flex}>
        {/* Brand */}
        <FadeSlide delay={60} style={s.brandRow}>
          <Star
            size={20}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
          <Text style={s.brand}>DeenQuest</Text>
        </FadeSlide>

        {/* Hero */}
        <View style={s.hero}>
          <MascotHero size={mascotSize} />
        </View>

        <FadeSlide delay={260} style={s.heroText}>
          <Text style={s.greeting}>As-salamu alaykum! 👋</Text>
          <Text style={s.tagline}>
            Learn to read the Quran the fun way —{"\n"}a few minutes a day.
          </Text>
        </FadeSlide>

        {/* Auth actions */}
        <FadeSlide
          delay={420}
          style={[
            s.actions,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <SocialAuthButton provider="google" onPress={handleGoogle} />
          <View style={s.buttonGap} />
          <SocialAuthButton provider="apple" onPress={handleApple} />

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.divider} />
          </View>

          <AnimatedPressable onPress={handleEmail} style={s.emailBtn}>
            <Text style={s.emailText}>Continue with Email</Text>
          </AnimatedPressable>

          <Text style={s.legal}>
            By continuing you agree to our Terms of Service{"\n"}and Privacy
            Policy.
          </Text>
        </FadeSlide>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: theme.colors.primary08,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  heroText: {
    alignItems: "center",
    marginTop: 26,
    marginBottom: 30,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  actions: {
    paddingHorizontal: 24,
  },
  buttonGap: {
    height: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  emailBtn: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  emailText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  legal: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 14,
    opacity: 0.7,
  },
});

export default WelcomeScreen;
