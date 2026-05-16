import React from "react";
import { View, Text } from "react-native";
import { s } from "./styles";

export function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.summaryItem}>
      <Text style={s.summaryValue}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}
