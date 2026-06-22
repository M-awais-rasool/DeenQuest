import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Send, BookOpen, Info, Sparkles } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { TactilePressable, AnimatedPressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { LearningHeader } from "../../components/learning/parts";
import { useAskKnowledgeMutation } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

const SUGGESTIONS = [
  "What does Bismillah mean?",
  "What is Tajweed?",
  "How does my streak work?",
  "How many surahs in the Qur'an?",
];

export function KnowledgeAskScreen() {
  const navigation = useNavigation<Nav>();
  const [ask, { data, isLoading }] = useAskKnowledgeMutation();
  const [q, setQ] = useState("");
  const answer = data?.data;

  const submit = (text?: string) => {
    const question = (text ?? q).trim();
    if (!question) return;
    setQ(question);
    Keyboard.dismiss();
    ask({ question });
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader
        title="Ask a Question"
        subtitle="Answers from a trusted, curated list"
        onBack={() => navigation.goBack()}
        accent={theme.colors.cyan}
      />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Type your question…"
            placeholderTextColor={theme.colors.textMuted}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => submit()}
            returnKeyType="search"
          />
          <TactilePressable
            edgeColor={theme.colors.primaryContainer}
            radius={12}
            depth={3}
            haptic="light"
            faceStyle={s.sendBtn}
            disabled={!q.trim() || isLoading}
            onPress={() => submit()}
          >
            <Send size={18} color={theme.colors.onPrimary} />
          </TactilePressable>
        </View>

        {!answer && !isLoading && (
          <View style={s.suggestWrap}>
            <Text style={s.suggestLabel}>Try asking</Text>
            {SUGGESTIONS.map((sug) => (
              <AnimatedPressable key={sug} style={s.suggestChip} onPress={() => submit(sug)}>
                <Sparkles size={13} color={theme.colors.secondary} />
                <Text style={s.suggestText}>{sug}</Text>
              </AnimatedPressable>
            ))}
          </View>
        )}

        {isLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 28 }} />}

        {answer && !isLoading && (
          <View
            style={[
              s.answerCard,
              answer.referral && s.answerReferral,
            ]}
          >
            <Text style={s.answerText}>{answer.text}</Text>
            {answer.source ? (
              <View style={s.sourceRow}>
                <BookOpen size={13} color={theme.colors.textMuted} />
                <Text style={s.sourceText}>{answer.source}</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={s.disclaimer}>
          <Info size={13} color={theme.colors.textMuted} />
          <Text style={s.disclaimerText}>
            For religious rulings, always consult a qualified scholar.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 40 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLow,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestWrap: { marginTop: 22, gap: 10 },
  suggestLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  suggestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surfaceLow,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestText: { color: theme.colors.text, fontSize: 14, flex: 1 },
  answerCard: {
    marginTop: 22,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
  },
  answerReferral: { borderColor: theme.colors.secondary25, backgroundColor: theme.colors.secondary12 },
  answerText: { color: theme.colors.text, fontSize: 15, lineHeight: 23 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  sourceText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 22,
    paddingHorizontal: 4,
  },
  disclaimerText: { color: theme.colors.textMuted, fontSize: 12, flex: 1, lineHeight: 16 },
});
