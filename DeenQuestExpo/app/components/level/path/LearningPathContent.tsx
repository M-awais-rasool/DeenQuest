import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  InteractionManager,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  useGetLevelsQuery,
  useGetProgressQuery,
  useGetRewardsQuery,
} from "../../../store/services/api";
import type {
  CourseType,
  LevelWithStatus,
  RewardWithStatus,
} from "../../../store/services/api";
import {
  loadSelectedCourse,
  saveSelectedCourse,
} from "../../../store/storage/pathStorage";
import type { AppStackParamList } from "../../../navigators/navigationTypes";
import { TAB_BAR_HEIGHT } from "../../../navigators/DemoNavigator";

import { PathTopBar } from "./PathTopBar";
import { PathHero } from "./PathHero";
import { NextRewardCard } from "./NextRewardCard";
import { GroundLayer, SkyLayer } from "./PathBackdrop";
import {
  NodeLabel,
  NodePulse,
  PathNode,
  StarTray,
  StartFlag,
  nodeState,
} from "./PathNode";
import { CourseSelectorSheet } from "./CourseSelectorSheet";
import { CourseSwitchTransition } from "./CourseSwitchTransition";
import { courseEntry } from "./courseCatalog";
import { StreakPopup, type StreakOrigin } from "./StreakPopup";
import { WORLD, worldFamily } from "./worldTheme";
import {
  NODE_SIZE,
  RING,
  canvasHeight,
  nodePoint,
  scaleX,
} from "./pathLayout";

/**
 * The learning path, drawn as a road through an illustrated world.
 *
 * Nodes are placed absolutely on a canvas rather than flowed in a list: the
 * whole point of the design is that they sit *on* a road, and a list cannot
 * put a view at an arbitrary point on a curve. The canvas and the road are
 * generated from one set of coordinates (`pathLayout`), so they cannot drift.
 */
