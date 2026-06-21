import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { RefreshCw, ChevronRight, CheckCircle2 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { TactilePressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { LearningHeader, EmptyState } from "../../components/learning/parts";
import { useGetReviewQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

function masteryPct(reason: string): number | null {
  const m = reason.match(/(\d+)\s*%/);
  return m ? Math.max(0, Math.min(100, Number(m[1]))) : null;
}

export function DailyReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch, isFetching } = useGetReviewQuery();
  const items = data?.data ?? [];

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader
        title="Daily Review"
        subtitle="Spaced-repetition practice that's due"
        onBack={() => navigation.goBack()}
        count={items.length}
        countLabel="due"
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
              icon={CheckCircle2}
              title="All caught up!"
              sub="Nothing is due for review right now. Keep learning and come back later."
            />
          ) : (
            items.map((rec) => {
              const pct = masteryPct(rec.reason);
              return (
                <TactilePressable
                  key={rec.id}
                  edgeColor={theme.colors.primaryContainer}
                  radius={16}
                  depth={3}
                  haptic="light"
                  faceStyle={s.card}
                  disabled={!rec.level_id}
                  onPress={() =>
                    rec.level_id &&
                    navigation.navigate("LevelDetail", {
                      levelId: rec.level_id,
                      courseType: (rec.course_type as any) || undefined,
                    })
                  }
                >
                  <View style={s.iconChip}>
                    <RefreshCw size={18} color={theme.colors.secondary} />
                  </View>
                  <View style={s.body}>
                    <Text style={s.title} numberOfLines={1}>
                      {rec.title.replace(/^Revise:\s*/, "")}
                    </Text>
                    <Text style={s.sub} numberOfLines={2}>
                      {rec.reason}
                    </Text>
                    {pct !== null && (
                      <View style={s.track}>
                        <View style={[s.fill, { width: `${pct}%` }]} />
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color={theme.colors.textMuted} />
                </TactilePressable>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.secondary12,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  sub: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceHigh,
    overflow: "hidden",
    marginTop: 8,
  },
  fill: { height: "100%", borderRadius: 3, backgroundColor: theme.colors.secondary },
});
