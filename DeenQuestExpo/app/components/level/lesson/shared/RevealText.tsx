import React, { useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { useRef, useEffect } from "react";

const WORD_STAGGER = 55;
const LINE_STAGGER = 130;
const WORD_DURATION = 420;

function RevealWord({
  word,
  delay,
  style,
}: {
  word: string;
  delay: number;
  style?: StyleProp<TextStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: WORD_DURATION,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.06, 1],
  });

  return (
    <Animated.Text
      style={[
        style,
        s.word,
        { opacity: progress, transform: [{ translateY }, { scale }] },
      ]}
    >
      {word}
    </Animated.Text>
  );
}

export function RevealText({
  text,
  style,
  containerStyle,
  delay = 0,
  align = "center",
  wordStagger = WORD_STAGGER,
  lineStagger = LINE_STAGGER,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  delay?: number;
  align?: "center" | "flex-start";
  wordStagger?: number;
  lineStagger?: number;
}) {
  const lines = useMemo(
    () =>
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/\s+/)),
    [text],
  );

  return (
    <View style={containerStyle}>
      {lines.map((words, lineIndex) => (
        <View key={lineIndex} style={[s.line, { justifyContent: align }]}>
          {words.map((word, wordIndex) => (
            <RevealWord
              key={`${lineIndex}-${wordIndex}`}
              word={word}
              style={style}
              delay={delay + lineIndex * lineStagger + wordIndex * wordStagger}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** How long a RevealText takes end to end — for chaining what comes after. */
export function revealDuration(
  text: string,
  { delay = 0, wordStagger = WORD_STAGGER, lineStagger = LINE_STAGGER } = {},
) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\s+/).length);
  if (lines.length === 0) return delay;
  const last = lines.length - 1;
  return (
    delay + last * lineStagger + (lines[last] - 1) * wordStagger + WORD_DURATION
  );
}

const s = StyleSheet.create({
  line: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  word: {
    marginRight: 6,
  },
});

export default RevealText;
