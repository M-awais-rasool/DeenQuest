import React, { memo } from "react";
import { View } from "react-native";
import { Star } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { s } from "./styles";

export const StarsDisplay = memo(function StarsDisplay({
  stars,
  size = 13,
}: {
  stars: number;
  size?: number;
}) {
  return (
    <View style={s.starsRow}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= stars ? theme.colors.secondary : theme.colors.outline}
          fill={i <= stars ? theme.colors.secondary : "transparent"}
        />
      ))}
    </View>
  );
});
