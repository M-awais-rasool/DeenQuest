import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowRight, Flame, Sparkles, Trophy } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { useAppSelector } from "../../store/hooks";
import type { RootState } from "../../store/store";
import type { MainState } from "../../store/slices/mainSlice";
import { setOnboardingCompleted } from "../../store/storage/authStorage";

const { width } = Dimensions.get("window");

const COLORS = {
  surface: "#131313",
  surfaceContainer: "#1F1F1F",
  surfaceContainerLow: "#1B1B1B",
  surfaceContainerHigh: "#2A2A2A",
  primary: "#88D982",
  onPrimary: "#003909",
  secondaryContainer: "#FFDB3C",
  onSecondaryFixed: "#221B00",
  onSurface: "#E2E2E2",
  onSurfaceVariant: "#BFCABA",
  outlineVariant: "#40493D",
};

const FONTS = {
  headline: "Lexend",
  body: "Plus Jakarta Sans",
};

const SWIPE_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Screen data — add new screens here, no JSX changes required elsewhere
// ---------------------------------------------------------------------------
interface ScreenConfig {
  title: string;
  titleHighlight: string;
  description: string;
  buttonText: string;
  showArrow?: boolean;
}

const SCREENS: ScreenConfig[] = [
  {
    title: "Begin Your",
    titleHighlight: "Sacred Journey",
    description:
      "Experience the beauty of Islam through a gamified, habit-building quest designed for the modern Muslim.",
    buttonText: "Get Started",
    showArrow: true,
  },
  {
    title: "Spiritual Growth,",
    titleHighlight: "Gamified",
    description:
      "Complete daily missions, maintain your streaks, and level up your spiritual life with ease and joy.",
    buttonText: "Next Step",
  },
  {
    title: "Your Personalized",
    titleHighlight: "Path",
    description:
      "Whether you want to master Salah, read the Quran daily, or learn new Hadiths, we create a plan just for you.",
    buttonText: "Find My Path",
    showArrow: true,
  },
];

// ---------------------------------------------------------------------------
// Hero sections — one per screen index
// ---------------------------------------------------------------------------
function HeroScreen0() {
  return (
    <>
      <View style={styles.imageCircle}>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAQRPocBP9-2EE4wvrs1expePn0jLCU4vCxN_K1W5oLgVs7SnT6Ai88-0lzMKSYR15b-Rb1CrIR0Oj4Yi-8T2Zwl_62ZiEyVoE5TLm-R--aF9PyCjEDoUS-Ec2EnnZ4H6aQ2uhKeZ26iikDbXhyGdj7nktV59iwDnR6iPDDfrLHpSaA3p2gYne8jxJx5-olqmF936aw5vJMy3Qp4sCC1YhWhm2C51J-ZmbHs2nnMwcTEqP97gwaKebqbnZjJN4G1AgiOJdfCgPCd0",
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>
    </>
  );
}

function HeroScreen1() {
  return (
    <View style={styles.visualContainer}>
      <View
        style={{
          width: 250,
          height: 250,
          borderRadius: 125,
          position: "absolute",
          backgroundColor: COLORS.secondaryContainer,
        }}
      />
      <View
        style={{
          width: 230,
          height: 230,
          borderRadius: 125,
          position: "absolute",
          borderColor: COLORS.outlineVariant,
          borderWidth: 2,
        }}
      />
      <View style={styles.streakCard}>
        <Flame
          size={72}
          color={COLORS.secondaryContainer}
          fill={COLORS.secondaryContainer}
        />
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeText}>12 DAYS</Text>
        </View>
      </View>
      <View style={styles.levelBadge}>
        <Trophy size={40} color={COLORS.primary} fill={COLORS.primary} />
        <Text style={styles.levelBadgeLabel}>NEW LEVEL</Text>
      </View>
      <View style={styles.sparkleAccent}>
        <Sparkles size={36} color={COLORS.primary} />
      </View>
    </View>
  );
}

function HeroScreen2() {
  return (
    <>
      <View style={styles.imageCircle}>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0Ymacn5LPYy_OTdPgK_cuteNV6V0oMRODkiWdoUhvfJ7er5PlnxCjVmIVgTQh6kqNY0Y65fSecLtyKwFOxMGxBE5wbR9EaGBixg1o-fOTgDhCGP6zVxmYZbd7Bu-HSkH1iymctyzF2sUtw_cIbJzwfW1i9e49kUiQCSH98a57xzN74171QH6DK9BPVbOHbq6xsVmBus-WT09zhhqJWN6NUMEOLbxtoNuFuS82tPkjtR26Is3cNRIAgG0BbvVSo4FTBDgBuwzKrnI",
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.goalTag}>
        <View style={styles.goalIcon}>
          <Sparkles size={14} color={COLORS.primary} />
        </View>
        <Text style={styles.goalText}>Daily Goal</Text>
      </View>
    </>
  );
}

const HERO_COMPONENTS = [HeroScreen0, HeroScreen1, HeroScreen2];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type OnboardingScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "OnboardingScreen"
>;

