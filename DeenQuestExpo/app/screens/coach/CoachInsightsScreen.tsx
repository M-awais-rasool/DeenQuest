import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Mic } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { dq } from "../../theme/designTokens";
import {
  COACH_PRACTICE_COURSE,
  type CoachInsight,
  type CoachSeverity,
} from "../../services/coach";
import { useGetCoachInsightsQuery } from "../../store/services/api";
import { Loader } from "../../components/Loader";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "CoachInsights">;

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const SEVERITY_STYLE: Record<
  CoachSeverity,
  { label: string; bg: string; fg: string }
> = {
  high: { label: "HIGH", bg: "#3A1E24", fg: "#F0838C" },
  med: { label: "MED", bg: "#3A2F16", fg: "#EFB65A" },
  low: { label: "LOW", bg: "#123B34", fg: "#5EE0CE" },
};

function InsightCard({
  insight,
  onPractice,
}: {
  insight: CoachInsight;
  onPractice: () => void;
}) {
  const sev = SEVERITY_STYLE[insight.severity];
  const showWhy = () =>
    Alert.alert(insight.title, insight.why ?? "Keep practicing — you're improving!");

  return (
    <View style={s.insightCard}>
      <View style={s.insightTop}>
        <View style={[s.insightTile, { backgroundColor: insight.tileBg }]}>
          {insight.glyphIsArabic ? (
            <Text style={[s.insightGlyph, { color: insight.tileFg }]}>
              {insight.glyph}
            </Text>
          ) : (
            <Mic size={19} color={insight.tileFg} strokeWidth={2.2} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.insightTitle}>{insight.title}</Text>
          <Text style={s.insightDetail}>{insight.detail}</Text>
        </View>
        <View style={[s.sevChip, { backgroundColor: sev.bg }]}>
          <Text style={[s.sevText, { color: sev.fg }]}>{sev.label}</Text>
        </View>
      </View>

      {insight.practiceMinutes != null && (
        <View style={s.insightBtnRow}>
          <TactilePressable
            style={{ flex: 1 }}
            faceStyle={[
              s.practiceBtn,
              insight.severity !== "high" && s.practiceBtnGhost,
            ]}
            edgeColor={
              insight.severity === "high" ? dq.greenDark : "transparent"
            }
            radius={12}
            depth={insight.severity === "high" ? 3 : 0}
            haptic="light"
            onPress={onPractice}
          >
            <Text
              style={[
                s.practiceBtnText,
                insight.severity !== "high" && { color: "#5EE0CE" },
              ]}
            >
              PRACTICE · {insight.practiceMinutes} MIN
            </Text>
          </TactilePressable>
          <AnimatedPressable style={s.whyBtn} onPress={showWhy}>
            <Text style={s.whyBtnText}>WHY?</Text>
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

export function CoachInsightsScreen({ navigation }: Props) {
  const { data: coachRes, isLoading } = useGetCoachInsightsQuery();
  const coach = coachRes?.data ?? null;
  const hasWin = !!coach?.win?.bold;

  const startPractice = (insight: CoachInsight) => {
    if (insight.practiceLevelId == null) return;
    navigation.navigate("LessonPlayer", {
      levelId: insight.practiceLevelId,
      startLessonIndex: 0,
      courseType: COACH_PRACTICE_COURSE,
      coachInsightId: insight.id,
    });
  };

  if (isLoading) {
    return (
      <ScreenWrapper innerStyle={{ flex: 1 }}>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  if (!coach) {
    return (
      <ScreenWrapper innerStyle={{ flex: 1 }}>
        <View style={s.header}>
          <AnimatedPressable
            style={s.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Coach Insights</Text>
          </View>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>
            Complete a few lessons — your coach will start spotting patterns.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* header */}
      <View style={s.header}>
        <AnimatedPressable
          style={s.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Coach Insights</Text>
          <Text style={s.headerSub}>
            Based on {coach.lessonsAnalyzed} lessons · this week
          </Text>
        </View>
        <View style={s.aiChip}>
          <Text style={s.aiChipText}>AI</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* accuracy trend */}
        <View style={s.trendCard}>
          <View style={s.trendHeader}>
            <Text style={s.trendTitle}>Accuracy this week</Text>
            <Text
              style={[s.trendDelta, coach.weekDeltaPct < 0 && { color: "#F0838C" }]}
            >
              {coach.weekDeltaPct >= 0
                ? `▲ +${coach.weekDeltaPct}%`
                : `▼ ${coach.weekDeltaPct}%`}
            </Text>
          </View>
          <View style={s.chart}>
            {coach.weekAccuracy.map((v, i) => {
              const noData = v < 0;
              const isBest = !noData && v === Math.max(...coach.weekAccuracy);
              const strong = !noData && v >= 0.65;
              return (
                <View key={i} style={s.chartCol}>
                  {noData ? (
                    <View style={[s.bar, s.barNoData, { height: "20%" }]} />
                  ) : isBest ? (
                    <LinearGradient
                      colors={["#5EE0CE", "#2CC9B5"]}
                      style={[s.bar, { height: `${Math.round(v * 100)}%` }]}
                    />
                  ) : (
                    <View
                      style={[
                        s.bar,
                        { height: `${Math.round(v * 100)}%` },
                        { backgroundColor: strong ? "#2CC9B5" : "#1E4A44" },
                      ]}
                    />
                  )}
                  <Text style={[s.chartLabel, isBest && { color: dq.text }]}>
                    {WEEK_LETTERS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* things to fix */}
        <View style={s.fixHeader}>
          <Text style={s.fixTitle}>Things to fix</Text>
          <Text style={s.fixCount}>
            {coach.insights.length} patterns found
          </Text>
        </View>
        <View style={s.insightList}>
          {coach.insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onPractice={() => startPractice(insight)}
            />
          ))}
        </View>

        {hasWin && (
          <LinearGradient
            colors={["#26301C", "#16272B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={s.winCard}
          >
            <Text style={s.winStar}>✦</Text>
            <Text style={s.winText}>
              Your <Text style={s.winBold}>{coach.win.bold}</Text>
              {coach.win.middle}
              <Text style={s.winAccent}>{coach.win.boldAccent}</Text>
              {coach.win.tail}
            </Text>
          </LinearGradient>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Nunito_900Black", color: dq.text },
  headerSub: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: dq.faint,
  },
  aiChip: {
    backgroundColor: dq.greenTint,
    borderWidth: 1,
    borderColor: dq.green,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiChipText: {
    fontSize: 9,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
    letterSpacing: 1,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  // trend chart
  trendCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  trendTitle: { fontSize: 14, fontFamily: "Nunito_900Black", color: dq.text },
  trendDelta: { fontSize: 13, fontFamily: "Nunito_900Black", color: "#5EE0CE" },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    height: 104,
    marginTop: 14,
  },
  chartCol: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  barNoData: {
    backgroundColor: "#1B3036",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#2C464C",
  },
  chartLabel: {
    fontSize: 10,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
  },

  // things to fix
  fixHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  fixTitle: { fontSize: 15, fontFamily: "Nunito_900Black", color: dq.text },
  fixCount: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.faint },
  insightList: { gap: 10, marginTop: 12 },
  insightCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  insightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  insightTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  insightGlyph: {
    fontSize: 20,
    fontFamily: "Amiri_700Bold",
    lineHeight: 34,
  },
  insightTitle: { fontSize: 14, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  insightDetail: {
    fontSize: 11.5,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 1,
  },
  sevChip: {
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  sevText: {
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.6,
  },
  insightBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  practiceBtn: {
    backgroundColor: dq.green,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  practiceBtnGhost: {
    backgroundColor: dq.greenTint,
    borderWidth: 1.5,
    borderColor: dq.green,
  },
  practiceBtnText: {
    fontSize: 11.5,
    fontFamily: "Nunito_900Black",
    color: dq.onGreen,
    letterSpacing: 0.7,
  },
  whyBtn: {
    backgroundColor: dq.lockFill,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  whyBtnText: {
    fontSize: 11.5,
    fontFamily: "Nunito_900Black",
    color: dq.muted,
  },

  // win banner
  winCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#3E4A2C",
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 16,
  },
  winStar: { fontSize: 18, color: dq.gold },
  winText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: "Nunito_700Bold",
    color: "#D7E7E5",
  },
  winBold: { color: dq.text, fontFamily: "Nunito_800ExtraBold" },
  winAccent: { color: "#5EE0CE", fontFamily: "Nunito_800ExtraBold" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    textAlign: "center",
    lineHeight: 22,
  },
});
