import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable } from "../../components/ui";
import { AYAH_FONT, SectionLabel, SolidButton, hz } from "../../components/hifz/ui";
import {
  useGetHifzMistakesQuery,
  useGetSurahsQuery,
  type HifzMistake,
} from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "HifzMistakes">;

export function HifzMistakesScreen({ navigation }: Props) {
  const { data, isLoading } = useGetHifzMistakesQuery(50);
  const surahsQ = useGetSurahsQuery();
  const mistakes = data?.data ?? [];

  const surahNames = useMemo(() => {
    const map = new Map<number, { english: string; arabic: string }>();
    for (const surah of surahsQ.data?.data ?? []) {
      map.set(surah.id, { english: surah.english_name, arabic: surah.name });
    }
    return map;
  }, [surahsQ.data]);

  // Group by surah (J15), keeping the API's most-missed-first order inside.
  const groups = useMemo(() => {
    const bySurah = new Map<number, HifzMistake[]>();
    for (const mistake of mistakes) {
      const list = bySurah.get(mistake.surah_id);
      if (list) list.push(mistake);
      else bySurah.set(mistake.surah_id, [mistake]);
    }
    return Array.from(bySurah.entries());
  }, [mistakes]);

  const worst = mistakes[0];

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={17} color={hz.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View>
          <Text style={s.headerTitle}>Words you drop</Text>
          <Text style={s.headerSub}>
            {mistakes.length} word{mistakes.length === 1 ? "" : "s"} · last 30 days
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={hz.teal} />
        </View>
      ) : mistakes.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyGlyph}>۞</Text>
          <Text style={s.emptyTitle}>Nothing logged</Text>
          <Text style={s.emptyBody}>
            Words land here when a graded recitation misses them. An empty list is
            a good sign.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* insight card (J15) */}
            {!!worst && (
              <View style={s.insight}>
                <Text style={s.insightStar}>✦</Text>
                <Text style={s.insightText}>
                  Your most-dropped word is{" "}
                  <Text style={s.insightArabic}>{worst.word}</Text> — missed{" "}
                  <Text style={s.insightStrong}>
                    {worst.miss_count} time{worst.miss_count === 1 ? "" : "s"}
                  </Text>
                  . Worth a focused drill.
                </Text>
              </View>
            )}

            {groups.map(([surahId, words]) => {
              const names = surahNames.get(surahId);
              return (
                <View key={surahId}>
                  <SectionLabel style={s.groupLabel}>
                    {(names?.english ?? `Surah ${surahId}`).toUpperCase()}
                    {names?.arabic ? ` · ${names.arabic}` : ""}
                  </SectionLabel>
                  <View style={s.groupCard}>
                    {words.map((mistake, i) => {
                      const hot = mistake.miss_count >= 3;
                      return (
                        <View
                          key={mistake.id}
                          style={[s.row, i < words.length - 1 && s.rowDivider]}
                        >
                          <Text style={s.rowRef}>
                            {mistake.surah_id}:{mistake.ayah_number}
                          </Text>
                          <Text style={s.rowWord}>{mistake.word}</Text>
                          <View
                            style={[
                              s.countChip,
                              { backgroundColor: hot ? hz.roseTint : hz.goldTint },
                            ]}
                          >
                            <Text
                              style={[
                                s.countText,
                                { color: hot ? hz.rose : hz.gold },
                              ]}
                            >
                              ×{mistake.miss_count}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={s.footer}>
            <SolidButton
              label={`DRILL THESE ${mistakes.length} WORDS`}
              onPress={() =>
                Alert.alert(
                  "Coming soon",
                  "Targeted word drills land in the next update.",
                )
              }
              color={hz.rose}
              shadowColor={hz.roseShadow}
              textColor={hz.onRose}
            />
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}

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
  headerTitle: { fontFamily: "Nunito_900Black", fontSize: 19, color: hz.text },
  headerSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: hz.muted,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 6,
  },
  emptyGlyph: { fontSize: 34, color: hz.teal },
  emptyTitle: { fontFamily: "Nunito_900Black", fontSize: 16, color: hz.text },
  emptyBody: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 19,
    color: hz.muted,
    textAlign: "center",
  },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },

  insight: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: hz.card,
    borderLeftWidth: 4,
    borderLeftColor: hz.rose,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: hz.cardBorder,
    borderRightColor: hz.cardBorder,
    borderBottomColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  insightStar: { fontSize: 15, color: hz.rose },
  insightText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 19.5,
    color: hz.muted,
  },
  insightArabic: { fontFamily: AYAH_FONT, fontSize: 15, color: hz.text },
  insightStrong: { fontFamily: "Nunito_800ExtraBold", color: hz.text },

  groupLabel: { marginTop: 18, marginBottom: 10, marginLeft: 6 },
  groupCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 18,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: hz.rowBorder },
  rowRef: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    color: hz.faint,
    width: 38,
  },
  rowWord: {
    flex: 1,
    fontFamily: AYAH_FONT,
    fontSize: 24,
    lineHeight: 40,
    color: hz.text,
    textAlign: "right",
    writingDirection: "rtl",
  },
  countChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  countText: { fontFamily: "Nunito_900Black", fontSize: 11 },

  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 },
});

export default HifzMistakesScreen;
