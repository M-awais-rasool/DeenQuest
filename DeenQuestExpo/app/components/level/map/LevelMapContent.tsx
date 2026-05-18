import React, { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useGetLevelsQuery,
  useGetProgressQuery,
} from "../../../store/services/api";
import type {
  CourseType,
  LevelWithStatus,
} from "../../../store/services/api";
import type { AppStackParamList } from "../../../navigators/navigationTypes";
import { Loader } from "../../Loader";
import { LevelNode } from "./LevelNode";
import { PhaseHeader } from "./PhaseHeader";
import { ProgressSummary } from "./ProgressSummary";
import { s } from "./styles";

export function LevelMapContent({
  courseType = "qaida",
  courseTitle = "Noorani Qaida",
  courseSubtitle = "Arabic alphabet to reading Quran",
}: {
  courseType?: CourseType;
  courseTitle?: string;
  courseSubtitle?: string;
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: levelsRes, isLoading: levelsLoading } = useGetLevelsQuery({
    courseType,
  });
  const { data: progressRes } = useGetProgressQuery();

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const levels: LevelWithStatus[] = useMemo(
    () => levelsRes?.data ?? [],
    [levelsRes],
  );
  const xp = progressRes?.data?.xp ?? 0;

  const handleNodePress = useCallback(
    (level: LevelWithStatus) => {
      if (level.status === "locked") return;
      setSelectedLevelId((prev) => (prev === level.id ? null : level.id));
    },
    [],
  );

  const handleStart = useCallback(
    (level: LevelWithStatus) => {
      setSelectedLevelId(null);
      navigation.navigate("LevelDetail", { levelId: level.id, courseType });
    },
    [courseType, navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: LevelWithStatus; index: number }) => {
      const isSelected = selectedLevelId === item.id;
      return (
        <LevelNode
          level={item}
          index={index}
          isSelected={isSelected}
          onPress={() => handleNodePress(item)}
          onStart={() => handleStart(item)}
        />
      );
    },
    [selectedLevelId, handleNodePress, handleStart],
  );

  const keyExtractor = useCallback(
    (item: LevelWithStatus) => String(item.id),
    [],
  );

  const ListHeader = useMemo(
    () => (
      <>
        <PhaseHeader
          title={courseTitle}
          subtitle={courseSubtitle}
          totalLevels={levels.length}
        />
        <ProgressSummary levels={levels} xp={xp} />
      </>
    ),
    [courseTitle, courseSubtitle, levels, xp],
  );

  if (levelsLoading) return <Loader fullScreen />;

  return (
    <FlatList
      data={levels}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
    />
  );
}
