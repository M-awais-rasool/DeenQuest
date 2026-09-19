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
import { useTabBarSpace } from "../../../navigators/DemoNavigator";
import { theme } from "../../../theme/themes";
import { Loader } from "../../Loader";
import { LevelNode, PATH_CYAN, PATH_NIGHT } from "../map";

import { PathBackdrop } from "./PathBackdrop";
import { PathHeader } from "./PathHeader";
import { CourseCard } from "./CourseCard";
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
  const tabBarSpace = useTabBarSpace();

  const [qaidaEntry, namazEntry] = COURSE_CATALOG;
  const qaidaLevels = useGetLevelsQuery({ courseType: qaidaEntry.courseType });
  const namazLevels = useGetLevelsQuery({ courseType: namazEntry.courseType });
  const isLoading = qaidaLevels.isLoading || namazLevels.isLoading;

  const { data: progressRes } = useGetProgressQuery();

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  // Streak popup state (origin = the chip it grows from).
  const [streakOpen, setStreakOpen] = useState(false);
  const [streakOrigin, setStreakOrigin] = useState<StreakOrigin | null>(null);

  const sections = useMemo(() => {
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

  const walk = useMemo(() => {
    let start = 0;
    return sections.map((section) => {
      const placed = { section, startIndex: start };
      start += section.data.length;
      return placed;
    });
  }, [sections]);

  const startIndexOf = useCallback(
    (key: string) => walk.find((w) => w.section.key === key)?.startIndex ?? 0,
    [walk],
  );

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
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ section?: { key?: string } }>;
    }) => {
      const topKey = viewableItems[0]?.section?.key;
      if (typeof topKey === "string") setActiveSectionKey(topKey);
    },
  ).current;

  const listRef = useRef<SectionList<LevelWithStatus, PathSection>>(null);
  const didAutoScroll = useRef(false);

  const scrollToActive = useCallback(
    (animated: boolean) => {
      const target = findActiveLocation(sections);
      if (!target) return;
      try {
        listRef.current?.scrollToLocation({
          sectionIndex: target.sectionIndex,
          itemIndex: target.itemIndex,
          viewPosition: 0.4,
          animated,
        });
      } catch {}
    },
    [sections],
  );

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
    const handle = setTimeout(() => scrollToActive(true), 300);
    return () => clearTimeout(handle);
  }, [sections, scrollToActive]);

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

  const lastSectionKey = sections[sections.length - 1]?.key;

  const renderItem: SectionListRenderItem<LevelWithStatus, PathSection> =
    useCallback(
      ({ item, index, section }) => {
        const isSectionEnd = index === section.data.length - 1;
        return (
          <LevelNode
            level={item}
            offsetIndex={startIndexOf(section.key) + index}
            appearIndex={Math.min(index, APPEAR_STAGGER_CAP)}
            isSelected={selectedLevelId === item.id}
            isLast={isSectionEnd && section.key === lastSectionKey}
            isSectionEnd={isSectionEnd}
            onPress={() => handleNodePress(item)}
            onStart={() => handleStart(item)}
            colors={section.colors}
          />
        );
      },
      [
        selectedLevelId,
        handleNodePress,
        handleStart,
        lastSectionKey,
        startIndexOf,
      ],
    );

  const keyExtractor = useCallback(
    (item: LevelWithStatus) => String(item.id),
    [],
  );

  const activeSection =
    sections.find((section) => section.key === activeSectionKey) ?? sections[0];
  const course = courseEntry(
    activeSection?.courseType ?? qaidaEntry.courseType,
  );

  if (isLoading) return <Loader fullScreen />;

  return (
    <View style={s.container}>
      <PathBackdrop bottomInset={tabBarSpace} />

      <PathHeader streak={streak} onStreakPress={handleStreakPress} />

      <CourseCard
        title={course.title}
        section={activeSection}
        xp={xp}
        onPress={() => scrollToActive(true)}
      />

      <SectionList
        ref={listRef}
        sections={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        stickySectionHeadersEnabled={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: tabBarSpace + 20 }]}
        ListFooterComponent={PathFooter}
        ListEmptyComponent={ListEmpty}
        removeClippedSubviews={false}
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
      <Sparkles size={16} color={PATH_CYAN} />
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
    backgroundColor: PATH_NIGHT,
  },
  content: {
    // Room at the top for the START flag above the first node. The bottom is
    // set from the tab bar's own height, since the bar floats over the path.
    paddingTop: 42,
  },
  footer: {
    alignItems: "center",
    gap: 8,
    paddingTop: 28,
    paddingBottom: 12,
  },
  footerText: {
    color: "#8FA8AE",
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
