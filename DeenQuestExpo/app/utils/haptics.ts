import * as Haptics from "expo-haptics";

/**
 * Centralized haptic feedback utilities for DeenQuest.
 * Provides semantic feedback types that map to appropriate haptic patterns.
 */

export const haptics = {
  /** Light tap — for subtle interactions like navigation, toggles, tabs */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium tap — for primary buttons, important actions */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Heavy tap — for destructive or major confirmations */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Soft tap — for gentle UI responses (iOS only, falls back on Android) */
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),

  /** Rigid tap — for crisp UI responses (iOS only, falls back on Android) */
  rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),

  /** Success notification — for completions, correct answers, achievements */
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Error notification — for failures, wrong answers, validation errors */
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Warning notification — for cautions, partial successes */
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Selection change — for pickers, segmented controls */
  selection: () => Haptics.selectionAsync(),
};

export default haptics;
