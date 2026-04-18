import React, { useCallback, useEffect, useMemo, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import {
  Lock,
  Star,
  Trophy,
  ChevronRight,
  Gift,
  Sparkles,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "../../theme/themes";
import {
  useGetLevelsQuery,
  useGetProgressQuery,
} from "../../store/services/api";
import type { LevelWithStatus, LevelStatus } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NODE_SIZE = 64;

/* ─── S-curve offsets: smooth wave pattern ─── */
function getNodeOffset(index: number): number {
  const amplitude = SCREEN_WIDTH * 0.22;
  return Math.sin((index * Math.PI) / 3) * amplitude;
}

const STATUS_CONFIG: Record<
  LevelStatus,
  { bg: string; border: string; iconColor: string; glow: boolean }
> = {
  locked: {
    bg: theme.colors.surfaceHigh,
    border: theme.colors.outline,
    iconColor: theme.colors.textMuted,
    glow: false,
  },
  available: {
    bg: theme.colors.primaryContainer,
    border: theme.colors.primary,
    iconColor: "#fff",
    glow: true,
  },
  in_progress: {
    bg: "rgba(136, 217, 130, 0.25)",
    border: theme.colors.primary,
    iconColor: theme.colors.primary,
    glow: true,
  },
  completed: {
    bg: "rgba(136, 217, 130, 0.12)",
    border: "rgba(136, 217, 130, 0.5)",
    iconColor: theme.colors.primary,
    glow: false,
  },
};

/* ─── Stars Row (memoized) ─── */
const StarsDisplay = memo(function StarsDisplay({
  stars,
  size = 13,
}: {
  stars: number;
  size?: number;
}) {
  return (
    <View style={s.starsRow}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= stars ? theme.colors.secondary : theme.colors.outline}
          fill={i <= stars ? theme.colors.secondary : "transparent"}
        />
      ))}
    </View>
  );
});

/* ─── Treasure badge ─── */
const TreasureBadge = memo(function TreasureBadge({
  levelId,
}: {
  levelId: number;
}) {
  if (levelId % 5 !== 0) return null;
  return (
    <View style={s.treasureBadge}>
      <Gift size={12} color={theme.colors.secondary} />
    </View>
  );
});

