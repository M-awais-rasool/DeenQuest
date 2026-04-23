import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Search,
  Flame,
  Verified,
  BookOpen,
  Lock,
  Play,
  Bookmark,
} from "lucide-react-native";
import { theme } from "../../theme/themes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { ProgressBar } from "../../components/ProgressBar";

const SURAHS = [
  {
    id: 1,
    name: "Al-Fatihah",
    meaning: "The Opening",
    arabic: "الفاتحة",
    ayahs: 7,
    progress: 1,
    status: "completed",
  },
  {
    id: 2,
    name: "Al-Baqarah",
    meaning: "The Cow",
    arabic: "البقرة",
    ayahs: 286,
    progress: 0.42,
    status: "in-progress",
  },
  {
    id: 3,
    name: "Ali 'Imran",
    meaning: "Family of Imran",
    arabic: "آل عمران",
    ayahs: 200,
    progress: 0,
    status: "locked",
  },
  {
    id: 18,
    name: "Al-Kahf",
    meaning: "The Cave",
    arabic: "الكهف",
    ayahs: 110,
    progress: 0.85,
    status: "in-progress",
  },
  {
    id: 112,
    name: "Al-Ikhlas",
    meaning: "Sincerity",
    arabic: "الإخلاص",
    ayahs: 4,
    progress: 1,
    status: "completed",
  },
  {
    id: 36,
    name: "Ya-Sin",
    meaning: "Ya Sin",
    arabic: "يس",
    ayahs: 83,
    progress: 0,
    status: "locked",
  },
];