export function LearningPathContent() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [courseType, setCourseType] = useState<CourseType>(loadSelectedCourse);
  const course = courseEntry(courseType);
  const family = worldFamily(courseType);

  const { data: levelsRes, isLoading } = useGetLevelsQuery({ courseType });
  const { data: progressRes } = useGetProgressQuery();
  const { data: rewardsRes } = useGetRewardsQuery();

  const [streakOpen, setStreakOpen] = useState(false);
  const [streakOrigin, setStreakOrigin] = useState<StreakOrigin | null>(null);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [sheetPresent, setSheetPresent] = useState(false);
  const [coursesOrigin, setCoursesOrigin] = useState<StreakOrigin | null>(null);
  const [pendingCourse, setPendingCourse] = useState<CourseType | null>(null);

  /** Measured, not guessed: the header's height decides where the road starts. */
  const [headerH, setHeaderH] = useState(250);
  const [headerMeasured, setHeaderMeasured] = useState(false);
  /** The mascot-and-counters strip: the part that folds away on scroll. */
  const [heroH, setHeroH] = useState(86);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Fold the counters away and let the reward card take their place. Both are
  // transforms and opacity, so this runs on the UI thread — a JS-driven height
  // animation here would stutter against the scroll it is following.
  const collapse = scrollY.interpolate({
    inputRange: [0, heroH],
    outputRange: [0, -heroH],
    extrapolate: "clamp",
  });
  const heroFade = scrollY.interpolate({
    // Gone before the card arrives, so the two never overlap mid-flight.
    inputRange: [0, heroH * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  /**
   * The ground is deferred; the sky and the header are not.
   *
   * Three things used to happen on a first visit, in order: a full-screen
   * loader painted the app background, it was torn down, and then every level
   * mounted at once inside the tab transition. The first two are why the
   * background flashed a different colour, the third is why it stalled.
   *
   * Now the sky and header paint on frame one — the background is correct
   * before anything is fetched — and the ground waits for three things at
   * once, so the expensive SVG is built exactly once with the right numbers:
   * the levels have arrived, the header has been measured (the road hangs off
   * its height), and the tab transition has finished.
   */
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setIdle(true));
    return () => task.cancel();
  }, []);

  const groundReady = idle && headerMeasured && !isLoading;

  const levels: LevelWithStatus[] = useMemo(
    () => levelsRes?.data ?? [],
    [levelsRes],
  );

  const progress = progressRes?.data;
  const xp = progress?.xp ?? 0;
  const streak = progress?.current_streak ?? 0;

  const weekly = useMemo(
    () => progress?.weekly_completions ?? [],
    [progress],
  );

  const levelsDone = useMemo(
    () => levels.filter((l) => l.status === "completed").length,
    [levels],
  );

  /** The reward the learner is closest to earning. */
  const nextReward: RewardWithStatus | null = useMemo(() => {
    const locked = (rewardsRes?.data ?? []).filter((r) => !r.unlocked);
    if (locked.length === 0) return null;
    return locked.reduce((best, r) => (r.progress > best.progress ? r : best));
  }, [rewardsRes]);

  const sx = useMemo(() => scaleX(width), [width]);

  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

  const handleStreakPress = useCallback((origin: StreakOrigin) => {
    setStreakOrigin(origin);
    setStreakOpen(true);
  }, []);

  const handleCoursesPress = useCallback((origin: StreakOrigin) => {
    setCoursesOrigin(origin);
    setSheetPresent(true);
    setCoursesOpen(true);
  }, []);

  const handleSelectCourse = useCallback((next: CourseType) => {
    setCoursesOpen(false);
    setPendingCourse(next);
  }, []);

  const handleCovered = useCallback(() => {
    if (!pendingCourse) return;
    didAutoScroll.current = false;
    setCourseType(pendingCourse);
    saveSelectedCourse(pendingCourse);
  }, [pendingCourse]);

  const handleStart = useCallback(
    (level: LevelWithStatus) => {
      navigation.navigate("LevelDetail", {
        levelId: level.id,
        courseType: level.course_type,
      });
    },
    [navigation],
  );

  const currentIndex = useMemo(
    () => levels.findIndex((l) => l.status !== "completed" && l.status !== "locked"),
    [levels],
  );

  /** Bring the learner to where they left off once the canvas has a height. */
  const onCanvasLayout = useCallback(() => {
    if (didAutoScroll.current || currentIndex < 2) return;
    didAutoScroll.current = true;
    const y = headerH + nodePoint(currentIndex).y - 260;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 350);
  }, [currentIndex, headerH]);

  const switching = pendingCourse !== null;

  // Room under the last node for the floating tab bar, plus the home indicator.
  const bottomPad = TAB_BAR_HEIGHT + Math.max(insets.bottom, 14);

  // Never shorter than the viewport: a path with two levels must still paint
  // its world to the bottom edge rather than ending in the app background.
  const canvasH = Math.max(
    headerH + canvasHeight(levels.length) + bottomPad,
    height,
  );

  return (
    // The container takes the sky's own top colour rather than the app
    // background: iOS paints it during the rubber-band at the top of a scroll,
    // and anything else there reads as the world sitting on a different screen.
    <View style={[s.container, { backgroundColor: family.sky[0] }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Fixed. The crescent, the stars and the mosque all live in the band
          the header covers, and the mockup shows them through its glass
          panels — so they stay put while the ground scrolls past. */}
      <SkyLayer width={width} height={height} family={family} />

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: canvasH }}
        contentInsetAdjustmentBehavior="never"
        style={s.scroll}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onLayout={onCanvasLayout}
      >
        <View style={{ height: canvasH }}>
          {groundReady && (
            <GroundLayer
              width={width}
              height={canvasH}
              nodeCount={levels.length}
              family={family}
              roadOffsetY={headerH}
            />
          )}

          {groundReady &&
            levels.map((level, i) => (
              <PathStop
                key={level.id}
                level={level}
                index={i}
                top={headerH}
                sx={sx}
                screenW={width}
                onPress={handleStart}
              />
            ))}

          {groundReady && levels.length === 0 && (
            <View style={[s.empty, { top: headerH + 60 }]}>
              <Text style={s.emptyText}>Your learning path is being prepared.</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Pinned. The world scrolls underneath it rather than carrying it away,
          so the course, the streak and the next reward stay reachable at any
          point on the path. It stays transparent — the panels inside were
          drawn to sit on the scenery — with a short scrim under it so hills
          sliding past never fight the text. */}
      <View
        style={[s.headerOverlay, { paddingTop: insets.top }]}
        onLayout={(e) => {
          setHeaderH(e.nativeEvent.layout.height);
          setHeaderMeasured(true);
        }}
        pointerEvents="box-none"
      >
        {/* Barely there. Its whole job is to stop nodes scrolling up behind
            the header from colliding with the text; anything heavier hides the
            crescent and the mosque, which are the reason the sky is fixed. */}
        {/* The scrim rides up with the rest, so the darkened band shrinks to
            match the header instead of hanging below it. */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: collapse }] }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["rgba(4,14,16,0.45)", "rgba(4,14,16,0.22)", "transparent"]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Always visible: the course and the streak are how you leave. */}
        <PathTopBar
          title={course.title}
          badge={course.title.charAt(0)}
          streak={streak}
          family={family}
          onStreakPress={handleStreakPress}
          onCoursesPress={handleCoursesPress}
        />

        <Animated.View
          style={{ opacity: heroFade }}
          onLayout={(e) => setHeroH(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
        >
          <PathHero
            streak={streak}
            xp={xp}
            levelsDone={levelsDone}
            family={family}
          />
        </Animated.View>

        {/* Rises into the space the counters leave behind and stays there —
            progress towards the next reward is worth keeping on screen while
            the learner is actually earning it. */}
        <Animated.View style={{ transform: [{ translateY: collapse }] }}>
          <NextRewardCard reward={nextReward} family={family} />
        </Animated.View>
      </View>

      <StreakPopup
        visible={streakOpen}
        onClose={() => setStreakOpen(false)}
        streak={streak}
        weekly={weekly}
        origin={streakOrigin}
      />

      <Modal
        visible={sheetPresent || pendingCourse !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setCoursesOpen(false)}
      >
        <View style={s.modalHost}>
          {sheetPresent && (
            <CourseSelectorSheet
              visible={coursesOpen}
              onClose={() => setCoursesOpen(false)}
              onClosed={() => setSheetPresent(false)}
              activeCourse={courseType}
              onSelectCourse={handleSelectCourse}
              origin={coursesOrigin}
            />
          )}

          {pendingCourse && (
            <CourseSwitchTransition
              active
              toIcon={courseEntry(pendingCourse).Icon}
              toTitle={courseEntry(pendingCourse).title}
              toPalette={courseEntry(pendingCourse).palette}
              dataReady={courseType === pendingCourse && !isLoading}
              onCovered={handleCovered}
              onFinished={() => setPendingCourse(null)}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

/**
 * One node with everything that hangs off it: the star tray tucked under its
 * rim, the label card beside it, and — on the node the learner is up to — the
 * pulse and the START flag.
 *
 * The label sits on whichever side the node is *not* leaning towards, so it
 * never covers the road.
 */
const PathStop = memo(function PathStop({
  level,
  index,
  top,
  sx,
  screenW,
  onPress,
}: {
  level: LevelWithStatus;
  index: number;
  top: number;
  sx: (x: number) => number;
  screenW: number;
  /** Stable across renders, so memo() actually holds. */
  onPress: (level: LevelWithStatus) => void;
}) {
  const state = nodeState(level);
  const point = nodePoint(index);
  const size = NODE_SIZE[state];
  const outer = size + RING * 2;

  const cx = sx(point.x);
  const cy = top + point.y;

  const stars = starsFor(level);

  // Mockup: the label's near edge always clears the node's rim by 8 px.
  const labelOnLeft = point.x >= 190;

  return (
    <>
      {state === "current" && (
        <View
          style={[
            s.pulseHost,
            { left: cx - outer / 2, top: cy - outer / 2, width: outer, height: outer },
          ]}
        >
          <NodePulse size={outer} />
        </View>
      )}

      <View style={[s.node, { left: cx - outer / 2, top: cy - outer / 2 }]}>
        <PathNode
          level={level}
          index={index}
          glyph={glyphFor(level)}
          onPress={() => onPress(level)}
        />
      </View>

      {stars !== null && (
        <View
          style={[
            s.tray,
            { left: cx - 30, top: cy + size / 2 + RING - 19 },
          ]}
        >
          <StarTray earned={stars} />
        </View>
      )}

      <View
        style={[
          s.label,
          labelOnLeft ? leftOf(cx, outer) : rightOf(cx, outer, screenW),
          { top: cy - 23 },
        ]}
      >
        {state === "current" && (
          <View style={s.startHost}>
            <StartFlag />
          </View>
        )}
        <NodeLabel number={index + 1} title={level.title} state={state} />
      </View>
    </>
  );
});

/**
 * How many stars a level has earned, or null when it should carry no tray.
 *
 * `available` means unlocked but never opened. It used to get a tray of three
 * empty stars, which on a cream pill reads as three stars rather than none —
 * a level the learner had not touched looked finished. A level that has not
 * been started shows nothing at all.
 *
 * The third star is reserved for actually finishing. Rounding progress to the
 * nearest third handed it out at 5/6 of the way through, so an unfinished
 * level could already look complete.
 */
function starsFor(level: LevelWithStatus): number | null {
  if (level.status === "completed") return 3;
  if (level.status !== "in_progress") return null;
  if (level.lesson_count <= 0) return 0;

  const done = Math.floor((level.lessons_complete / level.lesson_count) * 3);
  return Math.min(done, 2);
}

/**
 * The Arabic letter a Qaida level teaches, when its title carries one.
 *
 * The mockup fills Qaida nodes with the letter itself and Namaz nodes with a
 * pictogram. Levels have no glyph field, so the letter is taken from the title
 * when there is Arabic in it; anything else falls through to the lock/icon the
 * node draws by default.
 */
function glyphFor(level: LevelWithStatus): string | undefined {
  if (level.status === "locked") return undefined;
  const arabic = level.title.match(/[\u0621-\u064A]/);
  return arabic ? arabic[0] : undefined;
}

/**
 * Label hugging the node's left rim, 8 px clear of it.
 *
 * The band is anchored at x=0 and stretched up to the rim, with its content
 * pushed to the far edge — so the card's right edge lands exactly on the
 * clearance line however wide the card turns out to be. No horizontal padding
 * on the band itself: any would offset the card by that much.
 */
function leftOf(cx: number, outer: number) {
  return {
    left: 0,
    width: Math.max(0, cx - outer / 2 - 8),
    alignItems: "flex-end" as const,
  };
}

/** Label hugging the node's right rim, 8 px clear of it. */
function rightOf(cx: number, outer: number, screenW: number) {
  const left = cx + outer / 2 + 8;
  return {
    left,
    width: Math.max(0, screenW - left - 12),
    alignItems: "flex-start" as const,
  };
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    backgroundColor: "transparent",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 14,
    zIndex: 10,
  },
  node: {
    position: "absolute",
  },
  pulseHost: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  tray: {
    position: "absolute",
    width: 60,
  },
  label: {
    position: "absolute",
  },
  startHost: {
    marginBottom: 6,
  },
  modalHost: {
    flex: 1,
  },
  empty: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: WORLD.textMuted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Nunito_600SemiBold",
  },
});
