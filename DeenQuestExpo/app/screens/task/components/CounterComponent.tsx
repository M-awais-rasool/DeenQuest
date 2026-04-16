import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Vibration } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const CounterComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const target = (task.data?.target as number) ?? 33;
  const text = (task.data?.text as string) ?? "";
  const [count, setCount] = useState(task.completed ? target : 0);
  const hasAutoCompleted = useRef(false);
  const vibQueue = useRef(0);
  const vibratingRef = useRef(false);

  const reached = count >= target;
  const isDisabled = task.completed || loading;

  useEffect(() => {
    if (reached && !task.completed && !hasAutoCompleted.current) {
      hasAutoCompleted.current = true;
      onComplete();
    }
  }, [reached, task.completed, onComplete]);

  const drainVibQueue = () => {
    if (vibQueue.current <= 0) {
      vibratingRef.current = false;
      return;
    }
    vibQueue.current -= 1;
    Vibration.vibrate(20);
    setTimeout(drainVibQueue, 55);
  };

  const handleTap = () => {
    if (isDisabled || reached) return;
    setCount((c) => Math.min(c + 1, target));
    vibQueue.current += 1;
    if (!vibratingRef.current) {
      vibratingRef.current = true;
      drainVibQueue();
    }
  };

  return (
    <View style={shared.container}>
      <Text style={shared.counterPhrase}>{text}</Text>
      <Text style={[shared.counterCount, reached && shared.counterCountDone]}>
        {count} / {target}
      </Text>
      <View style={shared.counterProgress}>
        <View
          style={[
            shared.counterBar,
            { width: `${Math.min((count / target) * 100, 100)}%` },
            reached && shared.counterBarDone,
          ]}
        />
      </View>
      <TouchableOpacity
        style={[
          shared.counterTapBtn,
          (reached || isDisabled) && shared.counterTapBtnDone,
        ]}
        onPress={handleTap}
        disabled={isDisabled || reached}
        activeOpacity={0.6}
      >
        <Text
          style={[
            shared.counterTapText,
            (reached || isDisabled) && shared.counterTapTextDone,
          ]}
        >
          {reached || task.completed ? "✓" : "Tap"}
        </Text>
      </TouchableOpacity>
      {reached && (
        <CompleteButton
          onPress={onComplete}
          loading={loading}
          disabled={task.completed || !reached}
        />
      )}
    </View>
  );
};
