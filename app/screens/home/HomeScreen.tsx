import React from "react"
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native"
import { Flame, CheckCircle2, BookOpen, GraduationCap, Bolt } from "lucide-react-native"
import { theme } from "@/theme/themes"
import { ScreenWrapper } from "@/components/ScreenWrapper"
import { ProgressBar } from "@/components/ProgressBar"
import { Header } from "@/components/Header"

export const HomeScreen = () => {
  return (
    <ScreenWrapper>
      <Header title="DeenQuest" xp={1250} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.greeting}>As-salamu Alaykum!</Text>
            <Text style={styles.streakSub}>
              Your <Text style={styles.highlight}>7-day streak</Text> is glowing.
            </Text>
          </View>

          <View style={styles.streakRow}>
            <View style={styles.daysContainer}>
              {["M", "T", "W"].map((day, i) => (
                <View key={i} style={styles.dayItem}>
                  <View style={styles.dayBox}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <CheckCircle2
                      size={18}
                      color={theme.colors.onSecondary}
                      fill={theme.colors.secondary}
                    />
                  </View>
                </View>
              ))}
              <View style={styles.dayItem}>
                <View style={[styles.dayBox, styles.todayBox]}>
                  <Text style={[styles.dayLabel, styles.todayLabel]}>Today</Text>
                  <Bolt size={18} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
                </View>
              </View>
              <View style={[styles.dayItem, { opacity: 0.4 }]}>
                <View style={[styles.dayBox, styles.futureBox]}>
                  <Text style={styles.dayLabel}>F</Text>
                  <View style={styles.emptyCircle} />
                </View>
              </View>
            </View>
            <View style={styles.streakCount}>
              <Text style={styles.streakNumber}>7</Text>
              <Text style={styles.streakUnit}>Days</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Missions</Text>
          <View style={styles.missionCount}>
            <Text style={styles.missionCountText}>3/4 COMPLETED</Text>
          </View>
        </View>

        <View style={styles.missionList}>
          <TouchableOpacity style={styles.missionCard}>
            <View style={styles.missionIconContainer}>
              <Flame size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>Pray Fajr</Text>
              <View style={styles.missionMeta}>
                <Text style={styles.missionTime}>5:15 AM</Text>
                <View style={styles.dot} />
                <Text style={styles.missionXp}>+50 XP</Text>
              </View>
            </View>
            <View style={styles.missionCheck}>
              <CheckCircle2 size={24} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.missionCard}>
            <View
              style={[styles.missionIconContainer, { backgroundColor: "rgba(255, 219, 60, 0.1)" }]}
            >
              <BookOpen size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>Read 5 Ayahs</Text>
              <Text style={styles.missionSub}>
                Surah Al-Kahf • <Text style={styles.highlight}>+100 XP</Text>
              </Text>
              <View style={styles.missionProgressRow}>
                <ProgressBar progress={0.4} height={10} style={styles.missionProgress} />
                <Text style={styles.progressText}>2/5</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.missionCard}>
            <View
              style={[styles.missionIconContainer, { backgroundColor: "rgba(255, 177, 199, 0.1)" }]}
            >
              <GraduationCap size={24} color="#FFB1C7" />
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>Learn 1 Hadith</Text>
              <Text style={styles.missionSub}>
                Topic: Kindness • <Text style={styles.highlight}>+75 XP</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.leagueCard}>
          <View style={styles.leagueHeader}>
            <View style={styles.leagueBadge}>
              <View style={styles.leagueDot} />
              <Text style={styles.leagueBadgeText}>Emerald League</Text>
            </View>
            <View style={styles.leagueTimer}>
              <Text style={styles.timerLabel}>Ends In</Text>
              <Text style={styles.timerValue}>2d 14h</Text>
            </View>
          </View>
          <Text style={styles.leagueTitle}>Weekly Battle</Text>

          <View style={styles.leaderboard}>
            {[
              {
                rank: 1,
                name: "Usman K.",
                xp: "3,420 XP",
                initials: "UK",
                color: theme.colors.secondary,
              },
              {
                rank: 2,
                name: "Ahmed (You)",
                xp: "3,250 XP",
                initials: "AH",
                color: theme.colors.primary,
                active: true,
              },
              {
                rank: 3,
                name: "Sara A.",
                xp: "2,910 XP",
                initials: "SA",
                color: theme.colors.surfaceHigh,
              },
            ].map((user, i) => (
              <View
                key={i}
                style={[styles.leaderboardItem, user.active && styles.activeLeaderboardItem]}
              >
                <Text style={styles.rankText}>{user.rank}</Text>
                <View style={[styles.avatar, { backgroundColor: user.color }]}>
                  <Text style={styles.avatarText}>{user.initials}</Text>
                </View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userXp}>{user.xp}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.viewLeaderboard}>
            <Text style={styles.viewLeaderboardText}>View Full Leaderboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: "rgba(10, 10, 10, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(53, 53, 53, 0.3)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(42, 42, 42, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.3)",
    gap: 8,
  },
  xpText: {
    color: theme.colors.secondary,
    fontWeight: "700",
    fontSize: 14,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  streakCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.2)",
    marginBottom: 32,
  },
  streakHeader: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
  },
  streakSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "500",
    marginTop: 4,
  },
  highlight: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  daysContainer: {
    flexDirection: "row",
    gap: 10,
  },
  dayItem: {
    alignItems: "center",
  },
  dayBox: {
    width: 44,
    height: 56,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.onSecondary,
    opacity: 0.5,
    textTransform: "uppercase",
  },
  todayBox: {
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  todayLabel: {
    color: theme.colors.onPrimary,
    opacity: 1,
  },
  futureBox: {
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.2)",
  },
  emptyCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  streakCount: {
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: -2,
  },
  streakUnit: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(136, 217, 130, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  missionCount: {
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  missionCountText: {
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  missionList: {
    gap: 16,
    marginBottom: 32,
  },
  missionCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0, 0, 0, 0.4)",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  missionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "rgba(136, 217, 130, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(136, 217, 130, 0.2)",
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  missionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  missionTime: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outline,
  },
  missionXp: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  missionCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(136, 217, 130, 0.2)",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  missionSub: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  missionProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  missionProgress: {
    flex: 1,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primaryContainer,
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  leagueCard: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  leagueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  leagueBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  leagueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  leagueBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  leagueTimer: {
    alignItems: "flex-end",
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
  },
  timerValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
  },
  leagueTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 16,
  },
  leaderboard: {
    gap: 8,
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 12,
    gap: 12,
  },
  activeLeaderboardItem: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    transform: [{ scale: 1.03 }],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  rankText: {
    width: 24,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.6)",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.onSecondary,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  userXp: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.9)",
  },
  viewLeaderboard: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    alignItems: "center",
  },
  viewLeaderboardText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
})
