import React, { useMemo } from "react";
import type { LessonComponentProps } from "../types";
import { INTERACTION_REGISTRY, type ResolvedLesson } from "./registry";
import { ENGINE_VERSION, isInteraction, parseLessonDSL } from "./types";
import { UpdateAppCard } from "./UpdateAppCard";

type LessonComponent = React.ComponentType<LessonComponentProps>;

let engineTargets: Record<string, LessonComponent> = {};

export function setEngineTargets(targets: Record<string, LessonComponent>) {
  engineTargets = targets;
}

export function LessonEngine(props: LessonComponentProps) {
  const { lesson, onComplete } = props;

  const resolved: ResolvedLesson | null = useMemo(() => {
    const dsl = parseLessonDSL(lesson.data);
    if (!dsl) return null;
    if ((dsl.min_engine_version ?? 1) > ENGINE_VERSION) return null;
    if (!isInteraction(dsl.interaction)) return null;
    try {
      return INTERACTION_REGISTRY[dsl.interaction](dsl);
    } catch {
      return null;
    }
  }, [lesson.data]);

  const Target = resolved ? engineTargets[resolved.component] : null;

  if (!resolved || !Target || Target === LessonEngine) {
    return <UpdateAppCard onComplete={onComplete} />;
  }

  return (
    <Target
      {...props}
      lesson={{ ...lesson, component: resolved.component, data: resolved.data }}
    />
  );
}

export default LessonEngine;
