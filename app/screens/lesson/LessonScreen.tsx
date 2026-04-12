import React from "react"
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native"
import {
  ChevronLeft,
  Play,
  Clock,
  Star,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Volume2,
} from "lucide-react-native"
import { ProgressBar } from "@/components/ProgressBar"
import { theme } from "@/theme/themes"
import { ScreenWrapper } from "@/components/ScreenWrapper"
import { TactileButton } from "@/components/TactileButton"

export const LessonScreen = ({ onBack }: { onBack: () => void }) => {
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ProgressBar progress={0.3} height={12} />
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0KUM9Libiyq9CVL_OQ56vXysNMfFF2vkAdutU1lTCGA07l7oM-zL2d-InVgAi1SO8rhzIzQ6SR6KVNGrLSEg2p8FYG7eJoIc5Ri6fRFqD_XgVMh57Edixloc2TGy05tLBGkapgj5igXd4BFwLSYgw9vGKOxvVLPXZBukwtp-34UckTpAYtasAcSiU_zj8GdUO-QI9e9m3p941BTJvOHEbPgmSGh5uhGh3XcyzQ2LsYqwENn5ibFhokiKaO6-oeBYgi5PcSyOSTYc",
              }}
              style={styles.heroImage}
            />
            <View style={styles.playOverlay}>
              <Play size={32} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>Foundations</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.textMuted} />
              <Text style={styles.metaText}>12 min</Text>
            </View>
            <View style={styles.metaItem}>
              <Star size={14} color={theme.colors.secondary} fill={theme.colors.secondary} />
              <Text style={styles.metaText}>+150 XP</Text>
            </View>
          </View>

          <Text style={styles.title}>The Foundations of Prayer</Text>
          <Text style={styles.description}>
            Learn the essential spiritual and physical components that make your Salah valid and
            meaningful.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you'll learn</Text>
          <View style={styles.learningGoals}>
            {[
              "The 13 pillars of Salah",
              "Correct postural alignment",
              "Spiritual presence (Khushu')",
              "Common mistakes to avoid",
            ].map((goal, i) => (
              <View key={i} style={styles.goalItem}>
                <CheckCircle2 size={20} color={theme.colors.primary} />
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>Lesson Steps</Text>
          <View style={styles.stepList}>
            <TouchableOpacity style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>01</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Intention & Takbir</Text>
                <Text style={styles.stepSub}>Setting the sacred space</Text>
              </View>
              <CheckCircle2 size={24} color={theme.colors.primary} fill={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.stepCard, styles.activeStepCard]}>
              <View style={[styles.stepNumber, styles.activeStepNumber]}>
                <Text style={styles.activeStepNumberText}>02</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>The Stand (Qiyam)</Text>
                <Text style={styles.stepSub}>Recitation of Al-Fatihah</Text>
              </View>
              <Play size={24} color={theme.colors.primary} fill={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>03</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>The Bow (Ruku')</Text>
                <Text style={styles.stepSub}>Physical and spiritual focus</Text>
              </View>
              <ArrowRight size={24} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.interactivePreview}>
          <View style={styles.previewHeader}>
            <Volume2 size={24} color={theme.colors.secondary} />
            <Text style={styles.previewTitle}>Audio Breakdown</Text>
          </View>
          <Text style={styles.previewText}>
            Listen to the correct pronunciation of the opening Takbir with phonetic highlights.
          </Text>
          <TouchableOpacity style={styles.previewButton}>
            <Text style={styles.previewButtonText}>Preview Audio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TactileButton title="Continue Lesson" onPress={() => {}} style={styles.continueButton} />
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButtonText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 18,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
  },
  heroSection: {
    marginBottom: 32,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: "rgba(136, 217, 130, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(136, 217, 130, 0.2)",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  learningGoals: {
    gap: 12,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
  },
  curriculumSection: {
    marginBottom: 32,
  },
  stepList: {
    gap: 12,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.1)",
  },
  activeStepCard: {
    backgroundColor: theme.colors.surface,
    borderColor: "rgba(136, 217, 130, 0.2)",
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primary,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  activeStepNumber: {
    backgroundColor: theme.colors.primary,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.textMuted,
  },
  activeStepNumberText: {
    color: theme.colors.onPrimary,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  stepSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  interactivePreview: {
    backgroundColor: "rgba(255, 219, 60, 0.05)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 219, 60, 0.1)",
    marginBottom: 32,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.secondary,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  previewButton: {
    backgroundColor: theme.colors.surfaceHigh,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: "rgba(19, 19, 19, 0.8)",
  },
  continueButton: {
    width: "100%",
  },
})
