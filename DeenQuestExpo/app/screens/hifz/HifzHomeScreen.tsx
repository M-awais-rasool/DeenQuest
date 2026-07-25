import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Flame } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable } from "../../components/ui";
import { ProgressRing } from "../../components/hifz/ProgressRing";
import {
  Bar,
  OutlineButton,
  RatingChip,
  SolidButton,
  hz,
} from "../../components/hifz/ui";
import {
  useGetHifzOverviewQuery,
  useGetHifzTodayQuery,
  type HifzPortionStrength,
  type HifzQueue,
  type HifzSurahStrength,
} from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "HifzHome">;

/** Queue row config — colours and copy from J2. */
const QUEUES: {
  key: HifzQueue;
  arabic: string;
  name: string;
  meta: string;
  accent: string;
  tint: string;
  arabicColor: string;
}[] = [
  { key: "sabqi", arabic: "سَبْقِي", name: "Sabqi", meta: "· this week", accent: hz.teal, tint: hz.tealTint, arabicColor: hz.tealBright },
  { key: "manzil", arabic: "مَنْزِل", name: "Manzil", meta: "· maintenance", accent: hz.gold, tint: hz.goldTint, arabicColor: hz.gold },
  { key: "sabaq", arabic: "سَبَق", name: "Sabaq", meta: "· new", accent: hz.violet, tint: hz.violetTint, arabicColor: hz.violetBright },
];

const QUEUE_MINUTES: Record<HifzQueue, number> = { sabqi: 2, manzil: 3, sabaq: 5 };

