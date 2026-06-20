import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, RefreshCw, Compass, ArrowRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AnimatedPressable } from "../ui";
import { theme } from "../../theme/themes";
import {
  useGetRecommendationsQuery,
  useGetLearningStateQuery,
  type Recommendation,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

const META: Record<
  Recommendation["kind"],
  { accent: string; label: string; cta: string; icon: typeof Sparkles }
> = {
  revision: { accent: theme.colors.secondary, label: "Revision", cta: "Practice", icon: RefreshCw },
  new_content: { accent: theme.colors.primary, label: "Next up", cta: "Start", icon: Compass },
  reengage: { accent: theme.colors.lavender, label: "Welcome back", cta: "Resume", icon: Sparkles },
};

const CARD_W = 212;
const MAX_CARDS = 6;
const CARD_GRAD = ["#262A23", "#191C18"] as const; // subtle, brand-tinted dark

function masteryPct(reason: string): number | null {
  const m = reason.match(/(\d+)\s*%/);
  return m ? Math.max(0, Math.min(100, Number(m[1]))) : null;
}

function RecCard({ rec }: { rec: Recommendation }) {
  const navigation = useNavigation<Nav>();
  const meta = META[rec.kind] ?? META.new_content;
  const Icon = meta.icon;
  const accent = meta.accent;
  const pct = rec.kind === "revision" ? masteryPct(rec.reason) : null;
  const title = rec.title.replace(/^(Revise:|Continue:)\s*/, "");

  const onPress = () => {
    if (rec.level_id) {
      navigation.navigate("LevelDetail", {
        levelId: rec.level_id,
        courseType: (rec.course_type as any) || undefined,
      });
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!rec.level_id}
      haptic="light"
      style={[s.cardShadow, { shadowColor: accent }]}
    >
      <LinearGradient
        colors={CARD_GRAD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.card, { borderColor: accent + "33" }]}
      >
        <View style={s.top}>
          <View style={[s.iconChip, { backgroundColor: accent + "26" }]}>
            <Icon size={18} color={accent} />
          </View>
          <Text style={[s.kind, { color: accent }]}>{meta.label.toUpperCase()}</Text>
        </View>

        <Text style={s.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={s.reason} numberOfLines={2}>
          {rec.message || rec.reason}
        </Text>

        {pct !== null && (
          <View style={s.track}>
            <View style={[s.fill, { width: `${pct}%`, backgroundColor: accent }]} />
          </View>
        )}

        <View style={s.footer}>
          <Text style={[s.cta, { color: accent }]}>{meta.cta}</Text>
          <View style={[s.ctaCircle, { backgroundColor: accent + "22" }]}>
            <ArrowRight size={14} color={accent} />
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function NextBestActionCard() {
  const { data: recRes } = useGetRecommendationsQuery();
  const { data: stateRes } = useGetLearningStateQuery();

  const recs = recRes?.data ?? [];
  if (recs.length === 0) return null;

  const motivation = stateRes?.data?.motivation;
  const visible = recs.slice(0, MAX_CARDS);

  return (
    <View style={s.wrap}>
      <View style={s.headerRow}>
        <Sparkles size={15} color={theme.colors.secondary} />
        <Text style={s.header}>Recommended for you</Text>
        {recs.length > 1 && <Text style={s.count}>{recs.length}</Text>}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        contentContainerStyle={s.scroll}
      >
        {visible.map((rec) => (
          <RecCard key={rec.id} rec={rec} />
        ))}
      </ScrollView>

      {motivation ? (
        <View style={s.motivationWrap}>
          <Sparkles size={13} color={theme.colors.secondary} />
          <Text style={s.motivation}>{motivation}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 18 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  header: { color: theme.colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 0.2 },
  count: {
    marginLeft: 2,
    minWidth: 20,
    textAlign: "center",
    color: theme.colors.onPrimary,
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
  },
  scroll: { paddingRight: 16, paddingVertical: 2 },

  cardShadow: {
    width: CARD_W,
    marginRight: 12,
    borderRadius: 20,
  },
  card: {
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    minHeight: 146,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  top: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 11 },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  kind: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  title: { color: "#ECEFEA", fontSize: 16.5, fontWeight: "900", lineHeight: 21, marginBottom: 4 },
  reason: { color: "#98A093", fontSize: 12, lineHeight: 16 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 11,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cta: { fontSize: 13, fontWeight: "900", letterSpacing: 0.3 },
  ctaCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  motivationWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
  },
  motivation: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
