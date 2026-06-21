import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Heart, Sparkles, Send } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { TactilePressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { useQuranFont } from "../../hooks/useQuranFont";
import { LearningHeader, EmptyState } from "../../components/learning/parts";
import {
  useCreateReflectionMutation,
  useGetReflectionsQuery,
  type Reflection,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function ReflectionScreen() {
  const navigation = useNavigation<Nav>();
  const { fontFamily } = useQuranFont();
  const [text, setText] = useState("");
  const [latest, setLatest] = useState<Reflection | null>(null);
  const [create, { isLoading: submitting }] = useCreateReflectionMutation();
  const { data, isLoading } = useGetReflectionsQuery();
  const history = (data?.data ?? []).filter((r) => r.id !== latest?.id);

  const submit = async () => {
    const t = text.trim();
    if (!t || submitting) return;
    try {
      const res = await create({ text: t }).unwrap();
      if (res.data) setLatest(res.data);
      setText("");
    } catch {
      // best-effort; keep the text so the user can retry
    }
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1, paddingHorizontal: 20 }}>
      <LearningHeader
        title="Reflection"
        subtitle="A quiet moment with your companion"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Composer */}
        <View style={s.composer}>
          <Text style={s.prompt}>How was your day, and your heart?</Text>
          <TextInput
            style={s.input}
            placeholder="Write a few words…"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            value={text}
            onChangeText={setText}
            maxLength={2000}
          />
          <TactilePressable
            edgeColor={theme.colors.primaryContainer}
            radius={14}
            depth={3}
            haptic="medium"
            disabled={!text.trim() || submitting}
            faceStyle={[s.sendBtn, (!text.trim() || submitting) && s.sendBtnDisabled]}
            onPress={submit}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.onPrimary} size="small" />
            ) : (
              <>
                <Send size={16} color={theme.colors.onPrimary} />
                <Text style={s.sendText}>Reflect</Text>
              </>
            )}
          </TactilePressable>
        </View>

        {/* Companion response */}
        {latest && (
          <View style={s.responseCard}>
            <View style={s.responseHeader}>
              <Heart size={16} color={theme.colors.pink} fill={theme.colors.pink} />
              <Text style={s.responseLabel}>Your companion</Text>
            </View>
            <Text style={s.responseMsg}>{latest.message}</Text>
            {latest.verse ? <VerseCard verse={latest.verse} fontFamily={fontFamily} /> : null}
          </View>
        )}

        {/* History */}
        <Text style={s.sectionTitle}>Past reflections</Text>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : history.length === 0 && !latest ? (
          <EmptyState
            icon={Sparkles}
            title="Start reflecting"
            sub="Your reflections and the verses that comfort you will appear here."
          />
        ) : (
          history.map((r) => (
            <View key={r.id} style={s.historyCard}>
              <Text style={s.historyText} numberOfLines={3}>
                {r.text}
              </Text>
              {r.verse ? (
                <Text style={s.historyRef}>
                  {r.verse.translation}  ·  {r.verse.reference}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function VerseCard({
  verse,
  fontFamily,
}: {
  verse: NonNullable<Reflection["verse"]>;
  fontFamily: string;
}) {
  return (
    <View style={s.verseCard}>
      <Text style={[s.verseArabic, { fontFamily }]}>{verse.arabic}</Text>
      <Text style={s.verseTranslation}>“{verse.translation}”</Text>
      <Text style={s.verseRef}>
        {verse.reference} · {verse.source}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 48 },
  composer: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  prompt: { color: theme.colors.text, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  input: {
    minHeight: 96,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 12,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  responseCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.pink + "33",
  },
  responseHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  responseLabel: { color: theme.colors.pink, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  responseMsg: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },

  verseCard: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  verseArabic: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 40,
    textAlign: "right",
    writingDirection: "rtl",
  },
  verseTranslation: {
    color: theme.colors.text,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    marginTop: 8,
  },
  verseRef: { color: theme.colors.primary, fontSize: 12, fontWeight: "800", marginTop: 6 },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  historyText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  historyRef: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
});
