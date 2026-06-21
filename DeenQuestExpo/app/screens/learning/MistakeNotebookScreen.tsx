import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { BookMarked, Check, Play, PartyPopper } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { TactilePressable, AnimatedPressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { useQuranFont } from "../../hooks/useQuranFont";
import { LearningHeader, EmptyState } from "../../components/learning/parts";
import {
  useGetMistakesQuery,
  useResolveMistakeMutation,
  type Mistake,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

// Tags are Arabic letters, or a "level:N" fallback for untagged content.
function isLetterTag(tag: string) {
  return !tag.startsWith("level:");
}

export function MistakeNotebookScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch, isFetching } = useGetMistakesQuery();
  const [resolve] = useResolveMistakeMutation();
  const { fontFamily } = useQuranFont();
  const items = data?.data ?? [];

  const practice = (m: Mistake) =>
    navigation.navigate("LevelDetail", {
      levelId: m.level_id,
      courseType: (m.course_type as any) || undefined,
    });

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader
        title="Mistake Notebook"
        subtitle="Revisit what you got wrong"
        onBack={() => navigation.goBack()}
        count={items.length}
        countLabel="open"
        accent={theme.colors.pink}
      />
      {isLoading ? (
        <Loader fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
        >
          {items.length === 0 ? (
            <EmptyState
              icon={PartyPopper}
              title="No mistakes — great job!"
              sub="Wrong answers you make will collect here so you can practice them again."
            />
          ) : (
            items.map((m) => {
              const letters = (m.skill_tags ?? []).filter(isLetterTag);
              return (
                <View key={m.id} style={s.card}>
                  <View style={s.topRow}>
                    <View style={s.iconChip}>
                      <BookMarked size={18} color={theme.colors.pink} />
                    </View>
                    <View style={s.body}>
                      <Text style={s.title}>
                        Level {m.level_id} · Lesson {m.lesson_index + 1}
                      </Text>
                      <Text style={s.sub}>
                        Missed {m.count} {m.count === 1 ? "time" : "times"}
                      </Text>
                    </View>
                    {m.count > 1 && (
                      <View style={s.countBadge}>
                        <Text style={s.countText}>×{m.count}</Text>
                      </View>
                    )}
                  </View>

                  {letters.length > 0 && (
                    <View style={s.chipRow}>
                      {letters.map((t, i) => (
                        <View key={i} style={s.chip}>
                          <Text style={[s.chipText, { fontFamily }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={s.actions}>
                    <TactilePressable
                      edgeColor={theme.colors.primaryContainer}
                      radius={12}
                      depth={3}
                      haptic="light"
                      style={s.practiceWrap}
                      faceStyle={s.practiceBtn}
                      onPress={() => practice(m)}
                    >
                      <Play size={14} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
                      <Text style={s.practiceText}>Practice</Text>
                    </TactilePressable>
                    <AnimatedPressable
                      style={s.resolveBtn}
                      haptic="medium"
                      onPress={() => resolve(m.id)}
                    >
                      <Check size={16} color={theme.colors.primary} />
                      <Text style={s.resolveText}>Got it</Text>
                    </AnimatedPressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.pink + "22",
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  countBadge: {
    backgroundColor: theme.colors.error + "22",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: { color: theme.colors.error, fontSize: 12, fontWeight: "900" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
  },
  chipText: { color: theme.colors.text, fontSize: 20, lineHeight: 26 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  practiceWrap: { flex: 1 },
  practiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 11,
    borderRadius: 12,
  },
  practiceText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
    backgroundColor: theme.colors.primary12,
  },
  resolveText: { color: theme.colors.primary, fontWeight: "800", fontSize: 13 },
});
