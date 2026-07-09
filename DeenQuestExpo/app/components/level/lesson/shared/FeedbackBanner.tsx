import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import { TactilePressable } from "../../../ui";
import { CelebrationOverlay } from "./CelebrationOverlay";

export type FeedbackStatus = "correct" | "wrong" | null;
type ButtonVariant = "primary" | "success" | "error" | "neutral";

/**
 * Standardized action button used across every lesson task
 * (replaces the duplicated `continueBtn` styles). Defaults to a green
 * primary "CONTINUE", but is reused for "CHECK" and error states too.
 */
export function ContinueButton({
  label = "CONTINUE",
  onPress,
  disabled = false,
  variant = "primary",
  showChevron = true,
  haptic = "medium",
  style,
}: {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  showChevron?: boolean;
  /** Set "none" when onPress immediately fires its own result haptic. */
  haptic?: "none" | "light" | "medium";
  style?: any;
}) {
  const palette = BUTTON_PALETTE[variant];
  return (
    <TactilePressable
      edgeColor={palette.border}
      radius={16}
      haptic={haptic}
      disabled={disabled}
      onPress={onPress}
      style={style}
      faceStyle={[s.btn, { backgroundColor: palette.bg }]}
    >
      <Text style={[s.btnText, { color: palette.fg }]}>{label}</Text>
      {showChevron && <ChevronRight size={18} color={palette.fg} />}
    </TactilePressable>
  );
}

/**
 * Duolingo-style result banner. Renders nothing until `status` is set, then
 * slides + fades up with a coloured panel, message, and the continue button.
 */
export function FeedbackBanner({
  status,
  correctText = "MashaAllah! Correct 🎉",
  wrongText = "Not quite — try to remember this one.",
  continueLabel = "CONTINUE",
  onContinue,
}: {
  status: FeedbackStatus;
  correctText?: string;
  wrongText?: string;
  continueLabel?: string;
  onContinue: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!status) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Reward moment: a star burst over the banner on every correct answer.
    if (status === "correct") setBurst((b) => b + 1);
  }, [status, progress]);

  if (!status) return null;

  const isCorrect = status === "correct";
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Animated.View
      style={[
        s.banner,
        isCorrect ? s.bannerCorrect : s.bannerWrong,
        { opacity: progress, transform: [{ translateY }] },
      ]}
    >
      <View style={s.bannerHeader}>
        {isCorrect ? (
          <CheckCircle2 size={22} color={theme.colors.primary} />
        ) : (
          <XCircle size={22} color={theme.colors.error} />
        )}
        <Text
          style={[
            s.bannerTitle,
            { color: isCorrect ? theme.colors.primary : theme.colors.error },
          ]}
        >
          {isCorrect ? "Correct!" : "Not quite"}
        </Text>
      </View>
      <Text style={s.bannerMsg}>{isCorrect ? correctText : wrongText}</Text>
      <ContinueButton
        label={continueLabel}
        variant={isCorrect ? "success" : "error"}
        onPress={onContinue}
        style={s.bannerBtn}
      />
      <CelebrationOverlay trigger={isCorrect ? burst : 0} />
    </Animated.View>
  );
}

const BUTTON_PALETTE: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string }
> = {
  primary: {
    bg: theme.colors.primary,
    fg: theme.colors.onPrimary,
    border: theme.colors.primaryContainer,
  },
  success: {
    bg: theme.colors.primary,
    fg: theme.colors.onPrimary,
    border: theme.colors.primaryContainer,
  },
  error: {
    bg: theme.colors.errorAccent,
    fg: theme.colors.white,
    border: theme.colors.errorStrong,
  },
  neutral: {
    bg: theme.colors.surfaceHigh,
    fg: theme.colors.text,
    border: theme.colors.outline,
  },
};

const s = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  btnText: {
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
  banner: {
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1.5,
  },
  bannerCorrect: {
    backgroundColor: theme.colors.primary10,
    borderColor: theme.colors.primary30,
  },
  bannerWrong: {
    backgroundColor: theme.colors.errorSoft10,
    borderColor: theme.colors.error,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  bannerMsg: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  bannerBtn: {
    marginTop: 2,
  },
});

export default FeedbackBanner;