export function HifzHomeScreen({ navigation }: Props) {
  const overviewQ = useGetHifzOverviewQuery();
  const todayQ = useGetHifzTodayQuery();
  const [showSurahs, setShowSurahs] = useState(false);

  useFocusEffect(
    useCallback(() => {
      overviewQ.refetch();
      todayQ.refetch();
    }, []),
  );

  const overview = overviewQ.data?.data;
  const today = todayQ.data?.data;
  const loading = overviewQ.isLoading || todayQ.isLoading;

  const queues: Record<HifzQueue, NonNullable<typeof today>["sabqi"]> = {
    sabqi: today?.sabqi ?? [],
    manzil: today?.manzil ?? [],
    sabaq: today?.sabaq ?? [],
  };
  const weakest = overview?.weakest ?? [];
  const surahs = overview?.surahs ?? [];

  const startQueue = (queue: HifzQueue) => {
    const first = queues[queue][0];
    if (!first) return;
    navigation.navigate("HifzSession", { portionId: first.portion.id, queue });
  };

  const practiseAnyway = () => {
    const target = weakest.find((w) => w.sealed) ?? weakest[0];
    if (!target) return;
    navigation.navigate("HifzSession", {
      portionId: target.portion_id,
      queue: "sabqi",
    });
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={17} color={hz.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <Text style={s.headerTitle}>My Hifz</Text>
        {!!overview?.enrolled && (
          <Pressable
            onPress={() => navigation.navigate("HifzPlanPicker")}
            style={({ pressed }) => [s.planChip, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.planChipText} numberOfLines={1}>
              {(overview.plan_title ?? "PLAN").toUpperCase()}
            </Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={hz.teal} />
        </View>
      ) : !overview?.enrolled ? (
        <NotEnrolled onChoose={() => navigation.navigate("HifzPlanPicker")} />
      ) : today?.all_done ? (
        <CaughtUp
          streak={overview.streak_days}
          surahs={surahs}
          onPractise={practiseAnyway}
          canPractise={weakest.length > 0}
        />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={overviewQ.isFetching && !overviewQ.isLoading}
              onRefresh={() => {
                overviewQ.refetch();
                todayQ.refetch();
              }}
              tintColor={hz.teal}
            />
          }
        >
          {/* ── hero ring (J2) ── */}
          <LinearGradient
            colors={[hz.tealTint, hz.card]}
            locations={[0, 0.62]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={s.hero}
          >
            <ProgressRing
              pct={
                overview.portions_total > 0
                  ? (overview.portions_sealed / overview.portions_total) * 100
                  : 0
              }
              size={96}
              stroke={10}
              from={hz.teal}
              to={hz.teal}
              track={hz.screen}
            >
              <Text style={s.ringNum}>{overview.portions_sealed}</Text>
              <Text style={s.ringOf}>OF {overview.portions_total}</Text>
            </ProgressRing>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.heroLabel}>PORTIONS SEALED</Text>
              <Text style={s.heroTitle} numberOfLines={1}>
                {overview.next_up_label
                  ? `Next up: ${overview.next_up_label}`
                  : "Every portion sealed"}
              </Text>
              <Text style={s.heroSub}>
                {overview.ayahs_memorized} of {overview.ayahs_total} ayahs by heart
              </Text>
            </View>
          </LinearGradient>

          {/* ── stat cards (J2) ── */}
          <View style={s.statRow}>
            <View style={s.statCard}>
              <View style={s.statTop}>
                <Flame size={15} color={hz.gold} fill={hz.gold} />
                <Text style={s.statValue}>{overview.streak_days}</Text>
              </View>
              <Text style={s.statLabel}>REVIEW STREAK</Text>
              <Text style={s.statHint}>
                {overview.reviewed_today
                  ? "Today is done ✓"
                  : "Review today to keep it"}
              </Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: hz.tealBright }]}>
                {overview.overall_pct}%
              </Text>
              <Text style={s.statLabel}>OVERALL STRENGTH</Text>
              <Bar
                pct={overview.overall_pct}
                color={hz.teal}
                height={7}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>

          {/* ── today's session (J2) ── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Today's session</Text>
            <Text style={s.sectionMeta}>≈ {today?.estimated_minutes ?? 0} min</Text>
          </View>
          <View style={{ gap: 8, marginTop: 9 }}>
            {QUEUES.map((q) => {
              const items = queues[q.key];
              const done = items.length === 0;
              const subtitle =
                q.key === "sabaq" && items[0]
                  ? `${items[0].portion.label} · ${items.length * QUEUE_MINUTES.sabaq} min`
                  : `${items.length} portion${items.length === 1 ? "" : "s"} · ${items.length * QUEUE_MINUTES[q.key]} min`;
              return (
                <Pressable
                  key={q.key}
                  disabled={done}
                  onPress={() => startQueue(q.key)}
                  style={({ pressed }) => [
                    s.queueRow,
                    { borderLeftColor: q.accent },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={[s.queueIcon, { backgroundColor: q.tint }]}>
                    <Text style={[s.queueArabic, { color: q.arabicColor }]}>
                      {q.arabic}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.queueName}>
                      {q.name} <Text style={s.queueMeta}>{q.meta}</Text>
                    </Text>
                    <Text style={s.queueSub} numberOfLines={1}>
                      {done ? "Done for today" : subtitle}
                    </Text>
                  </View>
                  {done ? (
                    <View style={s.queueDone}>
                      <Text style={s.queueDoneGlyph}>✓</Text>
                    </View>
                  ) : (
                    <View style={[s.queueChip, { backgroundColor: q.tint }]}>
                      <Text style={[s.queueChipText, { color: q.arabicColor }]}>
                        {q.key === "sabaq" ? "START" : "DUE"}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* ── memory strength (J2) ── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Memory strength</Text>
            <Pressable onPress={() => setShowSurahs((v) => !v)} hitSlop={8}>
              <Text style={s.seeAll}>
                {showSurahs ? "Weakest ←" : "See all →"}
              </Text>
            </Pressable>
          </View>
          {showSurahs ? (
            <SurahList surahs={surahs} style={{ marginTop: 9 }} />
          ) : (
            <View style={[s.listCard, { marginTop: 9 }]}>
              {weakest.length === 0 ? (
                <Text style={s.emptyList}>Seal your first portion to see it here.</Text>
              ) : (
                weakest.map((row, i) => (
                  <StrengthRow
                    key={row.portion_id}
                    row={row}
                    last={i === weakest.length - 1}
                    onPress={() =>
                      navigation.navigate("HifzSession", {
                        portionId: row.portion_id,
                        queue: row.due ? "manzil" : "sabqi",
                      })
                    }
                  />
                ))
              )}
            </View>
          )}

          {/* ── mistakes teaser (J2) ── */}
          {overview.mistake_count > 0 && (
            <Pressable
              onPress={() => navigation.navigate("HifzMistakes")}
              style={({ pressed }) => [s.mistakeRow, pressed && { opacity: 0.8 }]}
            >
              <View style={s.mistakeIcon}>
                <Text style={s.mistakeGlyph}>!</Text>
              </View>
              <Text style={s.mistakeText}>
                {overview.mistake_count} words you keep dropping
              </Text>
              <Text style={s.mistakeChevron}>›</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

// ─────────────────────────────────────────────
// J2 — strength row
// ─────────────────────────────────────────────

function StrengthRow({
  row,
  last,
  onPress,
}: {
  row: HifzPortionStrength;
  last: boolean;
  onPress: () => void;
}) {
  const barColor =
    row.rating === "Strong" ? hz.teal : row.rating === "Medium" ? hz.gold : hz.rose;
  const pctColor =
    row.rating === "Strong" ? hz.tealBright : row.rating === "Medium" ? hz.gold : hz.rose;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.strengthRow,
        !last && s.rowDivider,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.strengthName}>
          <Text style={s.strengthLabel} numberOfLines={1}>
            {row.label}
          </Text>
          {row.due && (
            <View style={s.dueTag}>
              <Text style={s.dueTagText}>DUE</Text>
            </View>
          )}
          {!row.due && row.sealed && !row.blind_verified && (
            <View style={s.openTag}>
              <Text style={s.openTagText}>OPEN-BOOK ONLY</Text>
            </View>
          )}
        </View>
        <Bar pct={row.strength_pct} color={barColor} height={6} style={{ marginTop: 7 }} />
      </View>
      <Text style={[s.strengthPct, { color: pctColor }]}>{row.strength_pct}%</Text>
      <RatingChip rating={row.rating} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// J3 — by-surah list (shared with caught-up)
// ─────────────────────────────────────────────
function SurahList({
  surahs,
  style,
}: {
  surahs: HifzSurahStrength[];
  style?: object;
}) {
  return (
    <View style={[s.listCard, style]}>
      {surahs.map((surah, i) => (
        <View
          key={surah.surah_id}
          style={[s.surahRow, i < surahs.length - 1 && s.rowDivider]}
        >
          <Text style={s.surahArabic} numberOfLines={1}>
            {surah.surah_name}
          </Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.surahName}>{surah.english_name}</Text>
            <Text style={s.surahMeta}>
              {surah.sealed_portions} of {surah.total_portions} portion
              {surah.total_portions === 1 ? "" : "s"} · {surah.total_ayahs} ayahs
            </Text>
            <Bar
              pct={
                surah.total_portions > 0
                  ? (surah.sealed_portions / surah.total_portions) * 100
                  : 0
              }
              color={
                surah.sealed_portions === surah.total_portions ? hz.teal : hz.gold
              }
              height={6}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// J3 — all caught up
// ─────────────────────────────────────────────
function CaughtUp({
  streak,
  surahs,
  onPractise,
  canPractise,
}: {
  streak: number;
  surahs: HifzSurahStrength[];
  onPractise: () => void;
  canPractise: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[hz.tealTint, hz.card]}
          locations={[0, 0.62]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.caughtHero}
        >
          <View style={s.caughtCheck}>
            <Text style={s.caughtCheckGlyph}>✓</Text>
          </View>
          <Text style={s.caughtTitle}>Nothing due right now</Text>
          <Text style={s.caughtSub}>
            Today's session is complete. Your next review lands tomorrow.
          </Text>
          <View style={s.caughtStreak}>
            <Flame size={14} color={hz.gold} fill={hz.gold} />
            <Text style={s.caughtStreakText}>
              Review streak {streak} · Today is done ✓
            </Text>
          </View>
        </LinearGradient>

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>By surah</Text>
        <SurahList surahs={surahs} style={{ marginTop: 11 }} />
      </ScrollView>

      {canPractise && (
        <View style={s.footer}>
          <OutlineButton label="PRACTISE ANYWAY" onPress={onPractise} />
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// J1 — not enrolled
// ─────────────────────────────────────────────

const STEPS: { n: number; title: string; sub: string; bg: string; color: string }[] = [
  { n: 1, title: "Listen", sub: "Hear it ayah by ayah, on repeat", bg: hz.skyCard, color: hz.skyBright },
  { n: 2, title: "Repeat", sub: "Echo each ayah aloud", bg: hz.skyCard, color: hz.skyBright },
  { n: 3, title: "Recite · open mushaf", sub: "Graded word by word", bg: hz.tealTint, color: hz.tealBright },
  { n: 4, title: "Challenges", sub: "Gaps, order, fading ayah", bg: hz.violetTint, color: hz.violetBright },
  { n: 5, title: "Recite · from memory", sub: "Text hidden. The real test.", bg: hz.goldTint, color: hz.gold },
];

function NotEnrolled({ onChoose }: { onChoose: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[hz.tealTint, hz.card]}
          locations={[0, 0.6]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.introHero}
        >
          <View style={s.introBadge}>
            <Text style={s.introBadgeText}>حِفْظ</Text>
          </View>
          <Text style={s.introTitle}>Memorize, portion by portion</Text>
          <Text style={s.introSub}>
            Three to six ayahs at a time, through a five-step loop that ends with
            reciting from memory.
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 2, paddingTop: 20 }}>
          {STEPS.map((step, i) => (
            <View key={step.n}>
              {i > 0 && <View style={s.stepConnector} />}
              <View style={s.stepRow}>
                <View style={[s.stepDot, { backgroundColor: step.bg }]}>
                  <Text style={[s.stepNum, { color: step.color }]}>{step.n}</Text>
                </View>
                <View>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepSub}>{step.sub}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <SolidButton label="CHOOSE A PLAN" onPress={onChoose} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles — values lifted from the mock inline CSS
// ─────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Nunito_900Black",
    fontSize: 19,
    color: hz.text,
  },
  planChip: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 6,
    maxWidth: 130,
  },
  planChipText: {
    fontFamily: "Nunito_900Black",
    fontSize: 11,
    letterSpacing: 0.7,
    color: hz.muted,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: hz.tealEdge,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  ringNum: {
    fontFamily: "Nunito_900Black",
    fontSize: 22,
    lineHeight: 24,
    color: hz.text,
  },
  ringOf: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    color: hz.tealBright,
  },
  heroLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.3,
    color: hz.tealBright,
  },
  heroTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 17,
    color: hz.text,
    marginTop: 6,
  },
  heroSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: hz.muted,
    marginTop: 3,
  },

  statRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  statCard: {
    flex: 1,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  statValue: { fontFamily: "Nunito_900Black", fontSize: 18, color: hz.text },
  statLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: hz.faint,
    marginTop: 4,
  },
  statHint: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    color: hz.gold,
    marginTop: 5,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontFamily: "Nunito_900Black", fontSize: 16, color: hz.text },
  sectionMeta: { fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: hz.faint },
  seeAll: { fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: hz.teal },

  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: hz.card,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: hz.cardBorder,
    borderRightColor: hz.cardBorder,
    borderBottomColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  queueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  queueArabic: { fontFamily: "Amiri_700Bold", fontSize: 15 },
  queueName: { fontFamily: "Nunito_900Black", fontSize: 14.5, color: hz.text },
  queueMeta: { fontFamily: "Nunito_700Bold", fontSize: 12, color: hz.faint },
  queueSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: hz.muted,
    marginTop: 1,
  },
  queueDone: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: hz.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  queueDoneGlyph: { fontFamily: "Nunito_900Black", fontSize: 13, color: hz.onTeal },
  queueChip: { borderRadius: 11, paddingHorizontal: 11, paddingVertical: 6 },
  queueChipText: { fontFamily: "Nunito_900Black", fontSize: 11 },

  listCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 18,
    overflow: "hidden",
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: hz.rowBorder },
  emptyList: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: hz.faint,
    textAlign: "center",
    paddingVertical: 20,
  },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  strengthName: { flexDirection: "row", alignItems: "center", gap: 6 },
  strengthLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13.5,
    color: hz.text,
    flexShrink: 1,
  },
  dueTag: {
    backgroundColor: hz.roseTint,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dueTagText: { fontFamily: "Nunito_900Black", fontSize: 9, color: hz.rose },
  openTag: {
    backgroundColor: hz.track,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  openTagText: { fontFamily: "Nunito_900Black", fontSize: 9, color: hz.muted },
  strengthPct: {
    fontFamily: "Nunito_900Black",
    fontSize: 12,
    width: 34,
    textAlign: "right",
  },

  mistakeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  mistakeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: hz.roseTint,
    alignItems: "center",
    justifyContent: "center",
  },
  mistakeGlyph: { fontFamily: "Nunito_900Black", fontSize: 14, color: hz.rose },
  mistakeText: {
    flex: 1,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13.5,
    color: hz.text,
  },
  mistakeChevron: { fontFamily: "Nunito_800ExtraBold", fontSize: 16, color: hz.faint },

  // caught up (J3)
  caughtHero: {
    borderWidth: 1,
    borderColor: hz.tealEdge,
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    marginTop: 2,
  },
  caughtCheck: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: hz.teal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: hz.teal,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  caughtCheckGlyph: { fontFamily: "Nunito_900Black", fontSize: 28, color: hz.onTeal },
  caughtTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 21,
    color: hz.text,
    marginTop: 16,
  },
  caughtSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13.5,
    lineHeight: 21.5,
    color: hz.muted,
    textAlign: "center",
    marginTop: 7,
  },
  caughtStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: hz.tealDeep,
    borderWidth: 1,
    borderColor: hz.tealEdge,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  caughtStreakText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: hz.gold,
  },

  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  surahArabic: {
    fontFamily: "Amiri_700Bold",
    fontSize: 20,
    color: hz.muted,
    width: 60,
    textAlign: "right",
    writingDirection: "rtl",
  },
  surahName: { fontFamily: "Nunito_800ExtraBold", fontSize: 13.5, color: hz.text },
  surahMeta: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: hz.faint,
    marginTop: 1,
  },

  // not enrolled (J1)
  introHero: {
    borderWidth: 1,
    borderColor: hz.tealEdge,
    borderRadius: 26,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  introBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: hz.tealDeep,
    borderWidth: 2,
    borderColor: hz.teal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: hz.teal,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  introBadgeText: {
    fontFamily: "Amiri_700Bold",
    fontSize: 30,
    lineHeight: 52,
    color: hz.tealBright,
  },
  introTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 23,
    color: hz.text,
    marginTop: 18,
    textAlign: "center",
  },
  introSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    lineHeight: 22.5,
    color: hz.muted,
    textAlign: "center",
    marginTop: 8,
  },

  stepRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 9 },
  stepConnector: { width: 2, height: 10, backgroundColor: hz.cardBorder, marginLeft: 15 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontFamily: "Nunito_900Black", fontSize: 13 },
  stepTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 14.5, color: hz.text },
  stepSub: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: hz.faint },

  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24 },
});

export default HifzHomeScreen;
