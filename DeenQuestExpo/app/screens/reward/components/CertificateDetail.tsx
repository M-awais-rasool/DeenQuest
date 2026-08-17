import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { StyleProp, ViewStyle, LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { Lock, X } from "lucide-react-native";
import { dq } from "../../../theme/designTokens";
import { RevealText } from "../../../components/level/lesson/shared";
import { TactilePressable } from "../../../components/ui";
import { CertificateSeal } from "./CertificateSeal";

const T = {
  borderOuter: 80,
  borderInner: 360,
  corners: 820,
  seal: 700,
  shine: 1300,
  label: 1000,
  title: 1180,
  awardedTo: 1480,
  name: 1630,
  message: 2050,
};

const BORDER_DRAW_MS = 720;
const CORNER_STAGGER = 90;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** The four flourishes, in the order they spin in. */
const CORNERS: StyleProp<ViewStyle>[] = [
  { top: 6, left: 8 },
  { top: 6, right: 8 },
  { bottom: 6, right: 8 },
  { bottom: 6, left: 8 },
];

/**
 * Draws the certificate's two rules as strokes that travel around the frame,
 * rather than simply appearing. The Views underneath keep the layout and the
 * padding but carry no border of their own — everything visible here is the
 * stroke, so it can be animated at all.
 *
 * strokeDashoffset is an SVG prop, which the native driver cannot touch, so
 * this runs on the JS driver. It is two interpolations for a couple of frames
 * at open, not a per-frame cost the screen carries.
 */
function DrawnBorders({
  width,
  height,
  animate,
  outerColor,
  innerColor,
}: {
  width: number;
  height: number;
  /** Earned certificates draw themselves; a locked one is simply already there. */
  animate: boolean;
  outerColor: string;
  innerColor: string;
}) {
  const outer = useRef(new Animated.Value(0)).current;
  const inner = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      outer.setValue(1);
      inner.setValue(1);
      return;
    }
    const run = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: BORDER_DRAW_MS,
        delay,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      });
    const anim = Animated.parallel([
      run(outer, T.borderOuter),
      run(inner, T.borderInner),
    ]);
    anim.start();
    return () => anim.stop();
  }, [outer, inner, animate]);

  if (width <= 0 || height <= 0) return null;

  // Each rule is one continuous dash as long as its own perimeter, pulled fully
  // out of view and then let back in — which reads as the line being drawn.
  const outerPerimeter = 2 * (width - 2 + (height - 2));
  const innerInset = 8; // frameOuter's padding
  const innerW = width - innerInset * 2;
  const innerH = height - innerInset * 2;
  const innerPerimeter = 2 * (innerW + innerH);

  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
    >
      <AnimatedRect
        x={1}
        y={1}
        width={Math.max(width - 2, 0)}
        height={Math.max(height - 2, 0)}
        rx={8}
        fill="none"
        stroke={outerColor}
        strokeWidth={2}
        strokeDasharray={outerPerimeter}
        strokeDashoffset={outer.interpolate({
          inputRange: [0, 1],
          outputRange: [outerPerimeter, 0],
        })}
      />
      <AnimatedRect
        x={innerInset}
        y={innerInset}
        width={Math.max(innerW, 0)}
        height={Math.max(innerH, 0)}
        rx={4}
        fill="none"
        stroke={innerColor}
        strokeWidth={1.5}
        strokeDasharray={innerPerimeter}
        strokeDashoffset={inner.interpolate({
          inputRange: [0, 1],
          outputRange: [innerPerimeter, 0],
        })}
      />
    </Svg>
  );
}

/** A corner flourish that spins into place once the rules have been drawn. */
function Corner({
  position,
  delay,
  animate,
}: {
  position: StyleProp<ViewStyle>;
  delay: number;
  animate: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(progress, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [progress, delay, animate]);

  const style = {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["-120deg", "0deg"],
        }),
      },
    ],
  } as unknown as StyleProp<ViewStyle>;

  return (
    <Animated.View style={[s.cornerWrap, position, style]} pointerEvents="none">
      <Text style={s.corner}>✦</Text>
    </Animated.View>
  );
}

