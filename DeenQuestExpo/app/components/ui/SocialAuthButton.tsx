import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Apple } from "lucide-react-native";
import { TactilePressable } from "./TactilePressable";
import { theme } from "../../theme/themes";

export type SocialProvider = "google" | "apple";

const PALETTE: Record<
  SocialProvider,
  { bg: string; fg: string; edge: string; border?: string }
> = {
  google: {
    bg: "#FFFFFF",
    fg: "#1F1F1F",
    edge: "#C2C2C2",
  },
  apple: {
    bg: "#0B0B0B",
    fg: "#FFFFFF",
    edge: "#2E2E2E",
    border: "rgba(255,255,255,0.22)",
  },
};

const LABEL: Record<SocialProvider, string> = {
  google: "Continue with Google",
  apple: "Continue with Apple",
};

export function SocialAuthButton({
  provider,
  onPress,
  disabled = false,
}: {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
}) {
  const palette = PALETTE[provider];

  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled}
      edgeColor={palette.edge}
      radius={theme.borderRadius.md}
      haptic="medium"
      faceStyle={[
        s.face,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border ?? palette.bg,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={LABEL[provider]}
    >
      <View style={s.iconSlot}>
        {provider === "google" ? (
          <Image
            source={require("../../../assets/icons/google.png")}
            style={s.googleIcon}
            resizeMode="contain"
          />
        ) : (
          <Apple size={22} color={palette.fg} fill={palette.fg} />
        )}
      </View>
      <Text style={[s.label, { color: palette.fg }]}>{LABEL[provider]}</Text>
      {/* Mirror of the icon slot keeps the label optically centred */}
      <View style={s.iconSlot} />
    </TactilePressable>
  );
}

const s = StyleSheet.create({
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.25,
    paddingHorizontal: 18,
  },
  iconSlot: {
    width: 26,
    alignItems: "center",
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});

export default SocialAuthButton;
