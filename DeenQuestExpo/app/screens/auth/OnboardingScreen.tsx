import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppStackParamList } from "../../navigators/navigationTypes";
import {
  useGenerateLearningPathMutation,
  useLoginMutation,
  LoginRequest,
} from "../../store/services/api";
import { useAppDispatch } from "../../store/hooks";
import {
  setIsAuthenticated,
  setUser,
  setAccessToken,
} from "../../store/slices/mainSlice";
import { haptics } from "../../utils/haptics";
import {
  ONBOARDING_STEPS,
  getSelectedTags,
  buildOnboardingPayload,
} from "../../utils/onboardingConfig";

import NoorCharacter from "../../components/onboarding/NoorCharacter";
import OptionButton from "../../components/onboarding/OptionButton";
import BikeHornWrapper from "../../components/onboarding/BikeHornWrapper";
import {
  COLORS,
  FONTS,
  SCREEN_WIDTH,
  SPRING_EASE,
} from "../../components/onboarding/constants";
import CompletionScreen from "../../components/onboarding/CompletionScreen";
import LoadingScreen from "../../components/onboarding/LoadingScreen";
import ProgressHeader from "../../components/onboarding/ProgressHeader";

type Props = NativeStackScreenProps<
  AppStackParamList,
  "PersonalizedOnboarding"
>;