/* ─── Animated Level Node ─── */
const LevelNode = memo(function LevelNode({
  level,
  index,
  onPress,
}: {
  level: LevelWithStatus;
  index: number;
  onPress: () => void;
}) {
  const config = STATUS_CONFIG[level.status];
  const isLocked = level.status === "locked";
  const isAvailable = level.status === "available";

  // Entrance animation: staggered fade + slide up
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  // Pulse animation for available node
  useEffect(() => {
    if (!isAvailable) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isAvailable, pulseAnim]);

  const handlePressIn = useCallback(() => {
    if (isLocked) return;
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }, [isLocked, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const offset = getNodeOffset(index);

  return (
    <Animated.View
      style={[
        s.nodeRow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[s.nodeWrapper, { transform: [{ translateX: offset }] }]}>
        <Animated.View
          style={{
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          }}
        >
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLocked}
            activeOpacity={0.8}
          >
            {/* Outer glow ring for active nodes */}
            {config.glow && <View style={s.glowRing} />}

            <View
              style={[
                s.node,
                {
                  backgroundColor: config.bg,
                  borderColor: config.border,
                },
              ]}
            >
              {isLocked ? (
                <Lock size={22} color={config.iconColor} />
              ) : level.status === "completed" ? (
                <Trophy size={22} color={config.iconColor} />
              ) : (
                <Text style={[s.nodeNumber, { color: config.iconColor }]}>
                  {level.id}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TreasureBadge levelId={level.id} />
        </Animated.View>

        {/* Info below node */}
        <Text
          style={[s.nodeLabel, isLocked && s.nodeLabelLocked]}
          numberOfLines={1}
        >
          {level.title}
        </Text>

        {level.status === "completed" && <StarsDisplay stars={level.stars} />}

        {isAvailable && (
          <View style={s.startBadge}>
            <Text style={s.startBadgeText}>START</Text>
            <ChevronRight size={10} color={theme.colors.onPrimary} />
          </View>
        )}

        {level.status === "in_progress" && (
          <View style={s.progressPill}>
            <Text style={s.progressText}>
              {level.lessons_complete}/{level.lessons.length}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

/* ─── Phase Header ─── */
const PhaseHeader = memo(function PhaseHeader() {
  return (
    <View style={s.phaseHeader}>
      <View style={s.phaseRow}>
        <Sparkles size={18} color={theme.colors.primary} />
        <Text style={s.phaseTitle}>Phase 2: Beginner Qaida</Text>
      </View>
      <Text style={s.phaseSubtitle}>
        20 levels — Arabic alphabet to reading Quran
      </Text>
    </View>
  );
});

/* ─── Progress Summary ─── */
const ProgressSummary = memo(function ProgressSummary({
  levels,
  xp,
}: {
  levels: LevelWithStatus[];
  xp: number;
}) {
  const completed = levels.filter((l) => l.status === "completed").length;
  const totalStars = levels.reduce((sum, l) => sum + l.stars, 0);
  const pct = levels.length > 0 ? (completed / levels.length) * 100 : 0;

  return (
    <View style={s.summaryCard}>
      <View style={s.summaryRow}>
        <SummaryStat value={`${completed}/20`} label="Levels" />
        <View style={s.summaryDivider} />
        <SummaryStat value={`${totalStars}/60`} label="Stars" />
        <View style={s.summaryDivider} />
        <SummaryStat value={String(xp)} label="Total XP" />
      </View>
      <View style={s.summaryBar}>
        <View style={[s.summaryBarFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
});

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.summaryItem}>
      <Text style={s.summaryValue}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

/* ─── Main Screen ─── */
export function LevelMapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: levelsRes, isLoading: levelsLoading } = useGetLevelsQuery();
  const { data: progressRes } = useGetProgressQuery();

  const levels: LevelWithStatus[] = useMemo(
    () => levelsRes?.data ?? [],
    [levelsRes],
  );
  const xp = progressRes?.data?.xp ?? 0;

  const handleLevelPress = useCallback(
    (level: LevelWithStatus) => {
      if (level.status === "locked") return;
      navigation.navigate("LevelDetail", { levelId: level.id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: LevelWithStatus; index: number }) => (
      <LevelNode
        level={item}
        index={index}
        onPress={() => handleLevelPress(item)}
      />
    ),
    [handleLevelPress],
  );

  const keyExtractor = useCallback(
    (item: LevelWithStatus) => String(item.id),
    [],
  );

  const ListHeader = useMemo(
    () => (
      <>
        <PhaseHeader />
        <ProgressSummary levels={levels} xp={xp} />
      </>
    ),
    [levels, xp],
  );

  if (levelsLoading) {
    return (
      <ScreenWrapper>
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>Loading your journey...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={levels}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={<View style={{ height: 120 }} />}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </ScreenWrapper>
  );
}

/* ─────────── Styles ─────────── */

const s = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },

  /* Phase header */
  phaseHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phaseTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  phaseSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },

  /* Progress summary */
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: { alignItems: "center" },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.outline,
  },
  summaryBar: {
    height: 6,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  summaryBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },

  /* Node row — full width, centers content */
  nodeRow: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  nodeWrapper: {
    alignItems: "center",
    width: NODE_SIZE + 80,
  },

  /* Glow ring behind active node */
  glowRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: (NODE_SIZE + 12) / 2,
    backgroundColor: "rgba(136, 217, 130, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(136, 217, 130, 0.25)",
  },

  /* Node circle */
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  nodeNumber: {
    fontSize: 22,
    fontWeight: "900",
  },
  nodeLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
    maxWidth: NODE_SIZE + 60,
  },
  nodeLabelLocked: {
    color: theme.colors.textMuted,
    opacity: 0.5,
  },

  /* Stars */
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
  },

  /* Start badge */
  startBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
    gap: 2,
  },
  startBadgeText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  /* Progress pill */
  progressPill: {
    backgroundColor: "rgba(136, 217, 130, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 5,
  },
  progressText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  /* Treasure */
  treasureBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(255, 219, 60, 0.2)",
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 219, 60, 0.35)",
  },
});
