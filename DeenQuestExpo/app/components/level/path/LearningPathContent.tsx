import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import type { SectionListRenderItem } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Sparkles } from "lucide-react-native";

import {
  useGetLevelsQuery,
  useGetProgressQuery,
} from "../../../store/services/api";
import type { LevelWithStatus } from "../../../store/services/api";
import type { AppStackParamList } from "../../../navigators/navigationTypes";
import { theme } from "../../../theme/themes";
import { Loader } from "../../Loader";
import { LevelNode } from "../map";

import { PathTopBar } from "./PathTopBar";
import { ActiveSectionBanner } from "./ActiveSectionBanner";
import { SectionDivider } from "./SectionDivider";
import { COURSE_CATALOG, courseEntry } from "./courseCatalog";
import { StreakPopup, type StreakOrigin } from "./StreakPopup";
import { buildSections, findActiveLocation } from "./sections";
import type { PathSection } from "./types";

const APPEAR_STAGGER_CAP = 8;

/** A node/header must be at least this % visible to count as "at the top". */
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

export function LearningPathContent() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  // Every course lives on this one screen, one after the other. The levels
  // endpoint is scoped to a single course — omitting course_type returns the
  // default rather than all of them — so each course is fetched on its own and
  // the sections are laid end to end. COURSE_CATALOG is a module constant, so
  // this is a fixed number of hooks on every render.
  const [qaidaEntry, namazEntry] = COURSE_CATALOG;
  const qaidaLevels = useGetLevelsQuery({ courseType: qaidaEntry.courseType });
  const namazLevels = useGetLevelsQuery({ courseType: namazEntry.courseType });
  const isLoading = qaidaLevels.isLoading || namazLevels.isLoading;

  const { data: progressRes } = useGetProgressQuery();

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  // Which section the user is currently scrolled into — drives the pinned
  // banner and the course name in the header. Tracked by key, not by index:
  // `index` counts sections within one course, so with every course on the
  // list it is 0…n for Qaida and 0…n again for Namaz, and looking it up in the
  // concatenated array would name a Qaida section while the reader is in Namaz.
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  // Streak popup state (origin = the chip it grows from).
  const [streakOpen, setStreakOpen] = useState(false);
  const [streakOrigin, setStreakOrigin] = useState<StreakOrigin | null>(null);

  const sections = useMemo(() => {
    // The path is one sequence, so it unlocks like one. The API scopes levels
    // to a course and opens each course's first level, which is right for a
    // course on its own but wrong here: with the courses laid end to end it
    // put an open Namaz level next to a Qaida level the reader had not reached
    // yet. A course stays shut until the one before it is finished, and only
    // the screen that chains them can decide that.
    const chained = [qaidaEntry, namazEntry].map((entry, i) => {
      const levels = (i === 0 ? qaidaLevels : namazLevels).data?.data ?? [];
      return { entry, levels };
    });

    let previousFinished = true;
    return chained.flatMap(({ entry, levels }) => {
      const gated = previousFinished
        ? levels
        : levels.map((level) => ({ ...level, status: "locked" as const }));

      // Judged on what the API actually said, not on the locks just applied.
      previousFinished =
        previousFinished &&
        levels.length > 0 &&
        levels.every((level) => level.status === "completed");

      return buildSections(gated, entry.courseType, entry.palette);
    });
  }, [qaidaLevels.data, namazLevels.data, qaidaEntry, namazEntry]);

  const xp = progressRes?.data?.xp ?? 0;
  const streak = progressRes?.data?.current_streak ?? 0;
  const weekly = useMemo(
    () => progressRes?.data?.weekly_completions ?? [],
    [progressRes],
  );

  const handleStreakPress = useCallback((origin: StreakOrigin) => {
    setStreakOrigin(origin);
    setStreakOpen(true);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ section?: { key?: string } }> }) => {
      const topKey = viewableItems[0]?.section?.key;
      if (typeof topKey === "string") setActiveSectionKey(topKey);
    },
  ).current;

  const listRef = useRef<SectionList<LevelWithStatus, PathSection>>(null);
  const didAutoScroll = useRef(false);

  useEffect(() => {
    if (didAutoScroll.current || sections.length === 0) return;
    const target = findActiveLocation(sections);
    if (!target || target.sectionIndex === 0) {
      didAutoScroll.current = true;
      return;
    }
    didAutoScroll.current = true;
    // Smoothly scroll to where the user left off instead of snapping there —
    // the list briefly shows the top, then glides down to the active section.
    const handle = setTimeout(() => {
      try {
        listRef.current?.scrollToLocation({
          sectionIndex: target.sectionIndex,
          itemIndex: target.itemIndex,
          viewPosition: 0.4,
          animated: true,
        });
      } catch {
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [sections]);

  const handleNodePress = useCallback((level: LevelWithStatus) => {
    if (level.status === "locked") return;
    setSelectedLevelId((prev) => (prev === level.id ? null : level.id));
  }, []);

  const handleStart = useCallback(
    (level: LevelWithStatus) => {
      setSelectedLevelId(null);
      navigation.navigate("LevelDetail", {
        levelId: level.id,
        courseType: level.course_type,
      });
    },
    [navigation],
  );

  const renderItem: SectionListRenderItem<LevelWithStatus, PathSection> =
    useCallback(
      ({ item, index, section }) => (
        <LevelNode
          level={item}
          offsetIndex={section.startIndex + index}
          appearIndex={Math.min(index, APPEAR_STAGGER_CAP)}
          isSelected={selectedLevelId === item.id}
          onPress={() => handleNodePress(item)}
          onStart={() => handleStart(item)}
          colors={section.colors}
        />
      ),
      [selectedLevelId, handleNodePress, handleStart],
    );

  const renderSectionHeader = useCallback(() => <View style={s.sectionGap} />, []);

  const renderSectionFooter = useCallback(
    ({ section }: { section: PathSection }) => (
      <SectionDivider section={section} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: LevelWithStatus) => String(item.id),
    [],
  );

  const activeSection =
    sections.find((section) => section.key === activeSectionKey) ?? sections[0];
  // The header names whichever course the reader has scrolled into.
  const course = courseEntry(activeSection?.courseType ?? qaidaEntry.courseType);

  if (isLoading) return <Loader fullScreen />;

  return (
    <View style={s.container}>
      <PathTopBar
        title={course.title}
        streak={streak}
        xp={xp}
        onStreakPress={handleStreakPress}
      />

      {activeSection && <ActiveSectionBanner section={activeSection} />}

      <SectionList
        ref={listRef}
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        keyExtractor={keyExtractor}
        stickySectionHeadersEnabled={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        ListFooterComponent={PathFooter}
        ListEmptyComponent={ListEmpty}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={9}
      />

      <StreakPopup
        visible={streakOpen}
        onClose={() => setStreakOpen(false)}
        streak={streak}
        weekly={weekly}
        origin={streakOrigin}
      />

    </View>
  );
}

function PathFooter() {
  return (
    <View style={s.footer}>
      <Sparkles size={16} color={theme.colors.primary} />
      <Text style={s.footerText}>More levels are on the way</Text>
    </View>
  );
}

function ListEmpty() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>Your learning path is being prepared.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 48,
  },
  modalHost: {
    flex: 1,
  },
  sectionGap: {
    height: 16,
  },
  footer: {
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 12,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
