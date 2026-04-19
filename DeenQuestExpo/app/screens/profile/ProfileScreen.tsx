import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  Flame,
  Settings,
  Trophy,
  Heart,
  Check,
  Star,
  Sparkles,
  Moon,
  HandHeart,
  Lock,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Header } from "../../components/Header";
import { TactileButton } from "../../components/TactileButton";

export function ProfileScreen() {
  const streakDays = ["M", "T", "W", "T", "F", "S", "S"];
  const completedDays = [false, false, true, true, true, "star", false];

  const achievements = [
    {
      icon: <Sparkles color="#FFDB3C" size={32} />,
      label: "First Khatm",
      locked: false,
    },
    {
      icon: <Moon color="#88D982" size={32} />,
      label: "Tahajjud Warrior",
      locked: false,
    },
    {
      icon: <HandHeart color="#F472B6" size={32} />,
      label: "Giver",
      locked: false,
    },
    { icon: <Lock color="#BFCABA" size={32} />, label: "???", locked: true },
  ];

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />
      <Header
        title="DEENQUEST"
        xp={1250}
        Icon={Settings}
        onSettingsPress={() => {}}
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
                source={{ uri: "https://picsum.photos/seed/siddiq/300/300" }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LEVEL 12</Text>
            </View>
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.name}>Siddiq</Text>
            <Text style={styles.title}>THE TRUTHFUL ONE</Text>
          </View>

          <View style={styles.buttonRow}>
            <TactileButton
              title="Edit Profile"
              onPress={() => {}}
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
              color="rgba(255,255,255,0.05)"
              size={80}
              style={styles.bgIcon}
            />
            <Text style={styles.statLabel}>GLOBAL RANK</Text>
            <Text style={[styles.statValue, { color: "#FFDB3C" }]}>#241</Text>
            <Text style={styles.statSubtext}>Top 2% Globally</Text>
          </View>

          <View style={styles.statCard}>
            <Heart
              color="rgba(255,255,255,0.05)"
              size={80}
              style={styles.bgIcon}
            />
            <Text style={styles.statLabel}>TOTAL HASANAT</Text>
            <Text style={styles.statValue}>14.2k</Text>
            <Text style={styles.statSubtext}>Points for good deeds</Text>
          </View>

          {/* Streak History */}
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View>
                <Text style={styles.sectionTitle}>Streak History</Text>
                <Text style={styles.sectionSubtext}>
                  Your consistency this month
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Flame color="#FFDB3C" fill="#FFDB3C" size={14} />
                <Text style={styles.streakBadgeText}>18 Days</Text>
              </View>
            </View>
            <View style={styles.daysGrid}>
              {streakDays.map((day, i) => (
                <View key={i} style={styles.dayColumn}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View
                    style={[
                      styles.dayBox,
                      completedDays[i] === true && styles.dayBoxActive,
                      completedDays[i] === "star" && styles.dayBoxStar,
                      !completedDays[i] && styles.dayBoxEmpty,
                    ]}
                  >
                    {completedDays[i] === true && (
                      <Check color="#003909" size={16} />
                    )}
                    {completedDays[i] === "star" && (
                      <Star color="#221B00" fill="#221B00" size={16} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Goal Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Progress</Text>
          <View style={styles.goalCardContainer}>
            <View style={[styles.goalCard, { borderLeftColor: "#88D982" }]}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalTitle}>Read 5 Pages Daily</Text>
                  <Text style={styles.goalSubtext}>The Quranic Journey</Text>
                </View>
                <Text style={[styles.goalPercent, { color: "#88D982" }]}>
                  80%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "80%", backgroundColor: "#88D982" },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.goalCard, { borderLeftColor: "#FFDB3C" }]}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalTitle}>Early Morning Dhikr</Text>
                  <Text style={styles.goalSubtext}>30 day challenge</Text>
                </View>
                <Text style={[styles.goalPercent, { color: "#FFDB3C" }]}>
                  12/30
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "40%", backgroundColor: "#FFDB3C" },
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
  scrollView: {
  },
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
    backgroundColor: "#88D982", // Simplified gradient for StyleSheet
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#131313",
  },
  levelBadge: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    backgroundColor: "#FFDB3C",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelText: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 10,
    color: "#221B00",
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
    color: "#FFFFFF",
  },
  title: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 12,
    color: "#88D982",
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
    backgroundColor: "#88D982",
    borderBottomColor: "#005312",
  },
  primaryButtonText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    color: "#003909",
  },
  secondaryButton: {
    backgroundColor: "#2A2A2A",
    borderBottomColor: "#000000",
  },
  buttonText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    color: "#E2E2E2",
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
    backgroundColor: "#1B1B1B",
    padding: 24,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.2)",
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
    color: "#BFCABA",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 36,
    color: "#FFFFFF",
  },
  statSubtext: {
    fontSize: 10,
    color: "#BFCABA",
    fontWeight: "700",
    marginTop: 8,
  },
  streakCard: {
    width: "100%",
    backgroundColor: "#1F1F1F",
    padding: 24,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.2)",
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
    color: "#FFFFFF",
  },
  sectionSubtext: {
    fontSize: 12,
    color: "#BFCABA",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 219, 60, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakBadgeText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 14,
    color: "#FFDB3C",
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
    color: "#BFCABA",
  },
  dayBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBoxActive: {
    backgroundColor: "#88D982",
  },
  dayBoxStar: {
    backgroundColor: "#FFDB3C",
  },
  dayBoxEmpty: {
    backgroundColor: "#2A2A2A",
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
    backgroundColor: "#1F1F1F",
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
    color: "#FFFFFF",
    fontSize: 16,
  },
  goalSubtext: {
    fontSize: 12,
    color: "#BFCABA",
  },
  goalPercent: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 16,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "#2A2A2A",
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
    color: "#88D982",
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
    backgroundColor: "#2A2A2A",
    borderColor: "#393939",
  },
  badgeLocked: {
    backgroundColor: "#131313",
    borderColor: "#2A2A2A",
    borderStyle: "dashed",
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: "#BFCABA",
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
    backgroundColor: "#131313",
    borderTopWidth: 4,
    borderTopColor: "#1F1F1F",
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navItemActive: {
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: "#88D982",
    paddingHorizontal: 16,
  },
  navLabel: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 10,
    color: "#E2E2E2",
    textTransform: "uppercase",
    marginTop: 4,
    opacity: 0.6,
  },
  navLabelActive: {
    color: "#88D982",
    opacity: 1,
  },
});
