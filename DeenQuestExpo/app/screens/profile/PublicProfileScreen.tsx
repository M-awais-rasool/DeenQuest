import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import { AnimatedPressable } from "../../components/ui";
import { ArrowLeft, Flame, Trophy, Heart } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import {
  useGetPublicProfileQuery,
  useGetPublicProgressQuery,
} from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "PublicProfile">;

export function PublicProfileScreen({ navigation, route }: Props) {
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("Demo", { screen: "ProfileScreen" });
    }
  };
  const { userId } = route.params;

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetPublicProfileQuery(userId);

  const { data: progressData, isLoading: progressLoading } =
    useGetPublicProgressQuery(userId);

  const isLoading = profileLoading || progressLoading;
  const profile = profileData?.data;
  const progress = progressData?.data;

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  if (profileError || !profile) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => {
              handleBack();
            }}
            style={styles.backButton}
          >
            <ArrowLeft color={theme.colors.text} size={24} />
          </AnimatedPressable>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const displayName = profile.display_name || "Explorer";
  const userTitle = (profile.title || "SEEKER OF KNOWLEDGE").toUpperCase();
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const barakahScore = progress?.barakah_score ?? 0;

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => {
            handleBack();
          }}
          style={styles.backButton}
        >
          <ArrowLeft color={theme.colors.text} size={24} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGradient}>
              <Image
                source={{
                  uri:
                    profile.avatar_url ||
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
            <Text style={styles.title}>{userTitle}</Text>
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        {/* Stats grid */}
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

          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View>
                <Text style={styles.sectionTitle}>Current Streak</Text>
                <Text style={styles.sectionSubtext}>Days of consistency</Text>
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
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.surfaceLow,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontFamily: "Nunito_600SemiBold",
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
    backgroundColor: theme.colors.primary,
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
  },
  levelText: {
    fontFamily: "Nunito_900Black",
    fontSize: 10,
    color: theme.colors.onSecondary,
    letterSpacing: 1,
  },
  nameContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  name: {
    fontFamily: "Nunito_700Bold",
    fontSize: 32,
    color: theme.colors.white,
  },
  title: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: theme.colors.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  bio: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
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
    fontFamily: "Nunito_700Bold",
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Nunito_900Black",
    fontSize: 36,
    color: theme.colors.white,
  },
  statSubtext: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: "Nunito_700Bold",
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
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
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
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: theme.colors.secondary,
    marginLeft: 6,
  },
});
