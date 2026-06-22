import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Sunrise, Sun, Sunset, Moon, MoonStar, Clock, BookOpen } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { AnimatedPressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { LearningHeader } from "../../components/learning/parts";
import { useGetStudyPlanQuery } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

// Preset cities (approx tz) so the screen needs no location permission.
const CITIES = [
  { name: "Makkah", lat: 21.4225, lng: 39.8262, tz: 3 },
  { name: "Madinah", lat: 24.4709, lng: 39.6112, tz: 3 },
  { name: "Karachi", lat: 24.8607, lng: 67.0011, tz: 5 },
  { name: "Lahore", lat: 31.5204, lng: 74.3587, tz: 5 },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784, tz: 3 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357, tz: 3 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, tz: 4 },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456, tz: 7 },
  { name: "London", lat: 51.5072, lng: -0.1276, tz: 1 },
  { name: "New York", lat: 40.7128, lng: -74.006, tz: -4 },
];

const ROWS = [
  { key: "fajr", label: "Fajr", icon: Sunrise },
  { key: "sunrise", label: "Sunrise", icon: Sun },
  { key: "dhuhr", label: "Dhuhr", icon: Sun },
  { key: "asr", label: "Asr", icon: Sunset },
  { key: "maghrib", label: "Maghrib", icon: Sunset },
  { key: "isha", label: "Isha", icon: MoonStar },
] as const;

export function StudyPlanScreen() {
  const navigation = useNavigation<Nav>();
  const [city, setCity] = useState(CITIES[0]);
  const { data, isFetching } = useGetStudyPlanQuery({ lat: city.lat, lng: city.lng, tz: city.tz });
  const plan = data?.data;

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader
        title="Study Plan"
        subtitle="Learn around your prayers"
        onBack={() => navigation.goBack()}
        accent={theme.colors.lavender}
      />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.label}>Choose your city</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityRow}>
          {CITIES.map((c) => {
            const active = c.name === city.name;
            return (
              <AnimatedPressable
                key={c.name}
                style={[s.cityChip, active && s.cityChipActive]}
                onPress={() => setCity(c)}
              >
                <Text style={[s.cityText, active && s.cityTextActive]}>{c.name}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {isFetching || !plan ? (
          <Loader />
        ) : (
          <>
            {plan.suggested_slot ? (
              <View style={s.suggestCard}>
                <View style={s.suggestIcon}>
                  <BookOpen size={20} color={theme.colors.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestSlot}>
                    {plan.suggested_slot} · {plan.suggested_time}
                  </Text>
                  <Text style={s.suggestTip}>{plan.tip}</Text>
                </View>
              </View>
            ) : null}

            <View style={s.timesCard}>
              {ROWS.map((row, i) => {
                const Icon = row.icon;
                const highlight = plan.suggested_slot.toLowerCase().includes(row.label.toLowerCase());
                return (
                  <View key={row.key} style={[s.timeRow, i < ROWS.length - 1 && s.timeRowBorder]}>
                    <Icon size={18} color={highlight ? theme.colors.secondary : theme.colors.textMuted} />
                    <Text style={[s.timeLabel, highlight && { color: theme.colors.secondary }]}>{row.label}</Text>
                    <Text style={[s.timeValue, highlight && { color: theme.colors.secondary }]}>
                      {(plan.prayer_times as any)[row.key]}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={s.noteRow}>
              <Clock size={12} color={theme.colors.textMuted} />
              <Text style={s.note}>Times are approximate (Muslim World League method).</Text>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 40 },
  label: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, marginBottom: 10 },
  cityRow: { gap: 8, paddingRight: 16, paddingBottom: 4 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceLow,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  cityChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  cityText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  cityTextActive: { color: theme.colors.onPrimary },
  suggestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.primary12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
    marginTop: 18,
  },
  suggestIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestSlot: { color: theme.colors.text, fontSize: 15, fontWeight: "900" },
  suggestTip: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  timesCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    marginTop: 14,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  timeRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.outline25 },
  timeLabel: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  timeValue: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 4 },
  note: { color: theme.colors.textMuted, fontSize: 11 },
});
