import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check, Share2, Users } from "lucide-react-native";
import { AnimatedPressable } from "../ui";
import { dq } from "../../theme/designTokens";
import type { GroupChallenge } from "../../store/services/api";
import { AvatarStack } from "./Avatar";
import { formatCountdown, metricLabel } from "./theme";

interface GroupChallengeCardProps {
  group: GroupChallenge | null;
  onCreate: () => void;
  onJoin: () => void;
  onShareCode: (code: string) => void;
}

/** A shared goal several people push toward together — e.g. a family khatm. */
export function GroupChallengeCard({
  group,
  onCreate,
  onJoin,
  onShareCode,
}: GroupChallengeCardProps) {
  if (!group) {
    return (
      <View style={s.card}>
        <View style={s.top}>
          <View style={s.icon}>
            <Users size={19} color={dq.green} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Start a group challenge</Text>
            <Text style={s.sub}>
              Set a shared goal with family or friends and finish it together.
            </Text>
          </View>
        </View>
        <View style={s.btnRow}>
          <AnimatedPressable style={s.primaryBtn} onPress={onCreate}>
            <Text style={s.primaryBtnText}>CREATE</Text>
          </AnimatedPressable>
          <AnimatedPressable style={s.ghostBtn} onPress={onJoin}>
            <Text style={s.ghostBtnText}>JOIN WITH CODE</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  const remainingSec = Math.max(
    0,
    Math.floor((new Date(group.ends_at).getTime() - Date.now()) / 1000),
  );

  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={s.icon}>
          {group.completed ? (
            <Check size={19} color={dq.green} strokeWidth={3} />
          ) : (
            <Text style={s.glyph}>☾</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {group.description
              ? `${group.description} · ${group.member_count} member${group.member_count === 1 ? "" : "s"}`
              : `${group.member_count} member${group.member_count === 1 ? "" : "s"}`}
          </Text>
        </View>
        <AnimatedPressable
          style={s.shareBtn}
          onPress={() => onShareCode(group.join_code)}
        >
          <Share2 size={15} color={dq.muted} strokeWidth={2.2} />
        </AnimatedPressable>
      </View>

      <View style={s.bottom}>
        <AvatarStack initials={group.members.map((m) => m.initial)} />
        <View style={s.track}>
          <View style={[s.fill, { width: `${group.percent}%` }]} />
        </View>
        <Text style={s.pct}>{group.percent}%</Text>
      </View>

      <Text style={s.meta}>
        {group.completed
          ? `Complete — ${metricLabel(group.metric, group.target)} together. Mashallah!`
          : `${metricLabel(group.metric, group.progress)} of ${group.target} · ${formatCountdown(remainingSec)} left`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    padding: 17,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: dq.greenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 18, color: dq.green },
  title: { fontSize: 14.5, fontFamily: "Nunito_900Black", color: dq.text },
  sub: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 1,
  },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: dq.screen,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  track: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5, backgroundColor: dq.green },
  pct: { fontSize: 12.5, fontFamily: "Nunito_900Black", color: dq.greenBright },
  meta: {
    fontSize: 11.5,
    fontFamily: "Nunito_700Bold",
    color: dq.faint,
    marginTop: 10,
  },
  btnRow: { flexDirection: "row", gap: 9, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    backgroundColor: dq.greenTint,
    borderWidth: 1.5,
    borderColor: dq.green,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    color: dq.greenBright,
  },
  ghostBtn: {
    flex: 1,
    backgroundColor: dq.screen,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
  },
  ghostBtnText: { fontSize: 12, fontFamily: "Nunito_900Black", color: dq.muted },
});
