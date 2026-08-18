import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronLeft, Trophy } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { AnimatedPressable } from "../../components/ui";
import {
  CodeEntrySheet,
  CreateGroupSheet,
  DuelCard,
  GroupChallengeCard,
  QuestList,
} from "../../components/challenge";
import { theme } from "../../theme/themes";
import { dq } from "../../theme/designTokens";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  useCancelDuelMutation,
  useCreateDuelMutation,
  useCreateGroupChallengeMutation,
  useGetChallengesQuery,
  useJoinDuelMutation,
  useJoinGroupChallengeMutation,
  useSendEncouragementMutation,
  type CreateGroupChallengeRequest,
  type Duel,
} from "../../store/services/api";

type Props = NativeStackScreenProps<AppStackParamList, "Challenges">;
type CodeSheet = "duel" | "group" | null;

function errorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: string; message?: string } })?.data;
  return data?.error || data?.message || fallback;
}

export function ChallengesScreen({ navigation }: Props) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetChallengesQuery();

  const [createDuel, { isLoading: creatingDuel }] = useCreateDuelMutation();
  const [joinDuel, { isLoading: joiningDuel }] = useJoinDuelMutation();
  const [cancelDuel, { isLoading: cancellingDuel }] = useCancelDuelMutation();
  const [createGroup, { isLoading: creatingGroup }] =
    useCreateGroupChallengeMutation();
  const [joinGroup, { isLoading: joiningGroup }] = useJoinGroupChallengeMutation();
  const [encourage, { isLoading: encouraging }] = useSendEncouragementMutation();

  const [codeSheet, setCodeSheet] = useState<CodeSheet>(null);
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);

  const overview = data?.data;
  const duel = overview?.duel ?? null;
  const group = overview?.group ?? null;
  const quests = overview?.quests ?? [];
  const results = overview?.results ?? [];

  const shareCode = useCallback(async (code: string, what: string) => {
    try {
      await Share.share({
        message: `Join my ${what} on DeenQuest! Open the app, tap Challenges, and enter code ${code} 🔥`,
      });
    } catch {
      // The user dismissed the share sheet — nothing to report.
    }
  }, []);

  const handleStartDuel = async () => {
    try {
      const res = await createDuel().unwrap();
      const code = res.data?.invite_code;
      if (code) await shareCode(code, "duel");
    } catch (err) {
      Alert.alert("Could not start duel", errorMessage(err, "Please try again."));
    }
  };

  const handleJoinCode = async (code: string) => {
    const target = codeSheet;
    try {
      if (target === "duel") {
        await joinDuel(code).unwrap();
      } else {
        await joinGroup(code).unwrap();
      }
      setCodeSheet(null);
    } catch (err) {
      Alert.alert(
        "Could not join",
        errorMessage(err, "Check the code and try again."),
      );
    }
  };

  const handleCancelDuel = (duelId: string) => {
    Alert.alert("Cancel this duel?", "Your invite code will stop working.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel duel",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelDuel(duelId).unwrap();
          } catch (err) {
            Alert.alert("Failed", errorMessage(err, "Please try again."));
          }
        },
      },
    ]);
  };

  const handleCreateGroup = async (req: CreateGroupChallengeRequest) => {
    try {
      const res = await createGroup(req).unwrap();
      setGroupSheetOpen(false);
      const code = res.data?.join_code;
      if (code) await shareCode(code, "group challenge");
    } catch (err) {
      Alert.alert(
        "Could not create challenge",
        errorMessage(err, "Please try again."),
      );
    }
  };

  const handleEncourage = async (userId: string) => {
    try {
      await encourage(userId).unwrap();
      Alert.alert("Sent", "Your encouragement is on its way. Jazak Allahu khayran!");
    } catch (err) {
      Alert.alert(
        "Not sent",
        errorMessage(err, "You may have already encouraged them today."),
      );
    }
  };

  // The header invite button shares whichever code the user actually has.
  const inviteCode = duel?.invite_code ?? group?.join_code ?? null;
  const handleHeaderInvite = () => {
    if (inviteCode) {
      shareCode(inviteCode, duel?.invite_code ? "duel" : "group challenge");
      return;
    }
    setCodeSheet("duel");
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Challenges</Text>
          <Text style={s.headerSub}>Grow together, win together</Text>
        </View>
        <AnimatedPressable style={s.inviteChip} onPress={handleHeaderInvite}>
          <Text style={s.invitePlus}>+</Text>
          <Text style={s.inviteText}>{inviteCode ? "INVITE" : "JOIN"}</Text>
        </AnimatedPressable>
      </View>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <View style={s.errorWrap}>
          <Text style={s.errorTitle}>Couldn't load your challenges</Text>
          <Text style={s.errorBody}>
            Check your connection and try again.
          </Text>
          <AnimatedPressable style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryText}>RETRY</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={dq.green}
            />
          }
        >
          <DuelCard
            duel={duel}
            busy={creatingDuel || cancellingDuel}
            onStart={handleStartDuel}
            onEnterCode={() => setCodeSheet("duel")}
            onShareCode={(code) => shareCode(code, "duel")}
            onCancel={handleCancelDuel}
            onEncourage={handleEncourage}
            encouraging={encouraging}
          />

          {results.length > 0 && <RecentResults results={results} />}

          <GroupChallengeCard
            group={group}
            onCreate={() => setGroupSheetOpen(true)}
            onJoin={() => setCodeSheet("group")}
            onShareCode={(code) => shareCode(code, "group challenge")}
          />

          <View>
            <Text style={s.sectionTitle}>This week's quests</Text>
            <View style={{ marginTop: 12 }}>
              <QuestList quests={quests} />
            </View>
          </View>
        </ScrollView>
      )}

      <CodeEntrySheet
        visible={codeSheet !== null}
        title={codeSheet === "group" ? "Join a group challenge" : "Join a duel"}
        subtitle={
          codeSheet === "group"
            ? "Enter the code a friend or family member shared with you."
            : "Enter the duel code your friend shared with you."
        }
        busy={joiningDuel || joiningGroup}
        onClose={() => setCodeSheet(null)}
        onSubmit={handleJoinCode}
      />

      <CreateGroupSheet
        visible={groupSheetOpen}
        busy={creatingGroup}
        onClose={() => setGroupSheetOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </ScreenWrapper>
  );
}

