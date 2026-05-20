import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, Sparkles } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { haptics } from "../../../utils/haptics";
import { theme } from "../../../theme/themes";
import type { AppStackParamList } from "../../../navigators/navigationTypes";
import { s } from "./styles";

export const PhaseHeader = memo(function PhaseHeader({
  title,
  subtitle,
  totalLevels,
}: {
  title: string;
  subtitle: string;
  totalLevels: number;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={s.phaseHeader}>
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => {
          haptics.light();
          navigation.goBack();
        }}
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color={theme.colors.primary} />
        <Text style={s.backBtnText}>Courses</Text>
      </TouchableOpacity>
      <View style={s.phaseRow}>
        <Sparkles size={18} color={theme.colors.primary} />
        <Text style={s.phaseTitle}>{title}</Text>
      </View>
      <Text style={s.phaseSubtitle}>{totalLevels} levels · {subtitle}</Text>
    </View>
  );
});
