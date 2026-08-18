import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Swords } from "lucide-react-native";
import { AnimatedPressable, TactilePressable } from "../ui";
import { dq } from "../../theme/designTokens";
import type { Duel } from "../../store/services/api";
import { Avatar } from "./Avatar";
import { PURPLE, PURPLE_DARK, PURPLE_LIGHT, formatCountdown } from "./theme";

interface DuelCardProps {
  duel: Duel | null;
  busy?: boolean;
  onStart: () => void;
  onEnterCode: () => void;
  onShareCode: (code: string) => void;
  onCancel: (duelId: string) => void;
  onEncourage: (userId: string) => void;
  encouraging?: boolean;
}

export function DuelCard({
  duel,
  busy = false,
  onStart,
  onEnterCode,
  onShareCode,
  onCancel,
  onEncourage,
  encouraging = false,
}: DuelCardProps) {
  if (!duel) {
    return (
      <EmptyDuel busy={busy} onStart={onStart} onEnterCode={onEnterCode} />
    );
  }
  if (duel.status === "pending") {
    return (
      <PendingDuel
        duel={duel}
        busy={busy}
        onShareCode={onShareCode}
        onCancel={onCancel}
      />
    );
  }
  return (
    <ActiveDuel duel={duel} onEncourage={onEncourage} encouraging={encouraging} />
  );
}

function DuelShell({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[PURPLE_DARK, "#16272B"]}
      locations={[0, 0.7]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={s.card}
    >
      {children}
    </LinearGradient>
  );
}

function EmptyDuel({
  busy,
  onStart,
  onEnterCode,
}: {
  busy: boolean;
  onStart: () => void;
  onEnterCode: () => void;
}) {
  return (
    <DuelShell>
      <View style={s.emptyIcon}>
        <Swords size={24} color={PURPLE_LIGHT} strokeWidth={2.2} />
      </View>
      <Text style={s.emptyTitle}>Start a weekly duel</Text>
      <Text style={s.emptyBody}>
        Race a friend for a week. Whoever earns the most XP takes the win — and
        you both keep the good habit.
      </Text>
      <View style={s.btnRow}>
        <TactilePressable
          style={{ flex: 1 }}
          faceStyle={s.primaryBtn}
          edgeColor="#5B44A8"
          radius={14}
          depth={4}
          haptic="medium"
          disabled={busy}
          onPress={onStart}
        >
          {busy ? (
            <ActivityIndicator size="small" color={PURPLE_DARK} />
          ) : (
            <Text style={s.primaryBtnText}>CREATE DUEL</Text>
          )}
        </TactilePressable>
        <AnimatedPressable style={s.secondaryBtn} onPress={onEnterCode}>
          <Text style={s.secondaryBtnText}>HAVE A CODE?</Text>
        </AnimatedPressable>
      </View>
    </DuelShell>
  );
}

function PendingDuel({
  duel,
  busy,
  onShareCode,
  onCancel,
}: {
  duel: Duel;
  busy: boolean;
  onShareCode: (code: string) => void;
  onCancel: (duelId: string) => void;
}) {
  const code = duel.invite_code ?? "";
  return (
    <DuelShell>
      <View style={s.top}>
        <View style={s.badge}>
          <Text style={s.badgeText}>WAITING FOR RIVAL</Text>
        </View>
        <Text style={s.ends}>expires in {formatCountdown(duel.ends_in_sec)}</Text>
      </View>

      <Text style={s.codeLabel}>Share this code</Text>
      <View style={s.codeBox}>
        <Text style={s.codeText}>{code}</Text>
      </View>
      <Text style={s.codeHint}>
        The duel starts the moment someone joins — a full week for both of you.
      </Text>

      <View style={s.btnRow}>
        <TactilePressable
          style={{ flex: 1 }}
          faceStyle={s.primaryBtn}
          edgeColor="#5B44A8"
          radius={14}
          depth={4}
          haptic="medium"
          onPress={() => onShareCode(code)}
        >
          <Text style={s.primaryBtnText}>SHARE INVITE</Text>
        </TactilePressable>
        <AnimatedPressable
          style={s.secondaryBtn}
          disabled={busy}
          onPress={() => onCancel(duel.id)}
        >
          <Text style={s.secondaryBtnText}>CANCEL</Text>
        </AnimatedPressable>
      </View>
    </DuelShell>
  );
}

