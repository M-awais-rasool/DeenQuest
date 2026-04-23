import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import {
  Flame,
  Settings,
  Trophy,
  Heart,
  Check,
  Sparkles,
  Moon,
  HandHeart,
  Lock,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Header } from "../../components/Header";
import { TactileButton } from "../../components/TactileButton";
import { theme } from "../../theme/themes";
import {
  useGetProfileQuery,
  useGetProgressQuery,
} from "../../store/services/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function ProfileScreen() {
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const { data: progressData, isLoading: progressLoading } =
    useGetProgressQuery();
  const navigation = useNavigation<Nav>();

  const profile = profileData?.data;
  const progress = progressData?.data;

  const weeklyCompletions = progress?.weekly_completions ?? [];
  const streakDays = ["M", "T", "W", "T", "F", "S", "S"];

  const achievements = [
    {
      icon: <Sparkles color={theme.colors.secondary} size={32} />,
      label: "First Khatm",
      locked: false,
    },
    {
      icon: <Moon color={theme.colors.primary} size={32} />,
      label: "Tahajjud Warrior",
      locked: false,
    },
    {
      icon: <HandHeart color={theme.colors.magenta} size={32} />,
      label: "Giver",
      locked: false,
    },
    {
      icon: <Lock color={theme.colors.textMuted} size={32} />,
      label: "???",
      locked: true,
    },
  ];

  if (profileLoading || progressLoading) {
    return (
      <ScreenWrapper>
        <StatusBar barStyle="light-content" />
        <Header title="DEENQUEST" xp={0} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const displayName =
    profile?.display_name || profile?.email?.split("@")[0] || "Explorer";
  const userTitle = profile?.title || "SEEKER OF KNOWLEDGE";
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const barakahScore = progress?.barakah_score ?? 0;

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />
      <Header
        title="DEENQUEST"
        xp={totalXP}
        Icon={Settings}
        onSettingsPress={() => navigation.navigate("Settings")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGradient}>
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=88D982&color=003909&size=300`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LEVEL {level}</Text>
            </View>
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.title}>{userTitle.toUpperCase()}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TactileButton
              title="Edit Profile"
              onPress={() => navigation.navigate("EditProfile")}
              style={styles.secondaryButton}
              textStyle={styles.buttonText}
            />
            <TactileButton
              title="Share Stats"
              onPress={() => {}}
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
          </View>
        </View>

        {/* Bento Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Trophy
              color={theme.colors.white05}
              size={80}
              style={styles.bgIcon}
            />
            <Text style={styles.statLabel}>TOTAL XP</Text>
            <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
              {totalXP >= 1000 ? `${(totalXP / 1000).toFixed(1)}k` : totalXP}
            </Text>
            <Text style={styles.statSubtext}>Level {level}</Text>
          </View>

          <View style={styles.statCard}>
            <Heart
              color={theme.colors.white05}
              size={80}
              style={styles.bgIcon}
            />
            <Text style={styles.statLabel}>BARAKAH SCORE</Text>
            <Text style={styles.statValue}>
              {barakahScore >= 1000
                ? `${(barakahScore / 1000).toFixed(1)}k`
                : barakahScore}
            </Text>
            <Text style={styles.statSubtext}>Points for good deeds</Text>
          </View>

          {/* Streak History */}
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View>
                <Text style={styles.sectionTitle}>Streak History</Text>
                <Text style={styles.sectionSubtext}>
                  Your consistency this week
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Flame
                  color={theme.colors.secondary}
                  fill={theme.colors.secondary}
                  size={14}
                />
                <Text style={styles.streakBadgeText}>{currentStreak} Days</Text>
              </View>
            </View>
            <View style={styles.daysGrid}>
              {streakDays.map((day, i) => {
                const isCompleted = weeklyCompletions[i] === true;
                return (
                  <View key={i} style={styles.dayColumn}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <View
                      style={[
                        styles.dayBox,
                        isCompleted ? styles.dayBoxActive : styles.dayBoxEmpty,
                      ]}
                    >
                      {isCompleted && (
                        <Check color={theme.colors.onPrimary} size={16} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Goal Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Progress</Text>
          <View style={styles.goalCardContainer}>
            <View style={[styles.goalCard, { borderLeftColor: theme.colors.primary }]}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalTitle}>Read 5 Pages Daily</Text>
                  <Text style={styles.goalSubtext}>The Quranic Journey</Text>
                </View>
                <Text style={[styles.goalPercent, { color: theme.colors.primary }]}>
                  80%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "80%", backgroundColor: theme.colors.primary },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.goalCard, { borderLeftColor: theme.colors.secondary }]}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalTitle}>Early Morning Dhikr</Text>
                  <Text style={styles.goalSubtext}>30 day challenge</Text>
                </View>
                <Text style={[styles.goalPercent, { color: theme.colors.secondary }]}>
                  12/30
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "40%", backgroundColor: theme.colors.secondary },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgeScroll}
        >
          {achievements.map((ach, i) => (
            <View
              key={i}
              style={[styles.badgeItem, ach.locked && { opacity: 0.3 }]}
            >
              <View
                style={[
                  styles.badgeIconContainer,
                  ach.locked ? styles.badgeLocked : styles.badgeUnlocked,
                ]}
              >
                {ach.icon}
              </View>
              <Text style={styles.badgeLabel}>{ach.label}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {},
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 50,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradient: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    backgroundColor: theme.colors.primary, // Simplified gradient for StyleSheet
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  levelBadge: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelText: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 10,
    color: theme.colors.onSecondary,
    letterSpacing: 1,
  },
  nameContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  name: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 32,
    color: theme.colors.white,
  },
  title: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 12,
    color: theme.colors.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderBottomWidth: 4,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.shadowGreen,
  },
  primaryButtonText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceHigh,
    borderBottomColor: theme.colors.black,
  },
  buttonText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
  },
  bgIcon: {
    position: "absolute",
    right: -16,
    top: -16,
  },
  statLabel: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 36,
    color: theme.colors.white,
  },
  statSubtext: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginTop: 8,
  },
  streakCard: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 18,
    color: theme.colors.white,
  },
  sectionSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakBadgeText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 14,
    color: theme.colors.secondary,
    marginLeft: 6,
  },
  daysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  dayBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBoxActive: {
    backgroundColor: theme.colors.primary,
  },
  dayBoxStar: {
    backgroundColor: theme.colors.secondary,
  },
  dayBoxEmpty: {
    backgroundColor: theme.colors.surfaceHigh,
    opacity: 0.4,
  },
  section: {
    marginBottom: 32,
  },
  goalCardContainer: {
    marginTop: 16,
    gap: 12,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalTitle: {
    fontWeight: "700",
    color: theme.colors.white,
    fontSize: 16,
  },
  goalSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  goalPercent: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 16,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  badgeScroll: {
    marginTop: 16,
  },
  badgeItem: {
    width: 80,
    alignItems: "center",
    marginRight: 16,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 8,
  },
  badgeUnlocked: {
    backgroundColor: theme.colors.surfaceHigh,
    borderColor: theme.colors.surfaceBright,
  },
  badgeLocked: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.surfaceHigh,
    borderStyle: "dashed",
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.textMuted,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: theme.colors.background,
    borderTopWidth: 4,
    borderTopColor: theme.colors.surface,
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navItemActive: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primary,
    paddingHorizontal: 16,
  },
  navLabel: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 10,
    color: theme.colors.text,
    textTransform: "uppercase",
    marginTop: 4,
    opacity: 0.6,
  },
  navLabelActive: {
    color: theme.colors.primary,
    opacity: 1,
  },
});
