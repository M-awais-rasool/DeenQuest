import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  RotateCw,
  Map,
  NotebookPen,
  Feather,
  MessageCircle,
  TrendingUp,
  CalendarDays,
  ChevronRight,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { dq } from "../../theme/designTokens";
import { useGetReviewQuery, useGetMistakesQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

// Entry points to the Phase-1 learning screens, shown on the Profile screen.
export function LearningToolsCard() {
  const navigation = useNavigation<Nav>();
  const { data: review } = useGetReviewQuery();
  const { data: mistakes } = useGetMistakesQuery();
  const reviewCount = review?.data?.length ?? 0;
  const mistakeCount = mistakes?.data?.length ?? 0;

  const rows: {
    icon: LucideIcon;
    title: string;
    sub: string;
    onPress: () => void;
  }[] = [
    {
      icon: RotateCw,
      title: "Daily Review",
      sub: `${reviewCount} cards due`,
      onPress: () => navigation.navigate("DailyReview"),
    },
    {
      icon: Map,
      title: "Mastery Map",
      sub: "See your progress",
      onPress: () => navigation.navigate("MasteryMap"),
    },
    {
      icon: NotebookPen,
      title: "Mistake Notebook",
      sub: `${mistakeCount} to revisit`,
      onPress: () => navigation.navigate("MistakeNotebook"),
    },
    {
      icon: Feather,
      title: "Reflection",
      sub: "Today's prompt",
      onPress: () => navigation.navigate("Reflection"),
    },
    {
      icon: MessageCircle,
      title: "Ask a Question",
      sub: "Get help anytime",
      onPress: () => navigation.navigate("KnowledgeAsk"),
    },
    {
      icon: TrendingUp,
      title: "Weekly Report",
      sub: "Updated Sunday",
      onPress: () => navigation.navigate("WeeklyReport"),
    },
    {
      icon: CalendarDays,
      title: "Study Plan",
      sub: "15 min / day",
      onPress: () => navigation.navigate("StudyPlan"),
    },
  ];

  return (
    <View style={s.section}>
      <Text style={s.heading}>Your Learning</Text>
      <View style={s.card}>
        {rows.map((row, i) => {
          const Icon = row.icon;
          const last = i === rows.length - 1;
          return (
            <Pressable
              key={row.title}
              onPress={row.onPress}
              style={({ pressed }) => [
                s.row,
                !last && s.rowBorder,
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={s.iconChip}>
                <Icon size={18} color={dq.green} />
              </View>
              <View style={s.body}>
                <Text style={s.title}>{row.title}</Text>
                <Text style={s.sub}>{row.sub}</Text>
              </View>
              <ChevronRight size={18} color={dq.chevron} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { width: "100%" },
  heading: {
    color: dq.white,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  card: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dq.rowBorder,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: dq.trackGreenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 1 },
  title: { color: dq.text, fontSize: 14, fontWeight: "700" },
  sub: { color: dq.muted, fontSize: 12, fontWeight: "600" },
});
