import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Play, RotateCw, Compass, Sparkles } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { dq } from "../../theme/designTokens";
import {
  useGetRecommendationsQuery,
  type Recommendation,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

type KindMeta = {
  badge: string;
  badgeBg: string;
  badgeText: string;
  coverIcon: LucideIcon;
  cta: string;
  ctaIcon: LucideIcon;
  sub: string;
};

const META: Record<Recommendation["kind"], KindMeta> = {
  new_content: {
    badge: "NEXT UP",
    badgeBg: dq.gold,
    badgeText: "#1a1400",
    coverIcon: Compass,
    cta: "Start lesson",
    ctaIcon: Play,
    sub: "Lesson",
  },
  revision: {
    badge: "REVIEW",
    badgeBg: "rgba(255,255,255,0.1)",
    badgeText: "#cfd6cd",
    coverIcon: RotateCw,
    cta: "Review",
    ctaIcon: RotateCw,
    sub: "Practice",
  },
  reengage: {
    badge: "RESUME",
    badgeBg: dq.green,
    badgeText: dq.onGreen,
    coverIcon: Sparkles,
    cta: "Resume",
    ctaIcon: Play,
    sub: "Continue",
  },
};

const MAX_CARDS = 6;

function masteryPct(reason: string): number | null {
  const m = reason.match(/(\d+)\s*%/);
  return m ? Math.max(0, Math.min(100, Number(m[1]))) : null;
}

function cap(s?: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function RecCard({ rec }: { rec: Recommendation }) {
  const navigation = useNavigation<Nav>();
  const meta = META[rec.kind] ?? META.new_content;
  const CoverIcon = meta.coverIcon;
  const CtaIcon = meta.ctaIcon;
  const pct = rec.kind === "revision" ? masteryPct(rec.reason) : null;
  const title = rec.title.replace(/^(Revise:|Continue:)\s*/, "");
  const course = cap(rec.course_type as string | undefined);
  const sub = course ? `${course} · ${meta.sub}` : meta.sub;

  const onPress = () => {
    if (rec.level_id) {
      navigation.navigate("LevelDetail", {
        levelId: rec.level_id,
        courseType: (rec.course_type as any) || undefined,
      });
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!rec.level_id}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={["rgba(136,217,130,0.16)", "rgba(136,217,130,0.03)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.cover}
      >
        <View style={[s.badge, { backgroundColor: meta.badgeBg }]}>
          <Text style={[s.badgeText, { color: meta.badgeText }]}>
            {meta.badge}
          </Text>
        </View>
        <CoverIcon size={42} color={dq.green} />
      </LinearGradient>

      <View style={s.body}>
        <View style={{ gap: 2 }}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={s.cardSub} numberOfLines={1}>
            {sub}
          </Text>
        </View>

        {pct !== null ? (
          <View style={{ gap: 5 }}>
            <View style={s.track}>
              <View style={[s.fill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.progressText}>{pct}% complete</Text>
          </View>
        ) : (
          <View style={s.ctaRow}>
            <CtaIcon size={13} color={dq.green} />
            <Text style={s.ctaText}>{meta.cta}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function NextBestActionCard() {
  const navigation = useNavigation<Nav>();
  const { data: recRes } = useGetRecommendationsQuery();

  const recs = recRes?.data ?? [];
  if (recs.length === 0) return null;

  const visible = recs.slice(0, MAX_CARDS);

  return (
    <View>
      <View style={s.header}>
        <Text style={s.headerTitle}>Recommended for you</Text>
        <Pressable
          onPress={() => navigation.navigate("Demo", { screen: "PathScreen" })}
          hitSlop={8}
        >
          <Text style={s.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.scroller}
        contentContainerStyle={s.scrollerContent}
      >
        {visible.map((rec) => (
          <RecCard key={rec.id} rec={rec} />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: dq.white },
  seeAll: { fontSize: 13, fontWeight: "700", color: dq.green },

  // bleed out of the screen's 20px horizontal padding so cards reach the edge
  scroller: { marginHorizontal: -20 },
  scrollerContent: { gap: 12, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 4 },

  card: {
    width: 158,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    overflow: "hidden",
  },
  cover: {
    height: 94,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.45,
  },
  body: { padding: 12, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: dq.text },
  cardSub: { fontSize: 12, fontWeight: "600", color: dq.muted },
  track: {
    height: 5,
    borderRadius: 99,
    backgroundColor: dq.trackWhite08,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99, backgroundColor: dq.green },
  progressText: { fontSize: 11, fontWeight: "700", color: dq.muted },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ctaText: { fontSize: 12, fontWeight: "800", color: dq.green },
});
