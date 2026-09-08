import React, { memo } from "react";
import { View } from "react-native";
import { Gift } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { s } from "./styles";

const SECTION_LENGTH = 4;

export const TreasureBadge = memo(function TreasureBadge({
  courseLevel,
}: {
  courseLevel: number;
}) {
  if (courseLevel % SECTION_LENGTH !== 0) return null;
  return (
    <View style={s.treasureBadge}>
      <Gift size={12} color={theme.colors.secondary} />
    </View>
  );
});
