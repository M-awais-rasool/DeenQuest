import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { X, ChevronRight } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { theme } from "../../theme/themes";
import {
  useGetLevelDetailQuery,
  useCompleteLessonMutation,
} from "../../store/services/api";
import type { Lesson } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { LESSON_COMPONENT_MAP } from "./components";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "LessonPlayer">;

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current + 1) / total : 0;
  const widthAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={s.progressBarContainer}>
      <View style={s.progressBarBg}>
        <Animated.View style={[s.progressBarFill, { width: animatedWidth }]} />
      </View>
      <Text style={s.progressBarText}>
        {current + 1} / {total}
      </Text>
    </View>
  );
}

const LessonRenderer = memo(function LessonRenderer({
  lesson,
  onComplete,
}: {
  lesson: Lesson;
  onComplete: () => void;
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
        <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
          <Text style={s.continueBtnText}>CONTINUE</Text>
          <ChevronRight size={18} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.lessonContent}>
      <Text style={s.lessonTitle}>{lesson.title}</Text>
      <Text style={s.lessonDescription}>{lesson.description}</Text>
      <Component lesson={lesson} onComplete={onComplete} />
    </View>
  );
});

export function LessonPlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId, startLessonIndex } = route.params;

  const { data: res } = useGetLevelDetailQuery(levelId);
  const level = res?.data;
  const [completeLesson] = useCompleteLessonMutation();

  const [currentIndex, setCurrentIndex] = useState(startLessonIndex);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const handleComplete = useCallback(() => {
    if (!level) return;

    completeLesson({ levelId: level.id, lessonIndex: currentIndex }).catch(
      () => {},
    );

    const isLast = currentIndex >= level.lessons.length - 1;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (isLast) {
        navigation.replace("MiniGamePlayer", { levelId: level.id });
      } else {
        setCurrentIndex((prev) => prev + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [level, currentIndex, completeLesson, navigation, fadeAnim]);

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
    <ScreenWrapper>
      <View style={s.container}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <ProgressBar current={currentIndex} total={level.lessons.length} />
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <ScrollView
            ref={scrollRef}
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <LessonRenderer lesson={lesson} onComplete={handleComplete} />
          </ScrollView>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: theme.colors.background },
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
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  progressBarText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 36,
    textAlign: "right",
  },

  // Scroll
  scrollView: {},
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Lesson content
  lessonContent: { flex: 1 },
  lessonTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  lessonDescription: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
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
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});
