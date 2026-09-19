import React from "react";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { LearningPathContent } from "../../components/level/path";
import { PATH_NIGHT } from "../../components/level/map";

export function LearnPathScreen() {
  return (
    <ScreenWrapper style={s.screen} innerStyle={s.inner}>
      <LearningPathContent />
    </ScreenWrapper>
  );
}

const s = {
  screen: { backgroundColor: PATH_NIGHT },
  inner: { flex: 1 },
} as const;
