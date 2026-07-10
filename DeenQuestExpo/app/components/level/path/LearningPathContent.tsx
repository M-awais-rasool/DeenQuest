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
import type { CourseType, LevelWithStatus } from "../../../store/services/api";
import type { AppStackParamList } from "../../../navigators/navigationTypes";
import { theme } from "../../../theme/themes";
import { Loader } from "../../Loader";
import { LevelNode } from "../map";

import { PathTopBar } from "./PathTopBar";
import { ActiveSectionBanner } from "./ActiveSectionBanner";
import { SectionDivider } from "./SectionDivider";
import { StreakPopup, type StreakOrigin } from "./StreakPopup";
import { buildSections, findActiveLocation } from "./sections";
import type { PathSection } from "./types";

const APPEAR_STAGGER_CAP = 8;

/** A node/header must be at least this % visible to count as "at the top". */
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

interface LearningPathContentProps {
  courseType?: CourseType;
  courseTitle?: string;
}

export function LearningPathContent({
  courseType = "qaida",
  courseTitle = "Noorani Qaida",
}: LearningPathContentProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const { data: levelsRes, isLoading } = useGetLevelsQuery({ courseType });
  const { data: progressRes } = useGetProgressQuery();

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  // Which section the user is currently scrolled into — drives the pinned banner.
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  // Streak popup state (origin = the chip it grows from).
  const [streakOpen, setStreakOpen] = useState(false);
  const [streakOrigin, setStreakOrigin] = useState<StreakOrigin | null>(null);

  const levels: LevelWithStatus[] = useMemo(
    () => levelsRes?.data ?? [],
    [levelsRes],
  );

  const sections = useMemo(
    () => buildSections(levels, courseType),
    [levels, courseType],
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
    ({ viewableItems }: { viewableItems: Array<{ section?: { index?: number } }> }) => {
      const topIndex = viewableItems[0]?.section?.index;
      if (typeof topIndex === "number") setActiveSectionIndex(topIndex);
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
      navigation.navigate("LevelDetail", { levelId: level.id, courseType });
    },
    [courseType, navigation],
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

  if (isLoading) return <Loader fullScreen />;

  const activeSection = sections[activeSectionIndex] ?? sections[0];

  return (
    <View style={s.container}>
      <PathTopBar
        title={courseTitle}
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
