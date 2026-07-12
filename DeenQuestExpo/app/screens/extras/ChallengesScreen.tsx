import React from "react";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable } from "../../components/ui";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "../../theme/themes";
import { dq } from "../../theme/designTokens";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "Challenges">;

const PURPLE = "#A78BFA";
const PURPLE_LIGHT = "#C4B2FF";
const PURPLE_DARK = "#241A45";

// Mock challenge data (H3 mock) — friends/duels backend comes later.
const DUEL = {
  you: { initial: "A", xp: 340 },
  rival: { name: "Yusuf", initial: "Y", xp: 315 },
  endsIn: "2d 6h",
};

const KHATM = {
  title: "Family Khatm Challenge",
  subtitle: "Finish Juz 30 together · 5 members",
  pct: 71,
  members: [
    { initial: "A", colors: ["#2CC9B5", "#EFB65A"] as [string, string], fg: "#06302B" },
    { initial: "M", colors: ["#F79A59", "#F27FB2"] as [string, string], fg: "#3A1024" },
    { initial: "H", colors: ["#6EC1E8", "#A78BFA"] as [string, string], fg: "#0E2A3A" },
  ],
  extra: 2,
};

const QUESTS = [
  {
    glyph: "⚡",
    tileBg: "#3A2F16",
    tileFg: dq.gold,
    title: "Earn 200 XP with a friend",
    current: 156,
    target: 200,
    barColor: dq.gold,
    labelColor: dq.gold,
  },
  {
    glyph: "♥",
    tileBg: "#3A2030",
    tileFg: "#F8A9CC",
    title: "Send 3 encouragements",
    current: 1,
    target: 3,
    barColor: "#F27FB2",
    labelColor: "#F8A9CC",
  },
];

