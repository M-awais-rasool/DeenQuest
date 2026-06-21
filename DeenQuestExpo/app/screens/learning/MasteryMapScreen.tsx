import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Sprout } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import { useQuranFont } from "../../hooks/useQuranFont";
import { LearningHeader, EmptyState } from "../../components/learning/parts";
import { useGetLearningStateQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

const WEAK = 0.5;
const STRONG = 0.8;

function tone(mastery: number) {
  if (mastery >= STRONG) return { color: theme.colors.primary, label: "Strong" };
  if (mastery < WEAK) return { color: theme.colors.error, label: "Weak" };
  return { color: theme.colors.secondary, label: "Learning" };
}

function label(tag: string) {
  return tag.startsWith("level:") ? `Level ${tag.slice(6)}` : tag;
}

export function MasteryMapScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch, isFetching } = useGetLearningStateQuery();
  const { fontFamily } = useQuranFont();
  const state = data?.data;

  const skills = useMemo(() => {
    const entries = Object.entries(state?.skills ?? {}).map(([tag, st]) => ({
      tag,
      mastery: st.mastery,
    }));
    entries.sort((a, b) => a.mastery - b.mastery); // weakest first
    return entries;
  }, [state]);

  const strong = skills.filter((s) => s.mastery >= STRONG).length;
  const weak = skills.filter((s) => s.mastery < WEAK).length;

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader
        title="Mastery Map"
        subtitle="How well you know each skill"
        onBack={() => navigation.goBack()}
        count={skills.length}
        countLabel="skills"
        accent={theme.colors.primary}
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
          {skills.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="Your map is growing"
              sub="Answer some lessons and your skills will appear here with mastery levels."
            />
          ) : (
            <>
              <View style={s.summary}>
                <Summary n={strong} label="Strong" color={theme.colors.primary} />
                <Summary n={skills.length - strong - weak} label="Learning" color={theme.colors.secondary} />
                <Summary n={weak} label="Weak" color={theme.colors.error} />
              </View>

              {skills.map((sk) => {
                const t = tone(sk.mastery);
                const pct = Math.round(sk.mastery * 100);
                const isLetter = !sk.tag.startsWith("level:");
                return (
                  <View key={sk.tag} style={s.row}>
                    <View style={[s.tagChip, { borderColor: t.color + "55" }]}>
                      <Text
                        style={[
                          s.tagText,
                          isLetter ? { fontFamily, fontSize: 22 } : { fontSize: 12, fontWeight: "800" },
                        ]}
                      >
                        {isLetter ? sk.tag : label(sk.tag)}
                      </Text>
                    </View>
                    <View style={s.barWrap}>
                      <View style={s.barTop}>
                        <Text style={[s.toneLabel, { color: t.color }]}>{t.label}</Text>
                        <Text style={s.pct}>{pct}%</Text>
                      </View>
                      <View style={s.track}>
                        <View style={[s.fill, { width: `${pct}%`, backgroundColor: t.color }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

function Summary({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={s.sumCard}>
      <Text style={[s.sumNum, { color }]}>{n}</Text>
      <Text style={s.sumLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 40, gap: 10 },
  summary: { flexDirection: "row", gap: 10, marginBottom: 8 },
  sumCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sumNum: { fontSize: 22, fontWeight: "900" },
  sumLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 14,
    padding: 12,
  },
  tagChip: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tagText: { color: theme.colors.text },
  barWrap: { flex: 1 },
  barTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  toneLabel: { fontSize: 12, fontWeight: "800" },
  pct: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "700" },
  track: { height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceHigh, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});
