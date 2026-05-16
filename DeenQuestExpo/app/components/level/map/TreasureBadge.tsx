import React, { memo } from "react";
import { View } from "react-native";
import { Gift } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { s } from "./styles";

export const TreasureBadge = memo(function TreasureBadge({
  courseLevel,
}: {
  courseLevel: number;
}) {
  if (courseLevel % 5 !== 0) return null;
  return (
    <View style={s.treasureBadge}>
      <Gift size={12} color={theme.colors.secondary} />
    </View>
  );
});