export function ChallengesScreen({ navigation }: Props) {
  const youPct = Math.round(
    (DUEL.you.xp / Math.max(DUEL.you.xp + DUEL.rival.xp, 1)) * 100,
  );
  const lead = DUEL.you.xp - DUEL.rival.xp;

  const invite = async () => {
    try {
      await Share.share({
        message:
          "Join me on DeenQuest — let's keep each other's streaks alive! 🔥",
      });
    } catch {}
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* header */}
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Challenges</Text>
          <Text style={s.headerSub}>Grow together, win together</Text>
        </View>
        <AnimatedPressable style={s.inviteChip} onPress={invite}>
          <Text style={s.invitePlus}>+</Text>
          <Text style={s.inviteText}>INVITE</Text>
        </AnimatedPressable>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* weekly duel */}
        <LinearGradient
          colors={[PURPLE_DARK, "#16272B"]}
          locations={[0, 0.7]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.duelCard}
        >
          <View style={s.duelTop}>
            <View style={s.duelBadge}>
              <Text style={s.duelBadgeText}>WEEKLY DUEL</Text>
            </View>
            <Text style={s.duelEnds}>ends in {DUEL.endsIn}</Text>
          </View>

          <View style={s.duelRow}>
            <View style={s.duelSide}>
              <LinearGradient
                colors={["#2CC9B5", "#EFB65A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.duelAvatar, s.duelAvatarYou]}
              >
                <Text style={[s.duelAvatarText, { color: "#06302B" }]}>
                  {DUEL.you.initial}
                </Text>
              </LinearGradient>
              <Text style={s.duelName}>You</Text>
              <Text style={[s.duelXp, { color: "#5EE0CE" }]}>
                {DUEL.you.xp}
                <Text style={s.duelXpUnit}> XP</Text>
              </Text>
            </View>

            <View style={s.duelVs}>
              <Text style={s.duelVsText}>VS</Text>
              <View style={s.duelVsLine} />
            </View>

            <View style={s.duelSide}>
              <LinearGradient
                colors={["#6EC1E8", "#A78BFA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.duelAvatar}
              >
                <Text style={[s.duelAvatarText, { color: "#0E2A3A" }]}>
                  {DUEL.rival.initial}
                </Text>
              </LinearGradient>
              <Text style={s.duelName}>{DUEL.rival.name}</Text>
              <Text style={[s.duelXp, { color: PURPLE_LIGHT }]}>
                {DUEL.rival.xp}
                <Text style={s.duelXpUnit}> XP</Text>
              </Text>
            </View>
          </View>

          <View style={s.duelTrack}>
            <LinearGradient
              colors={["#2CC9B5", "#5EE0CE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${youPct}%` }}
            />
            <View style={{ flex: 1, backgroundColor: "#3B2F6B" }} />
          </View>
          <Text style={s.duelLead}>
            {lead >= 0
              ? `You lead by ${lead} XP — one lesson keeps you ahead!`
              : `${DUEL.rival.name} leads by ${-lead} XP — one lesson takes it back!`}
          </Text>
        </LinearGradient>

        {/* family khatm */}
        <View style={s.khatmCard}>
          <View style={s.khatmTop}>
            <View style={s.khatmIcon}>
              <Text style={s.khatmGlyph}>☾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.khatmTitle}>{KHATM.title}</Text>
              <Text style={s.khatmSub}>{KHATM.subtitle}</Text>
            </View>
          </View>
          <View style={s.khatmBottom}>
            <View style={s.khatmAvatars}>
              {KHATM.members.map((m, i) => (
                <LinearGradient
                  key={i}
                  colors={m.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[s.khatmAvatar, i > 0 && { marginLeft: -9 }]}
                >
                  <Text style={[s.khatmAvatarText, { color: m.fg }]}>
                    {m.initial}
                  </Text>
                </LinearGradient>
              ))}
              <View style={[s.khatmAvatar, s.khatmExtra, { marginLeft: -9 }]}>
                <Text style={s.khatmExtraText}>+{KHATM.extra}</Text>
              </View>
            </View>
            <View style={s.khatmTrack}>
              <View style={[s.khatmFill, { width: `${KHATM.pct}%` }]} />
            </View>
            <Text style={s.khatmPct}>{KHATM.pct}%</Text>
          </View>
        </View>

        {/* quests */}
        <Text style={s.questsTitle}>This week's quests</Text>
        <View style={s.questList}>
          {QUESTS.map((quest) => (
            <View key={quest.title} style={s.questCard}>
              <View style={[s.questTile, { backgroundColor: quest.tileBg }]}>
                <Text style={[s.questGlyph, { color: quest.tileFg }]}>
                  {quest.glyph}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.questTitle}>{quest.title}</Text>
                <View style={s.questTrack}>
                  <View
                    style={[
                      s.questFill,
                      {
                        width: `${Math.round((quest.current / quest.target) * 100)}%`,
                        backgroundColor: quest.barColor,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[s.questCount, { color: quest.labelColor }]}>
                {quest.current}/{quest.target}
              </Text>
            </View>
          ))}
        </View>
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
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: dq.greenTint,
    borderWidth: 1.5,
    borderColor: dq.green,
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  invitePlus: { fontSize: 15, fontFamily: "Nunito_900Black", color: "#5EE0CE" },
  inviteText: { fontSize: 12, fontFamily: "Nunito_900Black", color: "#5EE0CE" },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  // duel
  duelCard: {
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 24,
    padding: 18,
  },
  duelTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  duelBadge: {
    backgroundColor: PURPLE,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  duelBadgeText: {
    fontSize: 10.5,
    fontFamily: "Nunito_900Black",
    color: PURPLE_DARK,
    letterSpacing: 1,
  },
  duelEnds: {
    fontSize: 11.5,
    fontFamily: "Nunito_800ExtraBold",
    color: PURPLE_LIGHT,
  },
  duelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 16,
  },
  duelSide: { flex: 1, alignItems: "center", gap: 6 },
  duelAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  duelAvatarYou: {
    borderWidth: 2.5,
    borderColor: "#5EE0CE",
  },
  duelAvatarText: { fontSize: 22, fontFamily: "Nunito_900Black" },
  duelName: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  duelXp: { fontSize: 20, lineHeight: 22, fontFamily: "Nunito_900Black" },
  duelXpUnit: { fontSize: 11, color: dq.muted },
  duelVs: { alignItems: "center", gap: 4 },
  duelVsText: { fontSize: 15, fontFamily: "Nunito_900Black", color: PURPLE_LIGHT },
  duelVsLine: { width: 1.5, height: 38, backgroundColor: "#3B2F6B" },
  duelTrack: {
    flexDirection: "row",
    height: 11,
    borderRadius: 6,
    backgroundColor: dq.screen,
    overflow: "hidden",
    marginTop: 14,
  },
  duelLead: {
    fontSize: 11.5,
    fontFamily: "Nunito_700Bold",
    color: PURPLE_LIGHT,
    textAlign: "center",
    marginTop: 10,
  },

  // khatm
  khatmCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    padding: 17,
    marginTop: 16,
  },
  khatmTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  khatmIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: dq.greenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  khatmGlyph: { fontSize: 18, color: dq.green },
  khatmTitle: { fontSize: 14.5, fontFamily: "Nunito_900Black", color: dq.text },
  khatmSub: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 1,
  },
  khatmBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  khatmAvatars: { flexDirection: "row", alignItems: "center" },
  khatmAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: dq.card,
    alignItems: "center",
    justifyContent: "center",
  },
  khatmAvatarText: { fontSize: 12, fontFamily: "Nunito_900Black" },
  khatmExtra: { backgroundColor: "#1E3238" },
  khatmExtraText: { fontSize: 10, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  khatmTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  khatmFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: dq.green,
  },
  khatmPct: { fontSize: 12.5, fontFamily: "Nunito_900Black", color: "#5EE0CE" },

  // quests
  questsTitle: {
    fontSize: 15,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  questList: { gap: 10, marginTop: 12 },
  questCard: {
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
  questTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  questGlyph: { fontSize: 16 },
  questTitle: { fontSize: 13.5, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  questTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: dq.screen,
    overflow: "hidden",
    marginTop: 8,
  },
  questFill: { height: "100%", borderRadius: 4 },
  questCount: { fontSize: 11.5, fontFamily: "Nunito_900Black" },
});

export default ChallengesScreen;
