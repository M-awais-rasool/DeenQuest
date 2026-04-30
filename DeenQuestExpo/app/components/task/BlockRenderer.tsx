import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import type { DailyTask, BlockType } from "../../store/services/api";
import { CompleteButton } from "./CompleteButton";
import type { BlockComponentProps } from "./blocks/types";
import { TextBlock } from "./blocks/TextBlock";
import { AyahBlock } from "./blocks/AyahBlock";
import { HadithBlock } from "./blocks/HadithBlock";
import { CounterBlock } from "./blocks/CounterBlock";
import { QuizBlock } from "./blocks/QuizBlock";
import { AudioBlock } from "./blocks/AudioBlock";
import { ChecklistBlock } from "./blocks/ChecklistBlock";

const BLOCK_MAP: Partial<Record<BlockType, React.FC<BlockComponentProps>>> = {
  TextBlock,
  AyahBlock,
  HadithBlock,
  CounterBlock,
  QuizBlock,
  AudioBlock,
  ChecklistBlock,
};

interface Props {
  task: DailyTask;
  onComplete: () => void;
  loading: boolean;
}

export const BlockRenderer = ({ task, onComplete, loading }: Props) => {
  const [readyToComplete, setReadyToComplete] = useState(
    task.completed || task.completion_type === "button",
  );
  const hasAutoCompleted = useRef(false);

  const handleAutoComplete = useCallback(() => {
    setReadyToComplete(true);
    if (!task.completed && !hasAutoCompleted.current) {
      hasAutoCompleted.current = true;
      onComplete();
    }
  }, [task.completed, onComplete]);

  const handleReady = useCallback((ready: boolean) => {
    setReadyToComplete(ready);
  }, []);

  const showButton = readyToComplete;

  const blocks = task.blocks ?? [];

  return (
    <View style={s.container}>
      {blocks.map((block, i) => {
        const BlockComponent = BLOCK_MAP[block.type];
        if (!BlockComponent) return null;
        return (
          <BlockComponent
            key={`${block.type}-${i}`}
            content={block.content}
            completed={task.completed}
            loading={loading}
            onAutoComplete={handleAutoComplete}
            onReady={handleReady}
          />
        );
      })}
      {showButton && (
        <CompleteButton
          onPress={onComplete}
          loading={loading}
          disabled={task.completed}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginTop: 8 },
});
