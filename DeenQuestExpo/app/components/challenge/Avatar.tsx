import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { dq } from "../../theme/designTokens";
import { AVATAR_FOREGROUNDS, AVATAR_GRADIENTS } from "./theme";

interface AvatarProps {
  initial: string;
  index?: number;
  size?: number;
  highlighted?: boolean;
  style?: ViewStyle;
}

/** A participant's circular initial badge. */
export function Avatar({
  initial,
  index = 0,
  size = 40,
  highlighted = false,
  style,
}: AvatarProps) {
  const colors = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const fg = AVATAR_FOREGROUNDS[index % AVATAR_FOREGROUNDS.length];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        styles.base,
        highlighted && styles.highlighted,
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4, color: fg }]}>
        {initial || "?"}
      </Text>
    </LinearGradient>
  );
}

/** Overlapping avatar stack with a "+N" chip once the roster runs long. */
export function AvatarStack({
  initials,
  max = 3,
  size = 30,
}: {
  initials: string[];
  max?: number;
  size?: number;
}) {
  const shown = initials.slice(0, max);
  const extra = initials.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((initial, i) => (
        <Avatar
          key={i}
          initial={initial}
          index={i}
          size={size}
          style={{
            borderWidth: 2,
            borderColor: dq.card,
            marginLeft: i > 0 ? -size * 0.3 : 0,
          }}
        />
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.3,
            },
          ]}
        >
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  highlighted: { borderWidth: 2.5, borderColor: dq.greenBright },
  text: { fontFamily: "Nunito_900Black" },
  stack: { flexDirection: "row", alignItems: "center" },
  extra: {
    backgroundColor: "#1E3238",
    borderWidth: 2,
    borderColor: dq.card,
    alignItems: "center",
    justifyContent: "center",
  },
  extraText: { fontSize: 10, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
});