function ActiveDuel({
  duel,
  onEncourage,
  encouraging,
}: {
  duel: Duel;
  onEncourage: (userId: string) => void;
  encouraging: boolean;
}) {
  const you = duel.you.score;
  const rival = duel.rival?.score ?? 0;
  // With no XP on the board yet, show an even split rather than a full bar.
  const total = you + rival;
  const youPct = total > 0 ? Math.round((you / total) * 100) : 50;
  const lead = you - rival;

  return (
    <DuelShell>
      <View style={s.top}>
        <View style={s.badge}>
          <Text style={s.badgeText}>WEEKLY DUEL</Text>
        </View>
        <Text style={s.ends}>ends in {formatCountdown(duel.ends_in_sec)}</Text>
      </View>

      <View style={s.row}>
        <View style={s.side}>
          <Avatar initial={duel.you.initial} index={0} size={56} highlighted />
          <Text style={s.name} numberOfLines={1}>
            You
          </Text>
          <Text style={[s.xp, { color: dq.greenBright }]}>
            {you}
            <Text style={s.xpUnit}> XP</Text>
          </Text>
        </View>

        <View style={s.vs}>
          <Text style={s.vsText}>VS</Text>
          <View style={s.vsLine} />
        </View>

        <View style={s.side}>
          <Avatar initial={duel.rival?.initial ?? "?"} index={1} size={56} />
          <Text style={s.name} numberOfLines={1}>
            {duel.rival?.display_name ?? "Rival"}
          </Text>
          <Text style={[s.xp, { color: PURPLE_LIGHT }]}>
            {rival}
            <Text style={s.xpUnit}> XP</Text>
          </Text>
        </View>
      </View>

      <View style={s.track}>
        <LinearGradient
          colors={[dq.green, dq.greenBright]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${youPct}%` }}
        />
        <View style={{ flex: 1, backgroundColor: "#3B2F6B" }} />
      </View>

      <Text style={s.lead}>
        {lead > 0
          ? `You lead by ${lead} XP — one lesson keeps you ahead!`
          : lead < 0
            ? `${duel.rival?.display_name ?? "Your rival"} leads by ${-lead} XP — one lesson takes it back!`
            : "Dead even — the next lesson breaks the tie!"}
      </Text>

      {duel.rival && (
        <AnimatedPressable
          style={s.encourageBtn}
          disabled={encouraging}
          onPress={() => onEncourage(duel.rival!.user_id)}
        >
          <Heart size={14} color="#F8A9CC" strokeWidth={2.4} />
          <Text style={s.encourageText}>
            ENCOURAGE {duel.rival.display_name.toUpperCase()}
          </Text>
        </AnimatedPressable>
      )}
    </DuelShell>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 24,
    padding: 18,
  },

  // empty state
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2A2440",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 12,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 5,
  },

  // pending state
  codeLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: PURPLE_LIGHT,
    letterSpacing: 1,
    marginTop: 16,
  },
  codeBox: {
    backgroundColor: "rgba(11,21,23,0.55)",
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  codeText: {
    fontSize: 30,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    letterSpacing: 8,
    // The trailing letter-space would otherwise push the text off-centre.
    marginLeft: 8,
  },
  codeHint: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 8,
    textAlign: "center",
  },

  // shared header
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    backgroundColor: PURPLE,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10.5,
    fontFamily: "Nunito_900Black",
    color: PURPLE_DARK,
    letterSpacing: 1,
  },
  ends: {
    fontSize: 11.5,
    fontFamily: "Nunito_800ExtraBold",
    color: PURPLE_LIGHT,
  },

  // active scoreboard
  row: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16 },
  side: { flex: 1, alignItems: "center", gap: 6 },
  name: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  xp: { fontSize: 20, lineHeight: 22, fontFamily: "Nunito_900Black" },
  xpUnit: { fontSize: 11, color: dq.muted },
  vs: { alignItems: "center", gap: 4 },
  vsText: { fontSize: 15, fontFamily: "Nunito_900Black", color: PURPLE_LIGHT },
  vsLine: { width: 1.5, height: 38, backgroundColor: "#3B2F6B" },
  track: {
    flexDirection: "row",
    height: 11,
    borderRadius: 6,
    backgroundColor: dq.screen,
    overflow: "hidden",
    marginTop: 14,
  },
  lead: {
    fontSize: 11.5,
    fontFamily: "Nunito_700Bold",
    color: PURPLE_LIGHT,
    textAlign: "center",
    marginTop: 10,
  },
  encourageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#3A2030",
    borderWidth: 1,
    borderColor: "#5A3348",
    borderRadius: 13,
    paddingVertical: 10,
    marginTop: 12,
  },
  encourageText: {
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    color: "#F8A9CC",
    letterSpacing: 0.6,
  },

  // buttons
  btnRow: { flexDirection: "row", gap: 9, marginTop: 14 },
  primaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 12.5,
    fontFamily: "Nunito_900Black",
    color: PURPLE_DARK,
    letterSpacing: 0.7,
  },
  secondaryBtn: {
    backgroundColor: dq.card,
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontFamily: "Nunito_900Black",
    color: dq.muted,
  },
});
