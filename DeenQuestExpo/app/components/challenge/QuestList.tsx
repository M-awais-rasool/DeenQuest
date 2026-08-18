import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { dq } from "../../theme/designTokens";
import type { WeeklyQuest } from "../../store/services/api";
import { accentOf } from "./theme";

/** This week's quest board. */
export function QuestList({ quests }: { quests: WeeklyQuest[] }) {
  if (quests.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>
          Your quests for this week appear here — check back in a moment.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {quests.map((quest) => {
        const accent = accentOf(quest.accent);
        return (
          <View
            key={quest.id}
            style={[s.card, quest.completed && s.cardDone]}
          >
            <View style={[s.tile, { backgroundColor: accent.tile }]}>
              {quest.completed ? (
                <Check size={16} color={accent.fg} strokeWidth={3} />
              ) : (
                <Text style={[s.glyph, { color: accent.fg }]}>
                  {quest.glyph}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={s.titleRow}>
                <Text style={s.title} numberOfLines={1}>
                  {quest.title}
                </Text>
                <Text style={[s.reward, { color: accent.fg }]}>
                  +{quest.reward_xp}
                </Text>
              </View>
              <View style={s.track}>
                <View
                  style={[
                    s.fill,
                    { width: `${quest.percent}%`, backgroundColor: accent.bar },
                  ]}
                />
              </View>
            </View>

            <Text style={[s.count, { color: accent.fg }]}>
              {quest.progress}/{quest.target}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  cardDone: { borderColor: dq.green, backgroundColor: "rgba(44,201,181,0.06)" },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
  },
  reward: { fontSize: 11, fontFamily: "Nunito_900Black" },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: dq.screen,
    overflow: "hidden",
    marginTop: 8,
  },
  fill: { height: "100%", borderRadius: 4 },
  count: { fontSize: 11.5, fontFamily: "Nunito_900Black" },
  empty: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    padding: 18,
  },
  emptyText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    textAlign: "center",
  },
});
