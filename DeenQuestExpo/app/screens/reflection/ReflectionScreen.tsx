import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Heart,
  BookOpen,
  Users,
  ChevronRight,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { theme } from "../../theme/themes";
import { TactileButton } from "../../components/TactileButton";

export const ReflectionScreen = () => {
  const [prayers, setPrayers] = useState({
    fajr: true,
    dhuhr: true,
    asr: false,
    maghrib: false,
    isha: false,
  });

  const [habits, setHabits] = useState({
    quran: true,
    helped: false,
    dhikr: true,
  });

  const togglePrayer = (key: keyof typeof prayers) => {
    setPrayers({ ...prayers, [key]: !prayers[key] });
  };

  const toggleHabit = (key: keyof typeof habits) => {
    setHabits({ ...habits, [key]: !habits[key] });
  };

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Daily Reflection</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.barakahBadge}>
              <Sparkles
                size={16}
                color={theme.colors.secondary}
                fill={theme.colors.secondary}
              />
              <Text style={styles.barakahText}>Barakah Score</Text>
            </View>
            <Text style={styles.dateText}>Saturday, 11 April</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>840</Text>
            <View style={styles.scoreTrend}>
              <Text style={styles.trendText}>+120 today</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "75%" }]} />
            </View>
            <Text style={styles.progressLabel}>75% of Daily Goal</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>The Five Prayers</Text>
            <Text style={styles.sectionSub}>Tap to mark as completed</Text>
          </View>
          <View style={styles.prayerGrid}>
            {(Object.keys(prayers) as Array<keyof typeof prayers>).map(
              (prayer) => (
                <TouchableOpacity
                  key={prayer}
                  style={[
                    styles.prayerCard,
                    prayers[prayer] && styles.activePrayerCard,
                  ]}
                  onPress={() => togglePrayer(prayer)}
                >
                  <Text
                    style={[
                      styles.prayerName,
                      prayers[prayer] && styles.activePrayerName,
                    ]}
                  >
                    {String(prayer).charAt(0).toUpperCase() +
                      String(prayer).slice(1)}
                  </Text>
                  {prayers[prayer] ? (
                    <CheckCircle2
                      size={24}
                      color={theme.colors.primary}
                      fill={theme.colors.primary}
                    />
                  ) : (
                    <Circle size={24} color={theme.colors.outline} />
                  )}
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spiritual Habits</Text>
          </View>
          <View style={styles.habitList}>
            <View style={styles.habitItem}>
              <View
                style={[
                  styles.habitIcon,
                  { backgroundColor: "rgba(255, 219, 60, 0.1)" },
                ]}
              >
                <BookOpen size={24} color={theme.colors.secondary} />
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>Read Quran</Text>
                <Text style={styles.habitSub}>Minimum 5 minutes</Text>
              </View>
              <Switch
                value={habits.quran}
                onValueChange={() => toggleHabit("quran")}
                trackColor={{
                  false: theme.colors.surfaceHigh,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  habits.quran ? theme.colors.text : theme.colors.textMuted
                }
              />
            </View>

            <View style={styles.habitItem}>
              <View
                style={[
                  styles.habitIcon,
                  { backgroundColor: "rgba(255, 177, 199, 0.1)" },
                ]}
              >
                <Heart size={24} color="#FFB1C7" />
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>Helped Someone</Text>
                <Text style={styles.habitSub}>A small act of kindness</Text>
              </View>
              <Switch
                value={habits.helped}
                onValueChange={() => toggleHabit("helped")}
                trackColor={{
                  false: theme.colors.surfaceHigh,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  habits.helped ? theme.colors.text : theme.colors.textMuted
                }
              />
            </View>

            <View style={styles.habitItem}>
              <View
                style={[
                  styles.habitIcon,
                  { backgroundColor: "rgba(136, 217, 130, 0.1)" },
                ]}
              >
                <Users size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>Morning Dhikr</Text>
                <Text style={styles.habitSub}>Remembrance of Allah</Text>
              </View>
              <Switch
                value={habits.dhikr}
                onValueChange={() => toggleHabit("dhikr")}
                trackColor={{
                  false: theme.colors.surfaceHigh,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  habits.dhikr ? theme.colors.text : theme.colors.textMuted
                }
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.journalCard}>
          <View style={styles.journalHeader}>
            <Text style={styles.journalTitle}>Gratitude Journal</Text>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.journalPrompt}>
            What are you grateful for today?
          </Text>
          <View style={styles.journalInputPlaceholder}>
            <Text style={styles.placeholderText}>
              Tap to write your reflection...
            </Text>
          </View>
        </TouchableOpacity>

        <TactileButton
          title="Save Reflection"
          onPress={() => {}}
          style={styles.saveButton}
        />
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
    backgroundColor: theme.colors.background,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
  },
  historyButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyButtonText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    fontSize: 14,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.outline,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  barakahBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 219, 60, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  barakahText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.secondary,
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -2,
  },
  scoreTrend: {
    backgroundColor: "rgba(136, 217, 130, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  prayerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  prayerCard: {
    width: "48%",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.1)",
  },
  activePrayerCard: {
    backgroundColor: "rgba(136, 217, 130, 0.05)",
    borderColor: "rgba(136, 217, 130, 0.2)",
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  activePrayerName: {
    color: theme.colors.primary,
  },
  habitList: {
    gap: 12,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  habitSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  journalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.1)",
    marginBottom: 32,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  journalPrompt: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  journalInputPlaceholder: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 8,
    height: 80,
  },
  placeholderText: {
    color: theme.colors.outline,
    fontSize: 14,
  },
  saveButton: {
    width: "100%",
  },
});
