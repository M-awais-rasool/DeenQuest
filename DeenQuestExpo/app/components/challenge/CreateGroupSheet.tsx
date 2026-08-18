import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedPressable, TactilePressable } from "../ui";
import { dq } from "../../theme/designTokens";
import type {
  ChallengeMetric,
  CreateGroupChallengeRequest,
} from "../../store/services/api";

interface CreateGroupSheetProps {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (req: CreateGroupChallengeRequest) => void;
}

const GOALS: {
  metric: ChallengeMetric;
  label: string;
  hint: string;
  presets: number[];
}[] = [
  { metric: "xp", label: "XP together", hint: "XP", presets: [1000, 2500, 5000] },
  { metric: "lessons", label: "Lessons", hint: "lessons", presets: [20, 50, 100] },
  { metric: "tasks", label: "Daily missions", hint: "missions", presets: [30, 60, 120] },
  { metric: "hifz", label: "Hifz portions", hint: "portions", presets: [10, 25, 50] },
];

const DURATIONS = [7, 14, 30];

export function CreateGroupSheet({
  visible,
  busy = false,
  onClose,
  onSubmit,
}: CreateGroupSheetProps) {
  const [name, setName] = useState("");
  const [goalIndex, setGoalIndex] = useState(0);
  const [target, setTarget] = useState(GOALS[0].presets[0]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setGoalIndex(0);
    setTarget(GOALS[0].presets[0]);
    setDays(30);
  }, [visible]);

  const goal = GOALS[goalIndex];
  const trimmedName = name.trim();

  const pickGoal = (index: number) => {
    setGoalIndex(index);
    setTarget(GOALS[index].presets[0]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.wrap}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.grabber} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.title}>New group challenge</Text>
            <Text style={s.subtitle}>
              Pick a shared goal. Everyone who joins with your code pushes the
              same bar forward.
            </Text>

            <Text style={s.label}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={60}
              placeholder="Family Khatm Challenge"
              placeholderTextColor={dq.faint}
              style={s.input}
            />

            <Text style={s.label}>GOAL</Text>
            <View style={s.chipRow}>
              {GOALS.map((g, i) => (
                <AnimatedPressable
                  key={g.metric}
                  style={[s.chip, i === goalIndex && s.chipActive]}
                  onPress={() => pickGoal(i)}
                >
                  <Text
                    style={[s.chipText, i === goalIndex && s.chipTextActive]}
                  >
                    {g.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={s.label}>TARGET</Text>
            <View style={s.chipRow}>
              {goal.presets.map((preset) => (
                <AnimatedPressable
                  key={preset}
                  style={[s.chip, preset === target && s.chipActive]}
                  onPress={() => setTarget(preset)}
                >
                  <Text
                    style={[s.chipText, preset === target && s.chipTextActive]}
                  >
                    {preset} {goal.hint}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={s.label}>DURATION</Text>
            <View style={s.chipRow}>
              {DURATIONS.map((d) => (
                <AnimatedPressable
                  key={d}
                  style={[s.chip, d === days && s.chipActive]}
                  onPress={() => setDays(d)}
                >
                  <Text style={[s.chipText, d === days && s.chipTextActive]}>
                    {d} days
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <View style={s.btnRow}>
              <AnimatedPressable style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelText}>CANCEL</Text>
              </AnimatedPressable>
              <TactilePressable
                style={{ flex: 1 }}
                faceStyle={s.submitBtn}
                edgeColor={dq.greenDark}
                radius={14}
                depth={4}
                haptic="medium"
                disabled={busy || trimmedName.length === 0}
                onPress={() =>
                  onSubmit({
                    name: trimmedName,
                    metric: goal.metric,
                    target,
                    days,
                  })
                }
              >
                {busy ? (
                  <ActivityIndicator size="small" color={dq.onGreen} />
                ) : (
                  <Text style={s.submitText}>CREATE</Text>
                )}
              </TactilePressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: dq.card,
    borderTopWidth: 1,
    borderColor: dq.cardBorder,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 34,
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: dq.cardBorder,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontFamily: "Nunito_900Black", color: dq.text },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 4,
  },
  label: {
    fontSize: 10.5,
    fontFamily: "Nunito_900Black",
    color: dq.faint,
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: dq.screen,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 14.5,
    fontFamily: "Nunito_700Bold",
    color: dq.text,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: dq.screen,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: dq.greenTint, borderColor: dq.green },
  chipText: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  chipTextActive: { color: dq.greenBright },
  btnRow: { flexDirection: "row", gap: 9, marginTop: 22 },
  cancelBtn: {
    backgroundColor: dq.screen,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 12.5, fontFamily: "Nunito_900Black", color: dq.muted },
  submitBtn: {
    backgroundColor: dq.green,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: {
    fontSize: 12.5,
    fontFamily: "Nunito_900Black",
    color: dq.onGreen,
    letterSpacing: 0.7,
  },
});
