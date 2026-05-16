import React from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { LevelMapContent } from "../../components/level/map";

type Route = RouteProp<AppStackParamList, "LevelMap">;

export function LevelMapScreen() {
  const route = useRoute<Route>();
  const courseType = route.params?.courseType ?? "qaida";
  const courseTitle = route.params?.courseTitle ?? "Noorani Qaida";
  const courseSubtitle =
    route.params?.courseSubtitle ?? "Arabic alphabet to reading Quran";

  return (
    <ScreenWrapper>
      <LevelMapContent
        courseType={courseType}
        courseTitle={courseTitle}
        courseSubtitle={courseSubtitle}
      />
    </ScreenWrapper>
  );
}
