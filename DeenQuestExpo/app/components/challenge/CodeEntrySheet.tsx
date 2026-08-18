import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedPressable, TactilePressable } from "../ui";
import { dq } from "../../theme/designTokens";

interface CodeEntrySheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

export function CodeEntrySheet({
  visible,
  title,
  subtitle,
  busy = false,
  onClose,
  onSubmit,
}: CodeEntrySheetProps) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (visible) setCode("");
  }, [visible]);

  const trimmed = code.trim();

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
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>

          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            placeholder="ABC123"
            placeholderTextColor={dq.faint}
            style={s.input}
            returnKeyType="go"
            onSubmitEditing={() => trimmed && onSubmit(trimmed)}
          />

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
              disabled={busy || trimmed.length === 0}
              onPress={() => onSubmit(trimmed)}
            >
              {busy ? (
                <ActivityIndicator size="small" color={dq.onGreen} />
              ) : (
                <Text style={s.submitText}>JOIN</Text>
              )}
            </TactilePressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
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
  input: {
    backgroundColor: dq.screen,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 6,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 16,
  },
  btnRow: { flexDirection: "row", gap: 9, marginTop: 16 },
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
