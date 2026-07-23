import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { dq } from "../../theme/designTokens";
import { haptics } from "../../utils/haptics";

/** The on/off switch used by the reminder cards on the Prayer screens. */
export function Toggle({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      hitSlop={8}
      disabled={disabled}
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
      style={[
        s.toggle,
        value ? s.toggleOn : s.toggleOff,
        disabled && { opacity: 0.4 },
      ]}
    >
      <View style={[s.knob, value ? s.knobOn : s.knobOff]} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  toggle: { width: 46, height: 27, borderRadius: 14, justifyContent: "center" },
  toggleOn: { backgroundColor: dq.green },
  toggleOff: { backgroundColor: "#2C464C" },
  knob: { width: 21, height: 21, borderRadius: 11, backgroundColor: dq.text },
  knobOn: { alignSelf: "flex-end", marginRight: 3 },
  knobOff: { alignSelf: "flex-start", marginLeft: 3 },
});
