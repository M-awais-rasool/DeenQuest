import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CheckSquare, ChevronLeft, Flame, Sparkles } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { dq } from "../../theme/designTokens";
import { haptics } from "../../utils/haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "ParentDashboard">;

// Mock children data (H4 mock) — family accounts come later.
interface Child {
  initial: string;
  colors: [string, string];
  initialColor: string;
  name: string;
  statusLine: string;
  statusColor: string;
  streak: number;
  minutesToday: string;
  lessons: number;
  accuracy: string;
  coachTip?: string;
  needsNudge?: boolean;
}

const CHILDREN: Child[] = [
  {
    initial: "H",
    colors: ["#F79A59", "#F27FB2"],
    initialColor: "#3A1024",
    name: "Hamza · 8y",
    statusLine: "Level 7 · Qaida · on track",
    statusColor: dq.green,
    streak: 6,
    minutesToday: "22m",
    lessons: 4,
    accuracy: "91%",
    coachTip: "Coach: Hamza mastered 3 new letters this week — praise him!",
  },
  {
    initial: "S",
    colors: ["#6EC1E8", "#A78BFA"],
    initialColor: "#0E2A3A",
    name: "Safa · 11y",
    statusLine: "Level 12 · 2 days inactive",
    statusColor: theme.colors.error,
    streak: 0,
    minutesToday: "0m",
    lessons: 0,
    accuracy: "88%",
    needsNudge: true,
  },
];

function StatTile({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={s.statTile}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function ParentDashboardScreen({ navigation }: Props) {
  const [weeklyReport, setWeeklyReport] = useState(true);

  const sendNudge = (name: string) => {
    haptics.success();
    Alert.alert(
      "Nudge sent 💌",
      `${name.split(" ")[0]} will get a gentle reminder to continue their journey.`,
    );
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* header */}
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Family</Text>
          <Text style={s.headerSub}>Parent view · {CHILDREN.length} children</Text>
        </View>
        <View style={s.modeChip}>
          <Text style={s.modeChipText}>PARENT MODE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {CHILDREN.map((child) => {
          const inactive = child.streak === 0;
          return (
            <View key={child.name} style={s.childCard}>
              <View style={s.childTop}>
                <LinearGradient
                  colors={child.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.childAvatar}
                >
                  <Text style={[s.childInitial, { color: child.initialColor }]}>
                    {child.initial}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.childName}>{child.name}</Text>
                  <Text style={[s.childStatus, { color: child.statusColor }]}>
                    {child.statusLine}
                  </Text>
                </View>
                <View
                  style={[
                    s.streakPill,
                    { backgroundColor: inactive ? "#1E3238" : dq.goldTint },
                  ]}
                >
                  <Flame
                    size={13}
                    color={inactive ? dq.faint : dq.gold}
                    fill={inactive ? dq.faint : dq.gold}
                  />
                  <Text
                    style={[
                      s.streakPillText,
                      { color: inactive ? dq.muted : dq.gold },
                    ]}
                  >
                    {child.streak}
                  </Text>
                </View>
              </View>

              <View style={s.statRow}>
                <StatTile
                  value={child.minutesToday}
                  label="TODAY"
                  color={inactive ? dq.faint : "#5EE0CE"}
                />
                <StatTile
                  value={child.lessons}
                  label="LESSONS"
                  color={inactive ? dq.faint : dq.gold}
                />
                <StatTile
                  value={child.accuracy}
                  label="ACCURACY"
                  color="#C4B2FF"
                />
              </View>

              {child.coachTip && (
                <View style={s.tipBox}>
                  <Sparkles size={16} color="#5EE0CE" strokeWidth={2} />
                  <Text style={s.tipText}>{child.coachTip}</Text>
                </View>
              )}

              {child.needsNudge && (
                <TactilePressable
                  faceStyle={s.nudgeBtn}
                  edgeColor="#C05A87"
                  radius={14}
                  depth={4}
                  haptic="medium"
                  style={{ marginTop: 12 }}
                  onPress={() => sendNudge(child.name)}
                >
                  <Text style={s.nudgeBtnText}>SEND A GENTLE NUDGE 💌</Text>
                </TactilePressable>
              )}
            </View>
          );
        })}

        {/* weekly report */}
        <AnimatedPressable
          style={s.reportCard}
          onPress={() => {
            haptics.light();
            setWeeklyReport((v) => !v);
          }}
        >
          <CheckSquare size={16} color={dq.muted} strokeWidth={2.2} />
          <Text style={s.reportText}>Weekly report every Friday</Text>
          <View style={[s.toggle, weeklyReport ? s.toggleOn : s.toggleOff]}>
            <View style={[s.knob, weeklyReport ? s.knobOn : s.knobOff]} />
          </View>
        </AnimatedPressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontFamily: "Nunito_900Black", color: dq.text },
  headerSub: {
    fontSize: 12.5,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
  },
  modeChip: {
    backgroundColor: dq.goldTint,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeChipText: {
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    color: dq.gold,
    letterSpacing: 0.8,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 14,
  },

  childCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 24,
    padding: 18,
  },
  childTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  childAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  childInitial: { fontSize: 21, fontFamily: "Nunito_900Black" },
  childName: { fontSize: 16, fontFamily: "Nunito_900Black", color: dq.text },
  childStatus: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    marginTop: 1,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakPillText: { fontSize: 12, fontFamily: "Nunito_900Black" },

  statRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statTile: {
    flex: 1,
    backgroundColor: dq.lockBadge,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontFamily: "Nunito_900Black" },
  statLabel: {
    fontSize: 9.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 0.6,
    marginTop: 1,
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(44,201,181,0.06)",
    borderWidth: 1,
    borderColor: "#1E4A44",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Nunito_700Bold",
    color: "#B7D8D3",
  },

  nudgeBtn: {
    backgroundColor: "#F27FB2",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  nudgeBtnText: {
    fontSize: 12.5,
    fontFamily: "Nunito_900Black",
    color: "#3A1024",
    letterSpacing: 0.7,
  },

  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  reportText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
    color: dq.muted,
  },
  toggle: {
    width: 40,
    height: 23,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: dq.green },
  toggleOff: { backgroundColor: "#2C464C" },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: dq.text,
  },
  knobOn: { alignSelf: "flex-end", marginRight: 2.5 },
  knobOff: { alignSelf: "flex-start", marginLeft: 2.5 },
});

export default ParentDashboardScreen;