export const QuranScreen = () => {
  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <View style={styles.userRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnFFsBOK8cJR2UQ7LBwRoEnpC7zMcWL4UnvCGjyXyg94e9y70mr42YSNUkuXwoJKHMdGvNE5kmmNa4yZacrNENLoNsqfHTX9yG43WzjY_JNUX-mSxLD__IBFvZCNmRhV89jxEcwnABdaSkFvp3X3L9VqdPUsAmW_7ydPmfu2jxODG25JHLx0OCY3MHCYHPOIzaEYGZ8Imm5hjdMC_55sttCXAlBv-aPJNzIPWfSPzrH9kWY0saCj6evfStRz0qkkNXYmFikEss-Zs",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.logoText}>DeenQuest</Text>
        </View>
        <View style={styles.streakBadge}>
          <Flame
            size={20}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
          <Text style={styles.streakText}>12</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchSection}>
          <View style={styles.searchWrapper}>
            <Search
              size={20}
              color={theme.colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Surah by name or number..."
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, styles.activeFilterChip]}
            >
              <Text
                style={[styles.filterChipText, styles.activeFilterChipText]}
              >
                All Surahs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Juz'</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Bookmarked</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.surahGrid}>
          {SURAHS.map((surah) => (
            <TouchableOpacity
              key={surah.id}
              style={[
                styles.surahCard,
                surah.status === "locked" && styles.lockedSurahCard,
              ]}
            >
              {surah.status === "completed" && (
                <View style={styles.statusIcon}>
                  <Verified
                    size={20}
                    color={theme.colors.primary}
                    fill={theme.colors.primary}
                  />
                </View>
              )}
              {surah.status === "locked" && (
                <View style={styles.statusIcon}>
                  <Lock size={20} color={theme.colors.textMuted} />
                </View>
              )}
              {surah.status === "in-progress" && (
                <View style={styles.statusIcon}>
                  <BookOpen
                    size={20}
                    color={theme.colors.secondary}
                    fill={theme.colors.secondary}
                  />
                </View>
              )}

              <View style={styles.surahHeader}>
                <View style={styles.surahInfo}>
                  <View
                    style={[
                      styles.surahNumber,
                      surah.status === "completed"
                        ? styles.completedNumber
                        : styles.defaultNumber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.surahNumberText,
                        surah.status === "completed"
                          ? styles.completedNumberText
                          : styles.defaultNumberText,
                      ]}
                    >
                      {surah.id}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.surahName}>{surah.name}</Text>
                    <Text style={styles.surahMeaning}>{surah.meaning}</Text>
                  </View>
                </View>
                <View style={styles.arabicSection}>
                  <Text
                    style={[
                      styles.arabicText,
                      surah.status === "completed"
                        ? styles.completedArabic
                        : styles.defaultArabic,
                    ]}
                  >
                    {surah.arabic}
                  </Text>
                  <Text style={styles.ayahCount}>{surah.ayahs} Ayahs</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text
                    style={[
                      styles.statusLabel,
                      {
                        color:
                          surah.status === "completed"
                            ? theme.colors.primary
                            : surah.status === "in-progress"
                              ? theme.colors.secondary
                              : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {surah.status === "completed"
                      ? "Completed"
                      : surah.status === "in-progress"
                        ? "In Progress"
                        : "Locked"}
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round(surah.progress * 100)}%
                  </Text>
                </View>
                <ProgressBar
                  progress={surah.progress}
                  color={
                    surah.status === "completed"
                      ? theme.colors.primary
                      : surah.status === "in-progress"
                        ? theme.colors.secondary
                        : theme.colors.textMuted20
                  }
                  height={8}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.featuredSection}>
          <TouchableOpacity style={styles.reflectionCard}>
            <View style={styles.reflectionBadge}>
              <Text style={styles.reflectionBadgeText}>Daily Reflection</Text>
            </View>
            <Text style={styles.reflectionTitle}>Surah Ar-Rahman</Text>
            <Text style={styles.reflectionSub}>
              "Then which of the favors of your Lord will you deny?" Explore the
              beauty of creation.
            </Text>
            <TouchableOpacity style={styles.startRecitation}>
              <Text style={styles.startRecitationText}>START RECITATION</Text>
              <Play
                size={20}
                color={theme.colors.onPrimary}
                fill={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.statsCard}>
            <View style={styles.statsBadge}>
              <Text style={styles.statsBadgeText}>Journey Stats</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Memorized</Text>
                <Text style={styles.statValue}>12 Surahs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Weekly Goal</Text>
                <Text style={styles.statValue}>85%</Text>
              </View>
            </View>
            <View style={styles.statsTip}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Keep going! You're 3 ayahs away from completing Al-Baqarah's
                current section.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.bookmarkFab}>
        <Bookmark
          size={24}
          color={theme.colors.onSecondary}
          fill={theme.colors.onSecondary}
        />
      </TouchableOpacity>
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
    backgroundColor: theme.colors.background60,
    zIndex: 100,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.outline20,
    gap: 4,
  },
  streakText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 120,
    paddingHorizontal: theme.spacing.lg,
  },
  searchSection: {
    marginBottom: 40,
  },
  searchWrapper: {
    position: "relative",
    marginBottom: 24,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: theme.colors.surfaceLow,
    color: theme.colors.text,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    fontWeight: "500",
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.outline,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceHigh,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary20,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  activeFilterChipText: {
    color: theme.colors.primary,
  },
  surahGrid: {
    gap: 24,
  },
  surahCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.outline10,
  },
  lockedSurahCard: {
    opacity: 0.8,
  },
  statusIcon: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  surahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  surahInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  defaultNumber: {
    backgroundColor: theme.colors.surfaceHigh,
  },
  completedNumber: {
    backgroundColor: theme.colors.primaryContainer,
  },
  surahNumberText: {
    fontSize: 16,
    fontWeight: "900",
  },
  defaultNumberText: {
    color: theme.colors.primary,
  },
  completedNumberText: {
    color: theme.colors.text,
  },
  surahName: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  surahMeaning: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  arabicSection: {
    alignItems: "flex-end",
  },
  arabicText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  defaultArabic: {
    color: theme.colors.text,
  },
  completedArabic: {
    color: theme.colors.primary,
  },
  ayahCount: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
  },
  featuredSection: {
    marginTop: 48,
    gap: 24,
  },
  reflectionCard: {
    backgroundColor: theme.colors.primaryContainer10,
    borderRadius: theme.borderRadius.md,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.colors.primary20,
  },
  reflectionBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  reflectionBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reflectionTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 12,
  },
  reflectionSub: {
    fontSize: 16,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  startRecitation: {
    marginTop: 32,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "flex-start",
    shadowColor: theme.colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  startRecitationText: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.onPrimary,
  },
  statsCard: {
    backgroundColor: theme.colors.secondary10,
    borderRadius: theme.borderRadius.md,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.colors.secondary20,
  },
  statsBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  statsBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.onSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colors.surface60,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.secondary,
    marginTop: 4,
  },
  statsTip: {
    marginTop: 24,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline10,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  tipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
    flex: 1,
  },
  bookmarkFab: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
