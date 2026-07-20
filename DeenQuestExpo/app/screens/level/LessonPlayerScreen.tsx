import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { X, ChevronRight } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { theme } from "../../theme/themes";
import {
  useGetLevelDetailQuery,
  useGetCoachPracticeQuery,
  useCompleteLessonMutation,
} from "../../store/services/api";
import type { Lesson } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { LESSON_COMPONENT_MAP } from "../../components/level/lesson";
import {
  trackLessonCompleted,
  trackLessonStarted,
} from "../../services/telemetry";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "LessonPlayer">;

/** Segmented lesson progress (mock C3): one pill per lesson, filled up to the
 * current one, with a "5/7" counter on the right. */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.progressBarContainer}>
      <View style={s.progressSegments}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              s.progressSegment,
              i <= current
                ? s.progressSegmentDone
                : s.progressSegmentPending,
            ]}
          />
        ))}
      </View>
      <Text style={s.progressBarText}>
        {current + 1}/{total}
      </Text>
    </View>
  );
}

const LessonRenderer = memo(function LessonRenderer({
  lesson,
  onComplete,
  levelId,
  lessonIndex,
}: {
  lesson: Lesson;
  onComplete: () => void;
  levelId: number;
  lessonIndex: number;
}) {
  const Component = LESSON_COMPONENT_MAP[lesson.component];

  if (!Component) {
    return (
      <View style={s.lessonContent}>
        <Text style={s.lessonTitle}>{lesson.title}</Text>
        <Text style={s.lessonDescription}>{lesson.description}</Text>
        <View style={s.genericCard}>
          {lesson.data &&
            Object.entries(lesson.data).map(([key, value]) => (
              <Text key={key} style={s.genericText}>
                {typeof value === "string" ? value : JSON.stringify(value)}
              </Text>
            ))}
        </View>
        <TactilePressable
          edgeColor={theme.colors.primaryContainer}
          radius={16}
          haptic="medium"
          style={s.continueBtnWrap}
          faceStyle={s.continueBtn}
          onPress={onComplete}
        >
          <Text style={s.continueBtnText}>CONTINUE</Text>
          <ChevronRight size={18} color={theme.colors.onPrimary} />
        </TactilePressable>
      </View>
    );
  }

  return (
    <View style={s.lessonContent}>
      <Text style={s.lessonTitle}>{lesson.title}</Text>
      <Text style={s.lessonDescription}>{lesson.description}</Text>
      <Component
        lesson={lesson}
        onComplete={onComplete}
        levelId={levelId}
        lessonIndex={lessonIndex}
      />
    </View>
  );
});

export function LessonPlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId, startLessonIndex, courseType, coachInsightId } =
    route.params;

  const isCoachPractice = !!coachInsightId;
  const { data: levelRes } = useGetLevelDetailQuery(
    { levelId, courseType },
    { skip: isCoachPractice },
  );
  const { data: practiceRes } = useGetCoachPracticeQuery(coachInsightId ?? "", {
    skip: !isCoachPractice,
  });
  const level = isCoachPractice ? practiceRes?.data : levelRes?.data;
  const [completeLesson] = useCompleteLessonMutation();

  const [currentIndex, setCurrentIndex] = useState(startLessonIndex);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    if (level) trackLessonStarted(level.id, currentIndex);
  }, [level, currentIndex]);

  const handleComplete = useCallback(() => {
    if (!level) return;
    if (advancingRef.current) return;
    advancingRef.current = true;

    trackLessonCompleted(level.id, currentIndex);
    if (!isCoachPractice) {
      completeLesson({
        levelId: level.id,
        lessonIndex: currentIndex,
        courseType: level.course_type ?? courseType,
      }).catch(() => {});
    }

    const isLast = currentIndex >= level.lessons.length - 1;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (isLast) {
        navigation.replace("MiniGamePlayer", {
          levelId: level.id,
          courseType: level.course_type ?? courseType,
          coachInsightId,
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          advancingRef.current = false;
        });
      }
    });
  }, [
    courseType,
    coachInsightId,
    isCoachPractice,
    level,
    currentIndex,
    completeLesson,
    navigation,
    fadeAnim,
  ]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!level) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  const lesson = level.lessons[currentIndex];

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.container}>
        {/* Top bar */}
        <View style={s.topBar}>
          <AnimatedPressable
            onPress={() => {
              handleClose();
            }}
            style={s.closeBtn}
          >
            <X size={22} color={theme.colors.text} />
          </AnimatedPressable>
          <ProgressBar current={currentIndex} total={level.lessons.length} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <LessonRenderer
              key={currentIndex}
              lesson={lesson}
              onComplete={handleComplete}
              levelId={levelId}
              lessonIndex={currentIndex}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: theme.colors.textMuted, fontSize: 16 },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  // Progress bar
  progressBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressSegments: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  progressSegment: {
    flex: 1,
    height: 9,
    borderRadius: 5,
  },
  progressSegmentDone: {
    backgroundColor: theme.colors.primary,
  },
  progressSegmentPending: {
    backgroundColor: theme.colors.surfaceHigh,
  },
  progressBarText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    minWidth: 32,
    textAlign: "right",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },

  // Lesson content
  lessonContent: { flex: 1 },
  lessonTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: "Nunito_900Black",
    marginBottom: 6,
  },
  lessonDescription: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    lineHeight: 21,
    marginBottom: 22,
  },

  // Generic fallback
  genericCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: 16,
  },
  genericText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },

  // Continue button
  continueBtnWrap: {
    marginTop: 16,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontFamily: "Nunito_900Black",
    fontSize: 16,
    letterSpacing: 1,
  },
});
