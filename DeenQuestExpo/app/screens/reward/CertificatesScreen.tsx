import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { dq } from "../../theme/designTokens";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { AnimatedPressable } from "../../components/ui";
import { FadeInView } from "../../components/level/lesson/shared";
import { buildSections } from "../../components/level/path/sections";
import {
  useGetLevelsQuery,
  useGetLevelDetailQuery,
} from "../../store/services/api";
import { useAppSelector } from "../../store/hooks";
import { CertificateCard, type CertificateEntry } from "./components/CertificateCard";
import {
  CertificateDetail,
  type CertificateDetailData,
} from "./components/CertificateDetail";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

function awardTitle(levelTitle: string): string {
  const [, after] = levelTitle.split(/^\s*checkpoint\s*:\s*/i);
  return (after ?? levelTitle).trim();
}

export function CertificatesScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((state) => state.main.user);
  const holderName =
    user?.display_name || user?.email?.split("@")[0] || "Student";

  const { data: levelsRes, isLoading } = useGetLevelsQuery({ courseType: "qaida" });
  const levels = useMemo(() => levelsRes?.data ?? [], [levelsRes]);

  const entries: CertificateEntry[] = useMemo(() => {
    const sections = buildSections(levels, "qaida");
    return sections
      .map((section) => {
        const closing = section.data[section.data.length - 1];
        if (!closing) return null;
        return {
          levelId: closing.id,
          courseLevel: closing.course_level || closing.id,
          title: awardTitle(closing.title),
          sectionTitle: section.title,
          earned: closing.status === "completed",
        } satisfies CertificateEntry;
      })
      .filter((e): e is CertificateEntry => e !== null);
  }, [levels]);

  const earnedCount = entries.filter((e) => e.earned).length;

  const [openEntry, setOpenEntry] = useState<CertificateEntry | null>(null);
  const { data: detailRes } = useGetLevelDetailQuery(
    { levelId: openEntry?.levelId ?? 0, courseType: "qaida" },
    { skip: !openEntry },
  );

  const detail: CertificateDetailData | null = useMemo(() => {
    if (!openEntry) return null;
    const lesson = detailRes?.data?.lessons?.find(
      (l) => l.component === "CertificateComponent",
    );
    const data = (lesson?.data ?? {}) as Record<string, unknown>;
    return {
      title: (data.title as string) || openEntry.title,
      message: data.message as string | undefined,
      nextPhase: data.next_phase as string | undefined,
      sectionTitle: openEntry.sectionTitle,
      courseLevel: openEntry.courseLevel,
      earned: openEntry.earned,
      holderName,
    };
  }, [openEntry, detailRes, holderName]);

  const close = useCallback(() => setOpenEntry(null), []);

  return (
    <ScreenWrapper innerStyle={s.wrapper}>
      <View style={s.headerRow}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          haptic="light"
        >
          <ArrowLeft size={18} color={dq.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <Text style={s.headerTitle}>Certificates</Text>
        <View style={s.backBtn} />
      </View>

      {isLoading ? (
        <Loader fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView style={s.summary}>
            <Text style={s.summaryCount}>
              {earnedCount}
              <Text style={s.summaryTotal}> / {entries.length}</Text>
            </Text>
            <Text style={s.summaryLabel}>certificates earned</Text>
            <View style={s.summaryTrack}>
              <View
                style={[
                  s.summaryFill,
                  {
                    width: `${
                      entries.length
                        ? Math.round((earnedCount / entries.length) * 100)
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </FadeInView>

          {entries.length === 0 ? (
            <Text style={s.empty}>No certificates yet.</Text>
          ) : (
            <View style={s.list}>
              {entries.map((entry, i) => (
                <CertificateCard
                  key={entry.levelId}
                  entry={entry}
                  index={i}
                  onPress={() => setOpenEntry(entry)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <CertificateDetail data={detail} visible={!!openEntry} onClose={close} />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Nunito_900Black",
    color: dq.text,
  },
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 100 },

  summary: { alignItems: "center", marginBottom: 26 },
  summaryCount: {
    fontSize: 40,
    fontFamily: "Nunito_900Black",
    color: dq.gold,
    lineHeight: 46,
  },
  summaryTotal: { fontSize: 22, color: dq.faint },
  summaryLabel: {
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
    color: dq.muted,
    letterSpacing: 0.4,
  },
  summaryTrack: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: 5,
    backgroundColor: dq.card,
    overflow: "hidden",
    marginTop: 14,
  },
  summaryFill: { height: "100%", backgroundColor: dq.gold, borderRadius: 5 },

  list: { marginTop: 2 },
  empty: {
    fontSize: 14,
    color: dq.muted,
    textAlign: "center",
    paddingTop: 30,
  },
});