export default function OnboardingScreen({
  navigation,
}: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  const slideX = useRef(new Animated.Value(0)).current;

  const dotWidths = useRef(
    SCREENS.map((_, i) => new Animated.Value(i === 0 ? 24 : 8)),
  ).current;

  const slideAnimations = useRef(
    SCREENS.map((_, index) => ({
      translateX: Animated.add(
        new Animated.Value(index * width),
        Animated.multiply(slideX, -1),
      ),
      scale: slideX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [0.88, 1, 0.88],
        extrapolate: "clamp",
      }),
      opacity: slideX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [0.35, 1, 0.35],
        extrapolate: "clamp",
      }),
    })),
  ).current;

  const { isAuthenticated } = useAppSelector(
    (state: RootState) => (state as RootState & { main: MainState }).main,
  );

  const completeOnboarding = async () => {
    await setOnboardingCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: isAuthenticated ? "Demo" : "Login" }],
    });
  };

  const goToIndex = (newIndex: number) => {
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);

    Animated.spring(slideX, {
      toValue: newIndex * width,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
      mass: 0.8,
    }).start();

    SCREENS.forEach((_, i) => {
      Animated.spring(dotWidths[i], {
        toValue: i === newIndex ? 24 : 8,
        useNativeDriver: false,
        damping: 18,
        stiffness: 200,
      }).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10,

      onPanResponderMove: (_, gs) => {
        const idx = currentIndexRef.current;
        const raw = idx * width - gs.dx;
        const max = (SCREENS.length - 1) * width;
        let clamped: number;
        if (raw < 0) clamped = raw * 0.15;
        else if (raw > max) clamped = max + (raw - max) * 0.15;
        else clamped = raw;
        slideX.setValue(clamped);
      },

      onPanResponderRelease: (_, gs) => {
        const idx = currentIndexRef.current;
        let newIndex = idx;
        if (gs.dx < -SWIPE_THRESHOLD && idx < SCREENS.length - 1)
          newIndex = idx + 1;
        else if (gs.dx > SWIPE_THRESHOLD && idx > 0) newIndex = idx - 1;
        goToIndex(newIndex);
      },
    }),
  ).current;

  const goToNext = () => {
    if (currentIndex < SCREENS.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>DeenQuest</Text>
        <TouchableOpacity onPress={completeOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides — all rendered simultaneously, clipped to container */}
      <View style={styles.slidesWrapper} {...panResponder.panHandlers}>
        {SCREENS.map((screen, index) => {
          const HeroComponent = HERO_COMPONENTS[index];
          const { translateX, scale, opacity } = slideAnimations[index];
          return (
            <Animated.View
              key={index}
              style={[
                styles.slide,
                { transform: [{ translateX }, { scale }], opacity },
              ]}
            >
              <View style={styles.heroContainer}>
                <HeroComponent />
              </View>

              <View style={styles.contentContainer}>
                <Text style={styles.title}>
                  {screen.title}
                  {"\n"}
                  <Text style={styles.primaryText}>
                    {screen.titleHighlight}
                  </Text>
                </Text>
                <Text style={styles.description}>{screen.description}</Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={goToNext}>
                <Text style={styles.primaryButtonText}>
                  {screen.buttonText}
                </Text>
                {screen.showArrow && (
                  <ArrowRight
                    size={20}
                    color={COLORS.onPrimary}
                    strokeWidth={3}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Dot indicator — anchored outside the slide area, always visible */}
      <View style={styles.dotContainer}>
        {SCREENS.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToIndex(index)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Animated.View
              style={[
                styles.dot,
                {
                  width: dotWidths[index],
                  backgroundColor:
                    index === currentIndex
                      ? COLORS.secondaryContainer
                      : COLORS.surfaceContainerHigh,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logo: {
    fontFamily: FONTS.headline,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -1,
  },
  skipText: {
    fontFamily: FONTS.headline,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  // Clipping container for all slides
  slidesWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  // Each slide fills the wrapper and is positioned absolutely
  slide: {
    position: "absolute",
    width,
    top: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imageCircle: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "33",
    backgroundColor: COLORS.surfaceContainerLow,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  floatingBadge: {
    position: "absolute",
    right: width * 0.05,
    top: "20%",
    backgroundColor: COLORS.secondaryContainer,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "12deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeText: {
    fontFamily: FONTS.headline,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.onSecondaryFixed,
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.headline,
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.onSurface,
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  primaryText: {
    color: COLORS.primary,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 4,
    borderBottomColor: "#005312",
  },
  primaryButtonText: {
    fontFamily: FONTS.headline,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.onPrimary,
  },
  // Dots — fixed below the slides
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  // Screen 2 (visual) hero styles
  visualContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  streakCard: {
    width: 152,
    height: 152,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  streakBadge: {
    marginTop: 12,
    backgroundColor: COLORS.secondaryContainer + "1A",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.secondaryContainer + "33",
  },
  streakBadgeText: {
    fontFamily: FONTS.headline,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.secondaryContainer,
  },
  levelBadge: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 128,
    height: 128,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "33",
    transform: [{ rotate: "6deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  levelBadgeLabel: {
    fontFamily: FONTS.headline,
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    marginTop: 4,
  },
  sparkleAccent: {
    position: "absolute",
    bottom: 36,
    left: 16,
    width: 80,
    height: 80,
    backgroundColor: "#2E7D32",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-12deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  // Screen 3 hero styles
  goalTag: {
    position: "absolute",
    bottom: 50,
    right: 8,
    backgroundColor: COLORS.surfaceContainer,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "33",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "33",
    justifyContent: "center",
    alignItems: "center",
  },
  goalText: {
    fontFamily: FONTS.headline,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.onSurface,
    paddingRight: 4,
  },
});