export interface CertificateDetailData {
  title: string;
  message?: string;
  nextPhase?: string;
  sectionTitle: string;
  courseLevel: number;
  earned: boolean;
  holderName: string;
}

function useSealEntrance(delay: number, enabled: boolean) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(progress, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [progress, delay, enabled]);

  return {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["-38deg", "0deg"],
        }),
      },
    ],
  } as unknown as StyleProp<ViewStyle>;
}

function Shine({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2800),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.shine,
        {
          opacity: progress.interpolate({
            inputRange: [0, 0.15, 0.85, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-260, 340],
              }),
            },
            { rotate: "18deg" },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={["transparent", "rgba(255,240,200,0.16)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function CertificateDetail({
  data,
  visible,
  onClose,
}: {
  data: CertificateDetailData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const earned = !!data?.earned;
  const sealStyle = useSealEntrance(T.seal, earned);
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  // The frame's height depends on its wording, so the strokes can only be laid
  // out once it has measured itself.
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const onFrameLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setFrameSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  useEffect(() => {
    if (!visible) return;
    backdrop.setValue(0);
    sheet.setValue(0);
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(sheet, {
        toValue: 1,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdrop, sheet]);

  if (!data) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I earned the "${data.title}" certificate on DeenQuest! 🎓`,
      });
    } catch {}
  };

  const beat = (ms: number) => (earned ? ms : 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          s.sheet,
          {
            opacity: backdrop,
            transform: [
              {
                translateY: sheet.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={s.handleRow}>
          <View style={s.handle} />
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close certificate"
          >
            <X size={24} color={dq.text} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.eyebrow}>{data.sectionTitle.toUpperCase()}</Text>

          <View style={s.frameOuter} onLayout={onFrameLayout}>
            <DrawnBorders
              width={frameSize.width}
              height={frameSize.height}
              animate={earned}
              outerColor={earned ? "#4A3E28" : dq.lockBorder}
              innerColor={earned ? dq.gold : dq.lockBorder}
            />
            <View style={s.frameInner}>
              {earned && <Shine delay={T.shine} />}
              {CORNERS.map((position, i) => (
                <Corner
                  key={i}
                  position={position}
                  delay={T.corners + i * CORNER_STAGGER}
                  animate={earned}
                />
              ))}

              {earned ? (
                <Animated.View style={sealStyle}>
                  <CertificateSeal id="detailseal" />
                </Animated.View>
              ) : (
                <View style={s.lockCircle}>
                  <Lock size={22} color="#5F7E7C" strokeWidth={2.5} />
                </View>
              )}

              <RevealText
                text="CERTIFICATE OF COMPLETION"
                style={s.certLabel}
                containerStyle={s.certLabelWrap}
                delay={beat(T.label)}
                wordStagger={beat(80)}
              />
              <RevealText
                text={data.title}
                style={[s.courseTitle, !earned && { color: dq.muted }]}
                containerStyle={s.courseTitleWrap}
                delay={beat(T.title)}
                wordStagger={beat(90)}
              />
              <RevealText
                text="awarded to"
                style={s.awardedTo}
                containerStyle={s.awardedToWrap}
                delay={beat(T.awardedTo)}
                wordStagger={beat(55)}
              />
              {earned ? (
                <RevealText
                  text={data.holderName}
                  style={s.name}
                  containerStyle={s.nameWrap}
                  delay={T.name}
                  wordStagger={120}
                />
              ) : (
                <View style={s.nameWrap}>
                  <Text style={s.namePlaceholder}>— — — — —</Text>
                </View>
              )}

              <View style={s.metaRow}>
                <View style={s.metaLine} />
                <Text style={s.metaText}>
                  {earned ? "COMPLETED" : "NOT YET EARNED"}
                </Text>
                <View style={s.metaLine} />
              </View>
            </View>
          </View>

          {!!data.message && (
            <RevealText
              text={data.message}
              style={s.message}
              containerStyle={s.messageWrap}
              delay={beat(T.message)}
              wordStagger={beat(45)}
            />
          )}

          {!earned && (
            <View style={s.requirement}>
              <Lock size={13} color={dq.gold} />
              <Text style={s.requirementText}>
                Complete Level {data.courseLevel} to unlock this certificate
              </Text>
            </View>
          )}

          {!!data.nextPhase && earned && (
            <View style={s.nextChip}>
              <Text style={s.nextStar}>✦</Text>
              <Text style={s.nextText}>{data.nextPhase}</Text>
            </View>
          )}

          {earned && (
            <TactilePressable
              edgeColor={dq.goldDark}
              radius={18}
              haptic="medium"
              style={s.shareWrap}
              faceStyle={s.shareBtn}
              onPress={handleShare}
            >
              <Text style={s.shareText}>SHARE CERTIFICATE</Text>
            </TactilePressable>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,14,16,0.82)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 60,
    backgroundColor: dq.screen,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: dq.cardBorder,
  },
  // Tall enough to contain the close button. It is positioned absolutely, and a
  // child that overflows its parent is not touchable on Android — which is
  // exactly how the close button ends up drawn but dead.
  handleRow: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: dq.cardBorder,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 7,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
  },
  scroll: { padding: 22, paddingBottom: 44 },

  eyebrow: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 1.6,
    textAlign: "center",
    marginBottom: 14,
  },

  // The rules are drawn as SVG strokes on top (see DrawnBorders), so these
  // carry only the spacing they used to pair with a border.
  frameOuter: {
    backgroundColor: "#0F1D20",
    borderRadius: 8,
    padding: 8,
  },
  frameInner: {
    borderRadius: 4,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  shine: { position: "absolute", top: -40, bottom: -40, width: 120 },
  cornerWrap: { position: "absolute", zIndex: 2 },
  corner: { fontSize: 12, color: dq.gold },
  lockCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2C464C",
    alignItems: "center",
    justifyContent: "center",
  },

  certLabelWrap: { marginTop: 16, alignSelf: "stretch" },
  certLabel: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.muted,
    letterSpacing: 2.2,
  },
  courseTitleWrap: { marginTop: 12, alignSelf: "stretch" },
  courseTitle: { fontSize: 23, fontFamily: "Nunito_900Black", color: dq.text },
  awardedToWrap: { marginTop: 8, alignSelf: "stretch" },
  awardedTo: { fontSize: 12.5, fontFamily: "Nunito_600SemiBold", color: dq.muted },
  nameWrap: { marginTop: 4, alignSelf: "stretch", alignItems: "center" },
  name: { fontSize: 27, fontFamily: "Amiri_700Bold", color: "#F5CE8A" },
  namePlaceholder: {
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
    color: "#31494B",
    letterSpacing: 3,
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  metaLine: { width: 28, height: 1, backgroundColor: "#4A3E28" },
  metaText: {
    fontSize: 10.5,
    fontFamily: "Nunito_700Bold",
    color: "#5F7E7C",
    letterSpacing: 0.6,
  },

  messageWrap: { marginTop: 18, alignSelf: "stretch" },
  message: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
  },

  requirement: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: dq.goldTint,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.gold,
    flexShrink: 1,
  },

  nextChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    backgroundColor: "#3A2F16",
    borderWidth: 1,
    borderColor: "#4A3E28",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 14,
  },
  nextStar: { fontSize: 13, color: dq.gold },
  nextText: { fontSize: 12.5, fontFamily: "Nunito_800ExtraBold", color: dq.gold },

  shareWrap: { marginTop: 22 },
  shareBtn: {
    backgroundColor: dq.gold,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  shareText: {
    color: dq.onGold,
    fontFamily: "Nunito_900Black",
    fontSize: 15.5,
    letterSpacing: 1.2,
  },
});
