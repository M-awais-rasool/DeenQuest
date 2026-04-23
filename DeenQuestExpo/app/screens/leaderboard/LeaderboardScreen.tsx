import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Crown, Star, Zap } from "lucide-react-native";
import { Header } from "../../components/Header";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { useAppSelector } from "../../store/hooks";
import { useGetLeaderboardQuery, useGetProgressQuery } from "../../store/services/api";
import type { RootState } from "../../store/store";
import type { MainState } from "../../store/slices/mainSlice";
import { theme } from "../../theme/themes";

const TOP_COLORS = [theme.colors.secondary, theme.colors.silver, theme.colors.bronze];

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

export function LeaderboardScreen() {
  const { data: progressData } = useGetProgressQuery();
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

  const totalXP = progressData?.data?.xp ?? 0;
  const rows = useMemo(() => leaderboardData?.data ?? [], [leaderboardData]);

  return (
    <ScreenWrapper>
      <Header title="Leaderboard" xp={totalXP} />

      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.pill}>
            <Crown size={14} color={theme.colors.secondary} />
            <Text style={styles.pillText}>Global Ranking</Text>
          </View>
          <Text style={styles.countText}>{rows.length} Players</Text>
        </View>
        <Text style={styles.headerTitle}>Top learners by Level and XP</Text>
        <Text style={styles.headerSub}>Sorted by level first, then XP points.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No users yet</Text>
              <Text style={styles.emptySub}>Leaderboard will appear when users gain XP.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrentUser = currentUser?.id === item.user_id;
            const isTopThree = index < 3;
            return (
              <View
                style={[
                  styles.row,
                  isCurrentUser && styles.rowCurrentUser,
                  isTopThree && { borderColor: `${TOP_COLORS[index]}55` },
                ]}
              >
                <View style={styles.rankWrap}>
                  <Text style={[styles.rankText, isTopThree && { color: TOP_COLORS[index] }]}>
                    #{item.rank}
                  </Text>
                </View>

                <View style={styles.userBlock}>
                  <Text style={styles.userName}>
                    {buildDisplayName({
                      rank: item.rank,
                      backendName: item.display_name,
                      isCurrentUser,
                      currentUserName,
                    })}
                  </Text>
                  <Text style={styles.userSubtext}>
                    {isCurrentUser ? "Your Position" : "Community Member"}
                  </Text>
                </View>

                <View style={styles.statsBlock}>
                  <View style={styles.statRow}>
                    <Star size={12} color={theme.colors.secondary} />
                    <Text style={styles.statText}>Lv {item.level}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Zap size={12} color={theme.colors.primary} />
                    <Text style={styles.statText}>{formatXP(item.xp)}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.secondary12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.secondary28,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    color: theme.colors.secondary,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  countText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 20,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  rowCurrentUser: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary08,
  },
  rankWrap: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  userBlock: {
    flex: 1,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  userSubtext: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statsBlock: {
    alignItems: "flex-end",
    gap: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
});