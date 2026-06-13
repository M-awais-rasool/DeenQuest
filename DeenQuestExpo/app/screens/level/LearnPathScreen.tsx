import React from "react";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { LearningPathContent } from "../../components/level/path";

export function LearnPathScreen() {
  return (
    <ScreenWrapper innerStyle={s.inner}>
      <LearningPathContent courseType="qaida" courseTitle="Noorani Qaida" />
    </ScreenWrapper>
  );
}

const s = { inner: { flex: 1 } } as const;
