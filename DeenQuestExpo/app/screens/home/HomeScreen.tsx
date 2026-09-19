import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTabBarSpace } from "../../navigators/DemoNavigator";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import {
  CoachCard,
  ExploreRow,
  HomeHeader,
  QuestCard,
  StatsCard,
  home,
  type ExploreRoute,
} from "../../components/home";
import {
  useGetDailyTasksQuery,
  useGetProgressQuery,
  useGetProfileQuery,
  useGetCoachInsightsQuery,
} from "../../store/services/api";
import type { DailyTask } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  COACH_PRACTICE_COURSE,
  coachHasTopInsight,
  type CoachState,
} from "../../services/coach";
import {
  trackCoachCardShown,
  trackCoachCTATapped,
} from "../../services/telemetry";

const QUESTS_COLLAPSED = 3;

type Nav = NativeStackNavigationProp<AppStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const tabBarSpace = useTabBarSpace();

  const { data: tasksData, isLoading: tasksLoading } = useGetDailyTasksQuery();
  const { data: progressData } = useGetProgressQuery();
  const { data: profileData } = useGetProfileQuery();
  const { data: coachRes } = useGetCoachInsightsQuery();

  const [expanded, setExpanded] = useState(false);

  const tasks = tasksData?.data ?? [];
  const progress = progressData?.data;
  const profile = profileData?.data;

  const totalXP = progress?.xp ?? 0;
  const currentStreak = progress?.current_streak ?? 0;
  const week = progress?.weekly_completions ?? new Array(7).fill(false);

  const displayName =
    profile?.display_name || profile?.email?.split("@")[0] || "Explorer";

  const coachData = coachRes?.data ?? null;
  const coach: CoachState | null =
    coachData && coachData.insights.length > 0 ? coachData : null;
  const coachActionable = coach != null && coachHasTopInsight(coach);

  useEffect(() => {
    if (coach) trackCoachCardShown();
  }, [coach]);

  const openTask = useCallback(
    (task: DailyTask) => navigation.navigate("DailyTaskDetail", { task }),
    [navigation],
  );

  const startCoachPractice = useCallback(() => {
    if (!coach) return;
    trackCoachCTATapped();
    if (!coachHasTopInsight(coach)) {
      navigation.navigate("CoachInsights");
      return;
    }
    navigation.navigate("LessonPlayer", {
      levelId: coach.practiceLevelId,
      startLessonIndex: 0,
      courseType: COACH_PRACTICE_COURSE,
      coachInsightId: coach.insightId,
    });
  }, [coach, navigation]);

  const openInsights = useCallback(
    () => navigation.navigate("CoachInsights"),
    [navigation],
  );

  const shown = expanded ? tasks : tasks.slice(0, QUESTS_COLLAPSED);

  return (
    <ScreenWrapper style={s.screen} innerStyle={s.wrapper}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: tabBarSpace + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          name={displayName}
          onSettings={() => navigation.navigate("Settings")}
        />

        <StatsCard
          streak={currentStreak}
          xp={totalXP}
          week={week}
          onPress={() =>
            navigation.navigate("Demo", { screen: "RewardsScreen" })
          }
        />

        {coach && (
          <CoachCard
            coach={coach}
            onFix={startCoachPractice}
            onInsights={openInsights}
          />
        )}

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Daily Quests</Text>
          {tasks.length > QUESTS_COLLAPSED && (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              hitSlop={10}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Text style={s.seeAll}>{expanded ? "Show less" : "See all"}</Text>
            </Pressable>
          )}
        </View>

        {tasksLoading ? (
          <Loader />
        ) : (
          <View style={s.quests}>
            {coachActionable && coach && (
              <QuestCard
                key="coach-practice"
                title={coach.suggestedMission.title}
                subtitle={coach.suggestedMission.subtitle}
                category="coach"
                icon={Sparkles}
                xp={coach.suggestedMission.xp}
                done={false}
                onPress={startCoachPractice}
              />
            )}

            {shown.map((task) => (
              <QuestCard
                key={task.id}
                title={task.title}
                category={task.category}
                xp={task.reward_xp}
                done={task.completed}
                onPress={() => openTask(task)}
              />
            ))}

            {shown.length === 0 && !coachActionable && (
              <Text style={s.empty}>
                Today's quests are being prepared. Check back shortly.
              </Text>
            )}
          </View>
        )}

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Explore</Text>
        </View>

        <ExploreRow
          onOpen={(route: ExploreRoute) => navigation.navigate(route)}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  screen: { backgroundColor: home.night },
  wrapper: { flex: 1 },
  scroll: {
    paddingTop: 4,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: home.gutter,
    marginTop: 4,
    marginBottom: -4,
  },
  sectionTitle: {
    color: home.text,
    fontSize: 23,
    fontFamily: "Nunito_900Black",
  },
  seeAll: {
    color: home.tealBright,
    fontSize: 15,
    fontFamily: "Nunito_800ExtraBold",
  },
  quests: {
    gap: 12,
  },
  empty: {
    color: home.muted,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
});
