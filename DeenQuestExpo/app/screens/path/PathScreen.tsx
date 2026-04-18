import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Flame,
  Building,
  Lock,
  Book,
  Heart,
  Sparkles,
  Bolt,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Header } from "../../components/Header";
import { theme } from "../../theme/themes";

export const PathScreen = () => {
  return (
    <ScreenWrapper>
      <Header title="The Path of Light" xp={1250} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>The Path of Light</Text>
          <Text style={styles.subtitle}>Progress your journey to mastery</Text>
        </View>

        <View style={styles.pathContainer}>
          {/* Path Connector Line */}
          <View style={styles.connector} />

          {/* Level 1: Active */}
          <View
            style={[styles.nodeContainer, { transform: [{ translateX: -48 }] }]}
          >
            <View style={styles.nodeHeader}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
              <Text style={styles.nodeTitle}>Intro to Salah</Text>
            </View>
            <TouchableOpacity style={styles.activeNode} onPress={() => {}}>
              <Building
                size={40}
                color={theme.colors.onPrimary}
                fill={theme.colors.onPrimary}
              />
              {/* Progress Ring Simulation */}
              <View style={styles.progressRing} />
            </TouchableOpacity>
          </View>

          {/* Level 2: Locked */}
          <View
            style={[styles.nodeContainer, { transform: [{ translateX: 64 }] }]}
          >
            <Text style={styles.lockedNodeTitle}>Basic Quran Reading</Text>
            <View style={styles.lockedNode}>
              <Lock size={32} color={theme.colors.textMuted} />
              <View style={styles.lockedIconBadge}>
                <Book
                  size={14}
                  color={theme.colors.onSecondary}
                  fill={theme.colors.onSecondary}
                />
              </View>
            </View>
          </View>

          {/* Level 3: Locked */}
          <View
            style={[styles.nodeContainer, { transform: [{ translateX: -40 }] }]}
          >
            <Text style={styles.lockedNodeTitle}>Character & Akhlaq</Text>
            <View style={styles.lockedNode}>
              <Lock size={32} color={theme.colors.textMuted} />
              <View style={styles.lockedIconBadge}>
                <Heart
                  size={14}
                  color={theme.colors.onSecondary}
                  fill={theme.colors.onSecondary}
                />
              </View>
            </View>
          </View>

          {/* Level 4: Locked */}
          <View
            style={[styles.nodeContainer, { transform: [{ translateX: 64 }] }]}
          >
            <Text style={styles.lockedNodeTitle}>Daily Duas</Text>
            <View style={styles.lockedNode}>
              <Lock size={32} color={theme.colors.textMuted} />
              <View style={styles.lockedIconBadge}>
                <Sparkles
                  size={14}
                  color={theme.colors.onSecondary}
                  fill={theme.colors.onSecondary}
                />
              </View>
            </View>
          </View>

          {/* Horizon Card */}
          <View style={styles.horizonCard}>
            <View style={styles.horizonInfo}>
              <Text style={styles.horizonTitle}>The Horizon</Text>
              <Text style={styles.horizonSub}>
                Complete your current level to unlock deeper knowledge and
                exclusive rewards.
              </Text>
              <View style={styles.horizonProgressContainer}>
                <View style={styles.horizonProgressFill} />
              </View>
            </View>
            <View style={styles.horizonImageContainer}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCektHm_suk9N9kP0L20TXE4pb3U3mea6bayeMfULjpMUNVqfgMXVOf4OrHJQ8_OV1cUVIZORhJC-wGOHv1WrBUzdD1Iuk5p_aMy6iQPKl_cwsmFrUeOYHeu0ERuSB5cxR4SCQhjj4jy-8ujhmStgadUpeqLy5YKkf29d2WaHHtlwyUvA4ffcekkgSWfKEM7ylEnd9oI3j5YwiXRbRsw_QTqXBbwrGJjWaHYFeYtrrOTDzTeUQPovLRlqaAF5xdk-Qxm6vVjQgojzw",
                }}
                style={styles.horizonImage}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Bolt
          size={32}
          color={theme.colors.onSecondary}
          fill={theme.colors.onSecondary}
        />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  pathContainer: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  connector: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: theme.colors.surfaceHigh,
    opacity: 0.2,
    borderRadius: 6,
  },
  nodeContainer: {
    alignItems: "center",
    marginBottom: 80,
    zIndex: 10,
  },
  nodeHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  activeBadge: {
    backgroundColor: "rgba(136, 217, 130, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(136, 217, 130, 0.2)",
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  nodeTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    marginTop: 8,
  },
  activeNode: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#005312",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  progressRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 64,
    borderWidth: 8,
    borderColor: "rgba(136, 217, 130, 0.2)",
  },
  lockedNodeTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
  lockedNode: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfaceHigh,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
    shadowColor: "#1B1B1B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderWidth: 4,
    borderColor: "rgba(27, 27, 27, 0.5)",
  },
  lockedIconBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  horizonCard: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.outline,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 48,
  },
  horizonInfo: {
    flex: 1,
  },
  horizonTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 8,
  },
  horizonSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  horizonProgressContainer: {
    height: 12,
    backgroundColor: "rgba(136, 217, 130, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(136, 217, 130, 0.2)",
  },
  horizonProgressFill: {
    width: "33%",
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  horizonImageContainer: {
    width: 96,
    height: 96,
  },
  horizonImage: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.md,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#544600",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    zIndex: 100,
  },
});
