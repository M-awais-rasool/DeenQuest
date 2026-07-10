import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { COLORS, FONTS } from "./constants";

interface Props {
  text: string;
  speed?: number;
  delay?: number;
  style?: TextStyle;
  onComplete?: () => void;
  showCursor?: boolean;
}

export default function TypewriterText({
  text,
  speed = 35,
  delay = 0,
  style,
  onComplete,
  showCursor = true,
}: Props) {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);

  // Keep the latest onComplete callback in a ref so we don't
  // restart typing when the parent re-renders with a new function reference.
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset state when text/speed/delay changes
    setDisplayed("");
    setIsDone(false);
    indexRef.current = 0;

    // Clear any existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const startTyping = () => {
      const typeNext = () => {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayed(text.slice(0, indexRef.current));

          const nextTimer = setTimeout(typeNext, speed);
          timersRef.current.push(nextTimer);
        } else {
          setIsDone(true);
          onCompleteRef.current?.();
        }
      };

      typeNext();
    };

    const delayTimer = setTimeout(startTyping, delay);
    timersRef.current.push(delayTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [text, speed, delay]);

  // Blinking cursor effect
  useEffect(() => {
    if (!showCursor || isDone) {
      setCursorVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor, isDone]);

  return (
    <View style={styles.row}>
      <Text style={[styles.base, style]}>{displayed}</Text>
      {showCursor && !isDone && (
        <Text style={[styles.base, styles.cursor, style]}>
          {cursorVisible ? "|" : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  base: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    fontFamily: "Nunito_600SemiBold",
  },
  cursor: {
    color: COLORS.primary,
    fontFamily: "Nunito_400Regular",
    marginLeft: 1,
  },
});
