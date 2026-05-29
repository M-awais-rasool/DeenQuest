import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";

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
import { theme } from "../../theme/themes";

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
import SpeechBubble from "../../components/onboarding/SpeechBubble";

type Props = NativeStackScreenProps<
  AppStackParamList,
  "PersonalizedOnboarding"
>;

const INTRO_TEXTS = [
  "Hi there! I'm Noor!",
  "Just 8 questions before we start your first lesson and learning journey.",
];

export default function OnboardingScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { email, password } = route.params || {};

  const [introPhase, setIntroPhase] = useState(0); // 0, 1 = intro screens; 2 = steps
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [nameForm, setNameForm] = useState({ firstName: "", lastName: "" });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenState, setScreenState] = useState<
    "steps" | "completion" | "loading"
  >("steps");
  const [stepKey, setStepKey] = useState(0);
  const [speechDone, setSpeechDone] = useState(false);

  // ─── API ───
  const [generatePath, { isLoading: isGenerating }] =
    useGenerateLearningPathMutation();
  const [login] = useLoginMutation();

  // ─── Animation refs ───
  const characterAnim = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const introTextAnim = useRef(new Animated.Value(0)).current;

  // ─── Derived values ───
  const isInSteps = introPhase >= 2;
  const stepConfig = ONBOARDING_STEPS[currentStep];
  const selectedIds = answers[stepConfig.id] || [];
  const isNameStep = stepConfig.type === "name";
  const isContinueDisabled = isInSteps
    ? isNameStep
      ? !nameForm.firstName.trim() ||
        !nameForm.lastName.trim() ||
        isTransitioning
      : selectedIds.length === 0 || isTransitioning
    : isTransitioning;
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

  // Entrance animations for steps
  useEffect(() => {
    if (!isInSteps) return;
    bubbleAnim.setValue(0);
    optionsAnim.setValue(0);
    buttonAnim.setValue(0);
    setSpeechDone(false);

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 500,
        delay: 400,
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
  }, [currentStep, stepConfig, isInSteps, bubbleAnim, optionsAnim, buttonAnim]);

  // Animate options in after speech is done typing
  useEffect(() => {
    if (!speechDone || !isInSteps) return;
    Animated.timing(optionsAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [speechDone, isInSteps, optionsAnim]);

  // Entrance animation for intro text
  useEffect(() => {
    if (isInSteps) return;
    introTextAnim.setValue(0);
    buttonAnim.setValue(0);

    Animated.parallel([
      Animated.timing(introTextAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        delay: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, [introPhase, isInSteps, introTextAnim, buttonAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress, progressAnim]);

  // ─── Transitions ───
  const animateTransition = useCallback(
    (onComplete: () => void) => {
      if (isTransitioning) return;
      setIsTransitioning(true);

      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }).start(() => {
        onComplete();
        contentOpacity.setValue(0);

        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    },
    [isTransitioning, contentOpacity],
  );

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
    if (introPhase < 1) {
      animateTransition(() => setIntroPhase(1));
    } else if (introPhase === 1) {
      animateTransition(() => setIntroPhase(2));
    } else if (currentStep < ONBOARDING_STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      setScreenState("completion");
    }
  }, [introPhase, currentStep, animateTransition, goToStep]);

  const handleBack = useCallback(() => {
    haptics.light();
    if (introPhase === 1) {
      animateTransition(() => setIntroPhase(0));
    } else if (introPhase === 2 && currentStep > 0) {
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
  }, [
    introPhase,
    currentStep,
    isTransitioning,
    animateTransition,
    contentOffset,
    contentOpacity,
  ]);

  const toggleOption = useCallback(
    (optionId: string) => {
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

    const payload = buildOnboardingPayload(answers, nameForm);

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
  }, [
    answers,
    nameForm,
    generatePath,
    login,
    email,
    password,
    navigation,
    dispatch,
  ]);

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

      {isInSteps && (
        <ProgressHeader
          currentStep={currentStep}
          isTransitioning={isTransitioning}
          onBack={handleBack}
          progressAnim={progressAnim}
        />
      )}

      {introPhase === 1 && (
        <TouchableOpacity
          style={styles.introBackButton}
          onPress={handleBack}
          disabled={isTransitioning}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
      )}

      {screenState === "completion" ? (
        <CompletionScreen
          selectedTags={getSelectedTags(answers)}
          onStart={handleStartJourney}
          isLoading={isGenerating}
        />
      ) : isInSteps ? (
        <>
          <NoorCharacter animatedValue={characterAnim} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isTransitioning}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                transform: [{ translateX: contentOffset }],
                opacity: contentOpacity,
              }}
            >
              {/* Speech Bubble */}
              <Animated.View
                style={{
                  opacity: bubbleAnim,
                  transform: [
                    {
                      translateX: bubbleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                }}
              >
                <SpeechBubble
                  key={`speech-${stepKey}`}
                  tailDirection="left"
                  text={stepConfig.speech}
                  typewriter
                  typewriterSpeed={10}
                  typewriterDelay={500}
                  typewriterOnComplete={() => setSpeechDone(true)}
                  bubbleStyle={{
                    marginLeft: 120,
                    marginRight: 20,
                    marginTop: 40,
                    marginBottom: 24,
                  }}
                />
              </Animated.View>

              {/* Step Content */}
              <Animated.View
                style={{
                  opacity: optionsAnim,
                  transform: [
                    {
                      translateY: optionsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                }}
              >
                {isNameStep ? (
                  <View style={styles.inputContainer}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>First Name</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Muhammad"
                          placeholderTextColor={COLORS.textMuted}
                          value={nameForm.firstName}
                          onChangeText={(text) =>
                            setNameForm((prev) => ({ ...prev, firstName: text }))
                          }
                          autoCapitalize="words"
                          selectionColor={COLORS.primary}
                          editable={!isTransitioning}
                        />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Last Name</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Ahmed"
                          placeholderTextColor={COLORS.textMuted}
                          value={nameForm.lastName}
                          onChangeText={(text) =>
                            setNameForm((prev) => ({ ...prev, lastName: text }))
                          }
                          autoCapitalize="words"
                          selectionColor={COLORS.primary}
                          editable={!isTransitioning}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
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
                )}
              </Animated.View>
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
              disabled={isContinueDisabled}
              wrapperStyle={{
                width: "100%",
                opacity: isContinueDisabled ? 0.45 : 1,
              }}
              rimStyle={styles.continueRim}
              capStyle={styles.continueCap}
              height={60}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </BikeHornWrapper>
          </Animated.View>
        </>
      ) : (
        // ─── Intro Screens ───
        <View style={styles.introRoot}>
          <View style={styles.introCenter}>
            {/* Speech Bubble */}
            <Animated.View
              style={{
                opacity: introTextAnim,
                transform: [
                  {
                    translateY: introTextAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                ],
              }}
            >
              <SpeechBubble
                key={`intro-${introPhase}`}
                tailDirection="bottom"
                text={INTRO_TEXTS[introPhase]}
                typewriter
                typewriterSpeed={10}
                typewriterDelay={400}
                bubbleStyle={{
                  maxWidth: "90%",
                  alignSelf: "center",
                }}
                textStyle={{
                  fontSize: 16,
                  fontWeight: "500",
                  lineHeight: 26,
                  textAlign: "center",
                }}
              />
            </Animated.View>

            {/* Character */}
            <Animated.View
              style={{
                opacity: characterAnim,
                transform: [
                  {
                    scale: characterAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.introCharacterCircle}>
                <Image
                  source={require("../../../assets/login-logo.png")}
                  style={styles.introCharacterImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.introCharacterGlow} />
            </Animated.View>
          </View>

          {/* Continue Button */}
          <Animated.View
            style={[
              styles.introButtonWrap,
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
              disabled={isTransitioning}
              wrapperStyle={{
                width: "100%",
                opacity: isTransitioning ? 0.45 : 1,
              }}
              rimStyle={styles.continueRim}
              capStyle={styles.continueCap}
              height={60}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </BikeHornWrapper>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  introRoot: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  introBackButton: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 20,
    padding: 8,
  },
  introCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },

  introCharacterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.outline,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  introCharacterImage: {
    width: 96,
    height: 96,
  },
  introCharacterGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.white05,
    zIndex: -1,
  },
  introButtonWrap: {
    width: "100%",
    paddingBottom: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  optionsGrid: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: theme.colors.surfaceLow,
    borderBottomWidth: 3,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    color: COLORS.text,
    padding: 16,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
    fontSize: 16,
    fontFamily: FONTS.body,
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
});