export default function OnboardingScreen({
  navigation,
  route,
}: Props) {
  const dispatch = useAppDispatch();
  const { email, password } = route.params || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenState, setScreenState] = useState<
    "steps" | "completion" | "loading"
  >("steps");
  const [stepKey, setStepKey] = useState(0);

  // ─── API ───
  const [generatePath, { isLoading: isGenerating }] =
    useGenerateLearningPathMutation();
  const [login] = useLoginMutation();

  // ─── Animation refs (all hooks must be before any early return) ───
  const characterAnim = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ─── Derived values ───
  const stepConfig = ONBOARDING_STEPS[currentStep];
  const selectedIds = answers[stepConfig.id] || [];
  const progress =
    screenState === "completion"
      ? 1
      : (currentStep + 1) / ONBOARDING_STEPS.length;

  useEffect(() => {
    Animated.spring(characterAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();
  }, [characterAnim]);

  useEffect(() => {
    bubbleAnim.setValue(0);
    titleAnim.setValue(0);
    buttonAnim.setValue(0);

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ];

    Animated.parallel(animations).start();
  }, [currentStep, stepConfig, bubbleAnim, titleAnim, buttonAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress, progressAnim]);

  // ─── Callbacks ───
  const goToStep = useCallback(
    (nextStep: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);

      Animated.timing(contentOffset, {
        toValue: -SCREEN_WIDTH,
        duration: 320,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }).start(() => {
        setCurrentStep(nextStep);
        setStepKey((k) => k + 1);
        contentOffset.setValue(SCREEN_WIDTH);
        contentOpacity.setValue(0);

        Animated.parallel([
          Animated.timing(contentOffset, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: SPRING_EASE,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    },
    [isTransitioning, contentOffset, contentOpacity],
  );

  const handleContinue = useCallback(() => {
    haptics.medium();
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      setScreenState("completion");
    }
  }, [currentStep, goToStep]);

  const handleSkip = useCallback(() => {
    haptics.light();
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      setScreenState("completion");
    }
  }, [currentStep, goToStep]);

  const handleBack = useCallback(() => {
    haptics.light();
    if (currentStep > 0) {
      if (isTransitioning) return;
      setIsTransitioning(true);

      Animated.timing(contentOffset, {
        toValue: SCREEN_WIDTH,
        duration: 320,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }).start(() => {
        setCurrentStep((s) => s - 1);
        setStepKey((k) => k + 1);
        contentOffset.setValue(-SCREEN_WIDTH);
        contentOpacity.setValue(0);

        Animated.parallel([
          Animated.timing(contentOffset, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: SPRING_EASE,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    }
  }, [currentStep, isTransitioning, contentOffset, contentOpacity]);

  const toggleOption = useCallback(
    (optionId: string) => {
      haptics.selection();
      setAnswers((prev) => {
        const current = prev[stepConfig.id] || [];
        if (stepConfig.multiSelect) {
          if (current.includes(optionId)) {
            return {
              ...prev,
              [stepConfig.id]: current.filter((id) => id !== optionId),
            };
          }
          return { ...prev, [stepConfig.id]: [...current, optionId] };
        }
        return { ...prev, [stepConfig.id]: [optionId] };
      });
    },
    [stepConfig],
  );

  const handleStartJourney = useCallback(async () => {
    haptics.success();
    setScreenState("loading");

    const payload = buildOnboardingPayload(answers);

    try {
      await generatePath(payload).unwrap();
    } catch (err) {
      console.warn("Path generation failed, continuing to login", err);
    }

    if (email && password) {
      try {
        const loginPayload: LoginRequest = { email, password };
        const loginResult = await login(loginPayload).unwrap();
        if (loginResult.data) {
          dispatch(setUser(loginResult.data.user));
          dispatch(setAccessToken(loginResult.data.access_token));
          dispatch(setIsAuthenticated(true));
          navigation.reset({
            index: 0,
            routes: [{ name: "Demo" }],
          });
          return;
        }
      } catch (loginErr) {
        console.warn("Auto-login failed after onboarding", loginErr);
      }
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  }, [answers, generatePath, login, email, password, navigation, dispatch]);

  // ─── Early return (ALL hooks already called above) ───
  if (screenState === "loading") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LoadingScreen />
      </View>
    );
  }

  // ─── Render ───
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ProgressHeader
        currentStep={currentStep}
        isTransitioning={isTransitioning}
        onBack={handleBack}
        progressAnim={progressAnim}
      />

      <NoorCharacter animatedValue={characterAnim} />

      {screenState === "completion" ? (
        <CompletionScreen
          selectedTags={getSelectedTags(answers)}
          onStart={handleStartJourney}
          isLoading={isGenerating}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isTransitioning}
          >
            <Animated.View
              style={{
                transform: [{ translateX: contentOffset }],
                opacity: contentOpacity,
              }}
            >
              {/* Speech Bubble */}
              <Animated.View
                style={[
                  styles.speechBubble,
                  {
                    opacity: bubbleAnim,
                    transform: [
                      {
                        translateX: bubbleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.speechText}>{stepConfig.speech}</Text>
                <View style={styles.speechTail} />
              </Animated.View>

              {/* Title */}
              <Animated.View
                style={{
                  opacity: titleAnim,
                  transform: [
                    {
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                }}
              >
                <Text style={styles.questionTitle}>{stepConfig.title}</Text>
                <Text style={styles.questionSubtitle}>
                  {stepConfig.subtitle}
                </Text>
              </Animated.View>

              {/* Options */}
              <View style={styles.optionsGrid}>
                {stepConfig.options.map((option, i) => (
                  <OptionButton
                    key={option.id}
                    option={option}
                    selected={selectedIds.includes(option.id)}
                    onPress={() => toggleOption(option.id)}
                    delayIndex={i}
                    stepKey={stepKey}
                  />
                ))}
              </View>
            </Animated.View>
          </ScrollView>

          {/* Bottom Actions */}
          <Animated.View
            style={[
              styles.bottomActions,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <BikeHornWrapper
              onPress={handleContinue}
              disabled={selectedIds.length === 0 || isTransitioning}
              wrapperStyle={{
                width: "100%",
                opacity: selectedIds.length === 0 ? 0.45 : 1,
              }}
              rimStyle={styles.continueRim}
              capStyle={styles.continueCap}
              height={60}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </BikeHornWrapper>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isTransitioning}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  speechBubble: {
    marginLeft: 100,
    marginRight: 20,
    marginTop: 40,
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  speechText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: "600",
  },
  speechTail: {
    position: "absolute",
    left: -8,
    top: 0,
    width: 16,
    height: 16,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.outline,
    transform: [{ rotate: "45deg" }],
  },
  questionTitle: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 30,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  questionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  optionsGrid: {
    paddingHorizontal: 20,
    gap: 10,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  continueRim: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
  },
  continueCap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    fontFamily: FONTS.headline,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    textDecorationLine: "underline",
  },
});
