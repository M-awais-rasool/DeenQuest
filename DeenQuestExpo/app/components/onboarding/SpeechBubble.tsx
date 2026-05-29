import React from "react";
import { StyleSheet, Text, View, ViewStyle, TextStyle } from "react-native";
import { COLORS, FONTS } from "./constants";
import TypewriterText from "./TypewriterText";

interface Props {
  text: string;
  tailDirection: "left" | "bottom";
  bubbleStyle?: ViewStyle;
  textStyle?: TextStyle;
  typewriter?: boolean;
  typewriterSpeed?: number;
  typewriterDelay?: number;
  typewriterOnComplete?: () => void;
}

export default function SpeechBubble({
  text,
  tailDirection,
  bubbleStyle,
  textStyle,
  typewriter = false,
  typewriterSpeed = 35,
  typewriterDelay = 0,
  typewriterOnComplete,
}: Props) {
  const isLeft = tailDirection === "left";

  return (
    <View style={[styles.bubble, bubbleStyle]}>
      {typewriter ? (
        <TypewriterText
          text={text}
          speed={typewriterSpeed}
          delay={typewriterDelay}
          style={textStyle}
          onComplete={typewriterOnComplete}
          showCursor={false}
        />
      ) : (
        <Text style={[styles.text, textStyle]}>{text}</Text>
      )}
      {isLeft ? (
        <View style={styles.tailLeft}>
          <View style={styles.tailLeftBorder} />
          <View style={styles.tailLeftFill} />
        </View>
      ) : (
        <View style={styles.tailBottom}>
          <View style={styles.tailBottomBorder} />
          <View style={styles.tailBottomFill} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    paddingVertical: 18,
    paddingHorizontal: 24,
    position: "relative",
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: "600",
  },
  // ─── Left-pointing tail ───
  tailLeft: {
    position: "absolute",
    left: -14,
    top: 20,
    width: 14,
    height: 20,
  },
  tailLeftBorder: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 14,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: COLORS.outline,
  },
  tailLeftFill: {
    position: "absolute",
    top: 1,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 13,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: COLORS.surface,
  },
  // ─── Bottom-pointing tail ───
  tailBottom: {
    position: "absolute",
    bottom: -14,
    left: 0,
    right: 0,
    height: 14,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tailBottomBorder: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.outline,
  },
  tailBottomFill: {
    position: "absolute",
    top: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.surface,
  },
});
