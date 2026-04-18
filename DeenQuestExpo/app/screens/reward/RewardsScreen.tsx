import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Trophy,
  Star,
  Lock,
  Verified,
  Flame,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";
import { theme } from "../../theme/themes";
import { ScreenWrapper } from "../../components/ScreenWrapper";

const TROPHIES = [
  {
    id: 1,
    title: "First Prayer",
    description: "Completed your first prayer mission",
    icon: "🕌",
    status: "unlocked",
    date: "12 Mar 2026",
  },
  {
    id: 2,
    title: "7-Day Streak",
    description: "Maintained a streak for 7 days",
    icon: "🔥",
    status: "unlocked",
    date: "19 Mar 2026",
  },
  {
    id: 3,
    title: "Quran Explorer",
    description: "Read 5 different Surahs",
    icon: "📖",
    status: "unlocked",
    date: "05 Apr 2026",
  },
  {
    id: 4,
    title: "Early Bird",
    description: "Prayed Fajr on time for 3 days",
    icon: "🌅",
    status: "locked",
    progress: 0.66,
  },
  {
    id: 5,
    title: "Charity Master",
    description: "Helped someone 10 times",
    icon: "🤝",
    status: "locked",
    progress: 0.3,
  },
  {
    id: 6,
    title: "Knowledge Seeker",
    description: "Completed 5 Islamic lessons",
    icon: "🎓",
    status: "locked",
    progress: 0.8,
  },
];

export const RewardsScreen = () => {
  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Your Trophies</Text>
        <View style={styles.xpBadge}>
          <Star
            size={16}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
          <Text style={styles.xpText}>1,250</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.featuredTrophy}>
          <View style={styles.trophyGlow} />
          <View style={styles.trophyIconContainer}>
            <Trophy
              size={64}
              color={theme.colors.secondary}
              fill={theme.colors.secondary}
            />
          </View>
          <Text style={styles.featuredTitle}>Master of Consistency</Text>
          <Text style={styles.featuredSub}>
            You're in the top 5% of users this month!
          </Text>
          <View style={styles.featuredStats}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>12</Text>
              <Text style={styles.statLab}>Unlocked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>45</Text>
              <Text style={styles.statLab}>Total</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trophyGrid}>
            {TROPHIES.map((trophy) => (
              <TouchableOpacity
                key={trophy.id}
                style={[
                  styles.trophyCard,
                  trophy.status === "locked" && styles.lockedCard,
                ]}
              >
                <View style={styles.trophyHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      trophy.status === "unlocked"
                        ? styles.unlockedCircle
                        : styles.lockedCircle,
                    ]}
                  >
                    <Text style={styles.emojiIcon}>{trophy.icon}</Text>
                  </View>
                  {trophy.status === "unlocked" ? (
                    <Verified
                      size={20}
                      color={theme.colors.primary}
                      fill={theme.colors.primary}
                    />
                  ) : (
                    <Lock size={20} color={theme.colors.textMuted} />
                  )}
                </View>
                <Text style={styles.trophyTitle}>{trophy.title}</Text>
                <Text style={styles.trophyDesc} numberOfLines={2}>
                  {trophy.description}
                </Text>

                {trophy.status === "unlocked" ? (
                  <Text style={styles.unlockedDate}>{trophy.date}</Text>
                ) : (
                  <View style={styles.progressRow}>
                    <View style={styles.miniProgressBar}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          { width: `${(trophy.progress || 0) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.miniProgressText}>
                      {Math.round((trophy.progress || 0) * 100)}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.rewardsShop}>
          <View style={styles.shopHeader}>
            <Sparkles size={24} color={theme.colors.secondary} />
            <Text style={styles.shopTitle}>Rewards Shop</Text>
          </View>
          <TouchableOpacity style={styles.shopCard}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0KUM9Libiyq9CVL_OQ56vXysNMfFF2vkAdutU1lTCGA07l7oM-zL2d-InVgAi1SO8rhzIzQ6SR6KVNGrLSEg2p8FYG7eJoIc5Ri6fRFqD_XgVMh57Edixloc2TGy05tLBGkapgj5igXd4BFwLSYgw9vGKOxvVLPXZBukwtp-34UckTpAYtasAcSiU_zj8GdUO-QI9e9m3p941BTJvOHEbPgmSGh5uhGh3XcyzQ2LsYqwENn5ibFhokiKaO6-oeBYgi5PcSyOSTYc",
              }}
              style={styles.shopItemImage}
            />
            <View style={styles.shopItemInfo}>
              <Text style={styles.shopItemTitle}>Exclusive Avatar Frame</Text>
              <Text style={styles.shopItemPrice}>500 XP</Text>
            </View>
            <TouchableOpacity style={styles.buyButton}>
              <Text style={styles.buyButtonText}>Unlock</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.2)",
  },
  xpText: {
    color: theme.colors.secondary,
    fontWeight: "900",
    fontSize: 14,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
  },
  featuredTrophy: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.borderRadius.xl,
    padding: 32,
    alignItems: "center",
    marginBottom: 40,
    overflow: "hidden",
  },
  trophyGlow: {
    position: "absolute",
    top: -50,
    width: 200,
    height: 200,
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
    opacity: 0.2,
    filter: "blur(40px)",
  },
  trophyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
  },
  featuredSub: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 24,
  },
  featuredStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 16,
    gap: 24,
  },
  statBox: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.secondary,
  },
  statLab: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  viewAll: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  trophyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  trophyCard: {
    width: "47.5%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.outline,
  },
  lockedCard: {
    opacity: 0.6,
  },
  trophyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockedCircle: {
    backgroundColor: "rgba(136, 217, 130, 0.1)",
  },
  lockedCircle: {
    backgroundColor: theme.colors.surfaceHigh,
  },
  emojiIcon: {
    fontSize: 24,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  trophyDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  unlockedDate: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.primary,
    textTransform: "uppercase",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 3,
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: 3,
  },
  miniProgressText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.textMuted,
  },
  rewardsShop: {
    marginTop: 16,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  shopTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.1)",
  },
  shopItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  shopItemInfo: {
    flex: 1,
  },
  shopItemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  shopItemPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.secondary,
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
  },
});