/** A compact strip of the user's most recently settled duels. */
function RecentResults({ results }: { results: Duel[] }) {
  return (
    <View style={s.resultsCard}>
      <Text style={s.resultsTitle}>Recent duels</Text>
      {results.map((result) => {
        const won = result.outcome === "won";
        const draw = result.outcome === "draw";
        const color = won ? dq.gold : draw ? dq.muted : dq.faint;
        return (
          <View key={result.id} style={s.resultRow}>
            <Trophy size={15} color={color} strokeWidth={2.2} />
            <Text style={s.resultText} numberOfLines={1}>
              {draw
                ? `Drew with ${result.rival?.display_name ?? "your rival"}`
                : won
                  ? `Beat ${result.rival?.display_name ?? "your rival"}`
                  : `Lost to ${result.rival?.display_name ?? "your rival"}`}
            </Text>
            <Text style={[s.resultScore, { color }]}>
              {result.you.score}–{result.rival?.score ?? 0}
            </Text>
          </View>
        );
      })}
    </View>
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
  invitePlus: { fontSize: 15, fontFamily: "Nunito_900Black", color: dq.greenBright },
  inviteText: { fontSize: 12, fontFamily: "Nunito_900Black", color: dq.greenBright },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    paddingHorizontal: 4,
  },

  // recent results
  resultsCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 8,
  },
  resultsTitle: {
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    color: dq.faint,
    letterSpacing: 1,
  },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
    color: dq.muted,
  },
  resultScore: { fontSize: 12.5, fontFamily: "Nunito_900Black" },

  // error state
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  errorTitle: { fontSize: 16, fontFamily: "Nunito_900Black", color: dq.text },
  errorBody: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: dq.greenTint,
    borderWidth: 1.5,
    borderColor: dq.green,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 26,
    marginTop: 8,
  },
  retryText: { fontSize: 12.5, fontFamily: "Nunito_900Black", color: dq.greenBright },
});

export default ChallengesScreen;
