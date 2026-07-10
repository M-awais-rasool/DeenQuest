import React, { useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Crown } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { AnimatedPressable } from "../../components/ui";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { useAppSelector } from "../../store/hooks";
import { useGetLeaderboardQuery } from "../../store/services/api";
import type { LeaderboardUser } from "../../store/services/api";
import type { RootState } from "../../store/store";
import type { MainState } from "../../store/slices/mainSlice";
import { theme } from "../../theme/themes";

/** Avatar gradient pairs cycled per rank (from the F3 mock). */
const AVATAR_GRADIENTS: [string, string][] = [
  ["#EFB65A", "#F27FB2"],
  ["#6EC1E8", "#2CC9B5"],
  ["#A78BFA", "#F27FB2"],
  ["#2CC9B5", "#6EC1E8"],
  ["#F79A59", "#F27FB2"],
  ["#2CC9B5", "#EFB65A"],
];

/** Podium plinth look for ranks 1..3. */
const PODIUM = [
  { height: 100, colors: ["#3A2F16", "#16272B"] as [string, string], border: "#4A3E28", rankColor: "#EFB65A" },
  { height: 74, colors: ["#1E3238", "#16272B"] as [string, string], border: "#24393E", rankColor: "#C9D4D9" },
  { height: 56, colors: ["#2E2318", "#16272B"] as [string, string], border: "#3D2A14", rankColor: "#D9A06B" },
];

function formatXP(xp: number): string {
  return `${xp.toLocaleString()} XP`;
}

function buildMockName(rank: number): string {
  return `Seeker ${String(rank).padStart(3, "0")}`;
}

function buildDisplayName({
  rank,
  backendName,
  isCurrentUser,
  currentUserName,
}: {
  rank: number;
  backendName?: string;
  isCurrentUser: boolean;
  currentUserName?: string;
}): string {
  const trimmedBackendName = backendName?.trim();
  if (trimmedBackendName) return trimmedBackendName;

  const trimmedCurrentUserName = currentUserName?.trim();
  if (isCurrentUser && trimmedCurrentUserName) return trimmedCurrentUserName;

  return buildMockName(rank);
}

function Avatar({
  name,
  rank,
  size,
}: {
  name: string;
  rank: number;
  size: number;
}) {
  const gradient = AVATAR_GRADIENTS[(rank - 1) % AVATAR_GRADIENTS.length];
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontFamily: "Nunito_900Black",
          color: "#06302B",
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

function PodiumColumn({
  entry,
  name,
  place,
}: {
  entry: LeaderboardUser;
  name: string;
  place: 1 | 2 | 3;
}) {
  const meta = PODIUM[place - 1];
  return (
    <View style={styles.podiumCol}>
      {place === 1 && (
        <Crown
          size={20}
          color={theme.colors.secondary}
          fill={theme.colors.secondary}
          style={styles.crown}
        />
      )}
      <Avatar name={name} rank={entry.rank} size={place === 1 ? 66 : 56} />
      <Text style={styles.podiumName} numberOfLines={1}>
        {name}
      </Text>
      <LinearGradient
        colors={meta.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.plinth,
          { height: meta.height, borderColor: meta.border },
        ]}
      >
        <Text style={[styles.plinthRank, { color: meta.rankColor }]}>
          {place}
        </Text>
        <Text style={styles.plinthXp}>{formatXP(entry.xp)}</Text>
      </LinearGradient>
    </View>
  );
}

export function LeaderboardScreen() {
  const navigation = useNavigation();
  const {
    data: leaderboardData,
    isLoading,
    isFetching,
    refetch,
  } = useGetLeaderboardQuery(undefined);

  const currentUser = useAppSelector(
    (state: RootState) => (state as RootState & { main: MainState }).main.user,
  );
  const currentUserName =
    currentUser?.display_name?.trim() || currentUser?.email?.split("@")[0] || undefined;

  const rows = useMemo(() => leaderboardData?.data ?? [], [leaderboardData]);
  const podium = rows.slice(0, 3);
  const rest = rows.length > 3 ? rows.slice(3) : [];

  const nameFor = (item: LeaderboardUser) =>
    buildDisplayName({
      rank: item.rank,
      backendName: item.display_name,
      isCurrentUser: currentUser?.id === item.user_id,
      currentUserName,
    });

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.scopePill}>
          <Text style={styles.scopePillText}>GLOBAL · XP</Text>
        </View>
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={rest.length > 0 ? rest : rows}
          keyExtractor={(item) => `${item.user_id}-${item.rank}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={
            podium.length === 3 && rest.length > 0 ? (
              <View style={styles.podiumRow}>
                <PodiumColumn entry={podium[1]} name={nameFor(podium[1])} place={2} />
                <PodiumColumn entry={podium[0]} name={nameFor(podium[0])} place={1} />
                <PodiumColumn entry={podium[2]} name={nameFor(podium[2])} place={3} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No users yet</Text>
              <Text style={styles.emptySub}>
                Leaderboard will appear when users gain XP.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCurrentUser = currentUser?.id === item.user_id;
            const name = isCurrentUser ? "You" : nameFor(item);
            return (
              <View style={[styles.row, isCurrentUser && styles.rowCurrentUser]}>
                <Text
                  style={[styles.rankText, isCurrentUser && styles.rankTextYou]}
                >
                  {item.rank}
                </Text>
                <Avatar name={nameFor(item)} rank={item.rank} size={38} />
                <Text
                  style={[styles.userName, isCurrentUser && styles.userNameYou]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text
                  style={[styles.xpText, isCurrentUser && styles.xpTextYou]}
                >
                  {formatXP(item.xp)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
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
  headerTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: "Nunito_900Black",
  },
  scopePill: {
    marginLeft: "auto",
    backgroundColor: "#3A2F16",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  scopePillText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.7,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 14,
    paddingTop: 22,
    paddingBottom: 14,
  },
  podiumCol: {
    alignItems: "center",
    gap: 8,
  },
  crown: {
    marginBottom: -2,
  },
  podiumName: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    maxWidth: 86,
  },
  plinth: {
    width: 82,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  plinthRank: {
    fontSize: 22,
    fontFamily: "Nunito_900Black",
  },
  plinthXp: {
    color: "#5F7E7C",
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 9,
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 20,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: "Nunito_800ExtraBold",
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 13,
  },
  rowCurrentUser: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: "#0E2C29",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  rankText: {
    width: 24,
    color: "#5F7E7C",
    fontSize: 13,
    fontFamily: "Nunito_900Black",
  },
  rankTextYou: {
    color: "#5EE0CE",
  },
  userName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: "Nunito_800ExtraBold",
  },
  userNameYou: {
    fontFamily: "Nunito_900Black",
  },
  xpText: {
    color: theme.colors.textMuted,
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
  },
  xpTextYou: {
    color: "#5EE0CE",
    fontFamily: "Nunito_900Black",
  },
});
