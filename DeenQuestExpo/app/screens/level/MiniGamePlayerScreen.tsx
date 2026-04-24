import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { X, Star, Trophy } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { theme } from "../../theme/themes";
import {
  useGetLevelDetailQuery,
  useCompleteLevelMutation,
} from "../../store/services/api";
import type { MiniGame } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { useAppDispatch } from "../../store/hooks";
import { setPendingRewardUnlocks } from "../../store/slices/mainSlice";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, "MiniGamePlayer">;

// --- MCQ Mini Game ---
function MCQGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stars: number) => void;
}) {
  const data = game.data as Record<string, any>;
  const questions: Array<{
    question: string;
    options: string[];
    correct: number;
  }> = data.questions ?? [
    {
      question: data.question ?? "Complete the challenge",
      options: data.options ?? [],
      correct: data.correct ?? 0,
    },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const q = questions[currentQ];
  const hasAnswered = selected !== null;
  const isCorrect = selected === q?.correct;

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelected(idx);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
    } else {
      const pct = score / questions.length;
      const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
      onFinish(stars);
    }
  };

  if (!q) return null;

  return (
    <View>
      <Text style={s.gameQuestion}>{q.question}</Text>
      {q.options?.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            s.gameOption,
            hasAnswered && idx === q.correct && s.gameOptionCorrect,
            hasAnswered && idx === selected && !isCorrect && s.gameOptionWrong,
          ]}
          onPress={() => handleSelect(idx)}
          disabled={hasAnswered}
        >
          <Text style={s.gameOptionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
      {hasAnswered && (
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>
            {currentQ < questions.length - 1 ? "NEXT" : "FINISH"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Tap Match Mini Game ---
function TapMatchGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stars: number) => void;
}) {
  const data = game.data as Record<string, any>;
  const pairs = useMemo<Array<{ arabic: string; answer: string }>>(
    () =>
      (data.pairs ?? []).map((p: Record<string, string>) => ({
        arabic: p.arabic,
        answer: p.answer ?? p.english ?? "",
      })),
    [],
  );
  const [matchedCount, setMatchedCount] = useState(0);
  const [selectedArabic, setSelectedArabic] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);

  const shuffledAnswers = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5),
    [pairs],
  );

  const handleArabicTap = (arabic: string) => {
    if (matched.has(arabic)) return;
    setSelectedArabic(arabic);
  };

  const handleAnswerTap = (answer: string) => {
    if (!selectedArabic) return;
    const pair = pairs.find((p) => p.arabic === selectedArabic);
    if (pair?.answer === answer) {
      setMatched((prev) => new Set(prev).add(selectedArabic));
      setMatchedCount((c) => c + 1);
      if (matchedCount + 1 >= pairs.length) {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onFinish(stars);
      }
    } else {
      setMistakes((m) => m + 1);
    }
    setSelectedArabic(null);
  };

  return (
    <View>
      <Text style={s.gameInstruction}>Match the Arabic to its meaning</Text>
      <View style={s.matchGrid}>
        <View style={s.matchColumn}>
          {pairs.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                s.matchCard,
                matched.has(p.arabic) && s.matchCardDone,
                selectedArabic === p.arabic && s.matchCardSelected,
              ]}
              onPress={() => handleArabicTap(p.arabic)}
              disabled={matched.has(p.arabic)}
            >
              <Text style={s.matchArabic}>{p.arabic}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.matchColumn}>
          {shuffledAnswers.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.matchCard, matched.has(p.arabic) && s.matchCardDone]}
              onPress={() => handleAnswerTap(p.answer)}
              disabled={matched.has(p.arabic)}
            >
              <Text style={s.matchAnswer}>{p.arabic}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// --- Fallback Game (generic) ---
function FallbackGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stars: number) => void;
}) {
  return (
    <View>
      <View style={s.fallbackCard}>
        <Text style={s.fallbackType}>
          {game.type.replace(/_/g, " ").toUpperCase()}
        </Text>
        <Text style={s.fallbackDesc}>{game.description}</Text>
      </View>
      <TouchableOpacity style={s.nextBtn} onPress={() => onFinish(3)}>
        <Text style={s.nextBtnText}>COMPLETE</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Completion Screen ---
function CompletionScreen({
  stars,
  xpEarned,
  onDone,
}: {
  stars: number;
  xpEarned: number;
  onDone: () => void;
}) {
  return (
    <View style={s.completionContainer}>
      <Trophy size={56} color={theme.colors.secondary} />
      <Text style={s.completionTitle}>Level Complete!</Text>
      <View style={s.starsRow}>
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={36}
            color={
              i <= stars ? theme.colors.secondary : theme.colors.surfaceHigh
            }
            fill={i <= stars ? theme.colors.secondary : "transparent"}
          />
        ))}
      </View>
      <Text style={s.xpText}>+{xpEarned} XP</Text>
      <TouchableOpacity style={s.doneBtn} onPress={onDone}>
        <Text style={s.doneBtnText}>CONTINUE</Text>
      </TouchableOpacity>
    </View>
  );
}

export function MiniGamePlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { levelId } = route.params;

  const { data: res } = useGetLevelDetailQuery(levelId);
  const level = res?.data;
  const [completeLevel] = useCompleteLevelMutation();
  const dispatch = useAppDispatch();

  const [result, setResult] = useState<{
    stars: number;
    xpEarned: number;
  } | null>(null);

  const handleFinish = useCallback(
    async (stars: number) => {
      if (!level) return;
      try {
        const res = await completeLevel({
          levelId: level.id,
          stars,
        }).unwrap();
        const newRewards = res.data?.new_rewards ?? [];
        if (newRewards.length > 0) {
          dispatch(setPendingRewardUnlocks(newRewards));
        }
        setResult({ stars, xpEarned: res.data?.xp_earned ?? level.xp_reward });
      } catch {
        setResult({ stars, xpEarned: level.xp_reward });
      }
    },
    [level, completeLevel, dispatch],
  );

  const handleDone = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (!level) {
    return (
      <ScreenWrapper>
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (result) {
    return (
      <ScreenWrapper>
        <CompletionScreen
          stars={result.stars}
          xpEarned={result.xpEarned}
          onDone={handleDone}
        />
      </ScreenWrapper>
    );
  }

  const game = level.mini_game;

  const GameComponent =
    game.type === "mcq"
      ? MCQGame
      : game.type === "tap_match"
        ? TapMatchGame
        : FallbackGame;

  return (
    <ScreenWrapper>
      <View style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.closeBtn}
          >
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>MINI GAME</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.gameTitle}>{game.description}</Text>
          <GameComponent game={game} onFinish={handleFinish} />
        </ScrollView>
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

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    color: theme.colors.secondary,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1.5,
  },

  scrollView: {},
  scrollContent: { padding: 20, paddingBottom: 40 },

  gameTitle: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 20,
    lineHeight: 26,
  },

  // MCQ styles
  gameQuestion: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 16,
    lineHeight: 26,
  },
  gameOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  gameOptionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  gameOptionWrong: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorSoft10,
  },
  gameOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "600",
  },
  gameInstruction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },

  // Match styles
  matchGrid: {
    flexDirection: "row",
    gap: 12,
  },
  matchColumn: {
    flex: 1,
    gap: 8,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  matchCardSelected: {
    borderColor: theme.colors.primary,
  },
  matchCardDone: {
    opacity: 0.4,
    borderColor: theme.colors.primary,
  },
  matchArabic: {
    fontSize: 22,
    color: theme.colors.text,
  },
  matchAnswer: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "700",
  },

  // Fallback
  fallbackCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  fallbackType: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  fallbackDesc: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 22,
  },

  // Shared
  nextBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  nextBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },

  // Completion
  completionContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  completionTitle: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  xpText: {
    fontSize: 22,
    color: theme.colors.secondary,
    fontWeight: "900",
    marginBottom: 32,
  },
  doneBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  doneBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});
