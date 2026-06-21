import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  RefreshCw,
  BarChart3,
  BookMarked,
  Heart,
  ChevronRight,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TactilePressable } from "../ui";
import { theme } from "../../theme/themes";
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

  return (
    <View style={s.section}>
      <Text style={s.heading}>Your Learning</Text>
      <View style={s.card}>
        <Row
          icon={RefreshCw}
          color={theme.colors.secondary}
          title="Daily Review"
          sub="Practice what's due"
          badge={reviewCount}
          onPress={() => navigation.navigate("DailyReview")}
        />
        <View style={s.divider} />
        <Row
          icon={BarChart3}
          color={theme.colors.primary}
          title="Mastery Map"
          sub="Your strong & weak skills"
          onPress={() => navigation.navigate("MasteryMap")}
        />
        <View style={s.divider} />
        <Row
          icon={BookMarked}
          color={theme.colors.pink}
          title="Mistake Notebook"
          sub="Revisit your mistakes"
          badge={mistakeCount}
          onPress={() => navigation.navigate("MistakeNotebook")}
        />
        <View style={s.divider} />
        <Row
          icon={Heart}
          color={theme.colors.cyan}
          title="Reflection"
          sub="A quiet moment with your companion"
          onPress={() => navigation.navigate("Reflection")}
        />
      </View>
    </View>
  );
}

function Row({
  icon: Icon,
  color,
  title,
  sub,
  badge,
  onPress,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  sub: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TactilePressable
      edgeColor={theme.colors.black20}
      radius={14}
      depth={2}
      haptic="light"
      faceStyle={s.row}
      onPress={onPress}
    >
      <View style={[s.iconChip, { backgroundColor: color + "1F" }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={s.body}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
      {badge && badge > 0 ? (
        <View style={[s.badge, { backgroundColor: color }]}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={theme.colors.textMuted} />
    </TactilePressable>
  );
}

const s = StyleSheet.create({
  // This card lives inside the Profile "Bento Stats Grid" (a row+wrap layout),
  // so it must claim a full row explicitly — otherwise it shrinks to its content.
  section: { width: "100%", marginBottom: 24 },
  heading: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: theme.colors.onPrimary, fontSize: 12, fontWeight: "900" },
  divider: { height: 1, backgroundColor: theme.colors.outline25, marginVertical: 2 },
});
