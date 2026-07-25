import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { haptics } from "../../utils/haptics";
import type { HifzStage } from "../../store/services/api";

// ─────────────────────────────────────────────
// Palette (exact hexes from the mockups)
// ─────────────────────────────────────────────

export const hz = {
  screen: "#0B1517",
  card: "#16272B",
  cardBorder: "#24393E",
  rowBorder: "#1E3238",
  track: "#1B3036",
  well: "#101D20", // sunken slots / hidden text
  wellDash: "#2C464C",
  inset: "#0B1517", // stat tiles inside cards

  text: "#EDF5F4",
  muted: "#8DA5A3",
  faint: "#5F7E7C",

  // teal — primary / correct / open recite
  teal: "#2CC9B5",
  tealBright: "#5EE0CE",
  tealTint: "#123B34",
  tealEdge: "#1F5148",
  tealShadow: "#1B9484",
  onTeal: "#06302B",
  tealDeep: "#0D2C28",

  // sky — listen & repeat stages
  sky: "#6EC1E8",
  skyBright: "#9AD5F2",
  skyTint: "#12303A",
  skyCard: "#16303E",
  skyEdge: "#24505F",
  skyShadow: "#3E8AB3",
  onSky: "#0E2A3A",
  skyDim: "#1D4152",

  // violet — challenges
  violet: "#A78BFA",
  violetBright: "#C4B2FF",
  violetTint: "#2A2440",
  violetWell: "#1C1636",
  violetDash: "#3B2F6B",
  violetMuted: "#6D5FA8",
  violetShadow: "#6D4FD1",
  onViolet: "#241A45",

  // gold — blind recite / streaks / medium
  gold: "#EFB65A",
  goldBright: "#F5CE8A",
  goldTint: "#3A2F16",
  goldEdge: "#4A3E28",
  goldWell: "#241C0B",
  onGold: "#3A2A08",

  // rose — wrong / weak
  rose: "#F0838C",
  roseTint: "#3A1E24",
  roseEdge: "#4A2229",
  roseShadow: "#A83E48",
  onRose: "#3A0E12",
} as const;

/** Stage rail colours, per pipeline stage (J5–J13). */
export const STAGE_COLORS: Record<string, string> = {
  listen: hz.sky,
  shadow: hz.sky,
  open_recite: hz.teal,
  challenges: hz.violet,
  blind_recite: hz.gold,
};

export const STAGE_RAIL_LABELS: Record<string, string> = {
  listen: "LISTEN",
  shadow: "REPEAT",
  open_recite: "OPEN",
  challenges: "GAMES",
  blind_recite: "BLIND",
};

// ─────────────────────────────────────────────
// Text helpers
// ─────────────────────────────────────────────

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(n: number): string {
  return String(n)
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join("");
}

/** Amiri is the Quran face throughout the mockups. */
export const AYAH_FONT = "Amiri_400Regular";

export function SolidButton({
  label,
  onPress,
  color = hz.teal,
  shadowColor = hz.tealShadow,
  textColor = hz.onTeal,
  disabled = false,
  size = "lg",
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  shadowColor?: string;
  textColor?: string;
  disabled?: boolean;
  size?: "lg" | "md";
  style?: StyleProp<ViewStyle>;
}) {
  const pressed = useRef(new Animated.Value(0)).current;

  const translateY = pressed.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() =>
        Animated.timing(pressed, { toValue: 1, duration: 60, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.timing(pressed, { toValue: 0, duration: 90, useNativeDriver: true }).start()
      }
      onPress={() => {
        haptics.medium();
        onPress();
      }}
      style={style}
    >
      {/* the dark under-edge */}
      <View
        style={[
          s.btnEdge,
          { backgroundColor: disabled ? hz.track : shadowColor, borderRadius: 18 },
        ]}
      />
      <Animated.View
        style={[
          s.btnFace,
          size === "md" && s.btnFaceMd,
          {
            backgroundColor: disabled ? hz.track : color,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text
          style={[
            s.btnText,
            size === "md" && { fontSize: 13 },
            { color: disabled ? hz.faint : textColor },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
  color = hz.muted,
  borderColor = hz.cardBorder,
  size = "lg",
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  borderColor?: string;
  size?: "lg" | "md" | "sm";
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [
        s.outlineBtn,
        size === "md" && { paddingVertical: 13, borderRadius: 16 },
        size === "sm" && { paddingVertical: 12, borderRadius: 16 },
        { borderColor },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          s.outlineBtnText,
          size === "md" && { fontSize: 13 },
          size === "sm" && { fontSize: 12.5 },
          { color },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Session chrome
// ─────────────────────────────────────────────
export function Tag({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[s.tag, { backgroundColor: bg }]}>
      <Text style={[s.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function SessionHeader({
  onClose,
  tag,
  tagBg,
  tagColor,
  title,
  sub,
  right,
}: {
  onClose: () => void;
  tag: string;
  tagBg: string;
  tagColor: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      <Pressable onPress={onClose} hitSlop={12}>
        <Text style={s.closeGlyph}>✕</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={s.headerTitleRow}>
          <Tag label={tag} bg={tagBg} color={tagColor} />
          <Text style={s.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {!!sub && <Text style={s.headerSub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

/** Hearts chip — gold at 2+, rose at 1 or 0 (J9 vs J12). */
export function HeartsChip({ hearts }: { hearts: number }) {
  const low = hearts <= 1;
  return (
    <View
      style={[s.hearts, { backgroundColor: low ? hz.roseTint : hz.goldTint }]}
    >
      <Text style={[s.heartsText, { color: low ? hz.rose : hz.gold }]}>
        {hearts}♥
      </Text>
    </View>
  );
}

export function StageRail({
  stages,
  current,
  showLabels = false,
}: {
  stages: HifzStage[];
  current: HifzStage;
  showLabels?: boolean;
}) {
  const currentIdx = stages.indexOf(current);
  return (
    <View>
      <View style={s.rail}>
        {stages.map((stage, i) => (
          <View
            key={stage}
            style={[
              s.railSeg,
              {
                backgroundColor:
                  i <= currentIdx ? STAGE_COLORS[stage] ?? hz.teal : hz.track,
              },
            ]}
          />
        ))}
      </View>
      {showLabels && (
        <View style={s.railLabels}>
          {stages.map((stage, i) => (
            <Text
              key={stage}
              style={[
                s.railLabel,
                i === currentIdx && {
                  color:
                    stage === "listen" || stage === "shadow"
                      ? hz.skyBright
                      : STAGE_COLORS[stage],
                },
              ]}
            >
              {STAGE_RAIL_LABELS[stage]}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Ayah furniture
// ─────────────────────────────────────────────

export function DiamondBadge({
  number,
  size = 26,
  active = false,
  dim = false,
}: {
  number: number;
  size?: number;
  active?: boolean;
  dim?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        transform: [{ rotate: "45deg" }],
        backgroundColor: active ? hz.sky : dim ? hz.card : hz.skyTint,
        borderWidth: active ? 0 : 1,
        borderColor: dim ? hz.cardBorder : hz.skyEdge,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          transform: [{ rotate: "-45deg" }],
          fontFamily: "Nunito_800ExtraBold",
          fontSize: size * 0.38,
          color: active ? hz.onSky : dim ? hz.faint : hz.sky,
        }}
      >
        {toArabicDigits(number)}
      </Text>
    </View>
  );
}

export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[s.sectionLabel, style]}>{children}</Text>;
}

export function RatingChip({
  rating,
}: {
  rating: "Strong" | "Medium" | "Weak";
}) {
  const conf =
    rating === "Strong"
      ? { label: "STRONG", border: hz.tealEdge, color: hz.tealBright }
      : rating === "Medium"
        ? { label: "MED", border: hz.goldEdge, color: hz.gold }
        : { label: "WEAK", border: hz.roseEdge, color: hz.rose };
  return (
    <View style={[s.ratingChip, { borderColor: conf.border }]}>
      <Text style={[s.ratingChipText, { color: conf.color }]}>{conf.label}</Text>
    </View>
  );
}

export function Bar({
  pct,
  color,
  height = 6,
  style,
}: {
  pct: number;
  color: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { height, borderRadius: height / 2 + 1, backgroundColor: hz.inset, overflow: "hidden" },
        style,
      ]}
    >
      <View
        style={{
          width: `${Math.max(2, Math.min(100, pct))}%`,
          height: "100%",
          borderRadius: height / 2 + 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Atmosphere
// ─────────────────────────────────────────────
export function RadialGlow({
  tint,
  cy = "34%",
}: {
  tint: string;
  cy?: string;
}) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <SvgRadialGradient id="glow" cx="50%" cy={cy} rx="85%" ry="50%">
          <Stop offset="0" stopColor={tint} stopOpacity="1" />
          <Stop offset="0.62" stopColor={hz.screen} stopOpacity="1" />
        </SvgRadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

export function PulseRing({
  size,
  color,
  active = true,
}: {
  size: number;
  color: string;
  active?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      anim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.12, 0] }),
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.42] }) },
        ],
      }}
    />
  );
}

export function FloatView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function FeedbackSheet({
  status,
  title,
  message,
  actionLabel,
  onAction,
}: {
  status: "correct" | "wrong" | null;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!status) return;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    if (status === "correct") haptics.success();
    else haptics.error();
  }, [status, slide]);

  if (!status) return null;
  const correct = status === "correct";

  return (
    <Animated.View
      style={[
        s.sheet,
        {
          backgroundColor: correct ? hz.tealTint : hz.roseTint,
          borderTopColor: correct ? hz.teal : hz.rose,
          opacity: slide,
          transform: [
            { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) },
          ],
        },
      ]}
    >
      <View style={s.sheetRow}>
        <View
          style={[s.sheetIcon, { backgroundColor: correct ? hz.teal : hz.rose }]}
        >
          <Text
            style={[s.sheetIconGlyph, { color: correct ? hz.onTeal : hz.onRose }]}
          >
            {correct ? "✓" : "✕"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sheetTitle, { color: correct ? hz.tealBright : hz.rose }]}>
            {title ?? (correct ? "MashaAllah" : "Not quite")}
          </Text>
          {!!message && (
            <Text
              style={[s.sheetMsg, { color: correct ? "#8FBFB4" : "#C89098" }]}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
      <SolidButton
        label={actionLabel ?? (correct ? "CONTINUE" : "TRY AGAIN")}
        onPress={onAction}
        color={correct ? hz.teal : hz.rose}
        shadowColor={correct ? hz.tealShadow : hz.roseShadow}
        textColor={correct ? hz.onTeal : hz.onRose}
        style={{ marginTop: 16 }}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const s = StyleSheet.create({
  btnEdge: {
    ...StyleSheet.absoluteFillObject,
    top: 5,
  },
  btnFace: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFaceMd: { paddingVertical: 13, borderRadius: 16 },
  btnText: {
    fontFamily: "Nunito_900Black",
    fontSize: 15,
    letterSpacing: 1.2,
  },

  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 14,
  },
  outlineBtnText: {
    fontFamily: "Nunito_900Black",
    fontSize: 14,
    letterSpacing: 0.85,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  closeGlyph: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 22,
    color: hz.faint,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 14,
    color: hz.text,
    flexShrink: 1,
  },
  headerSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: hz.faint,
    marginTop: 2,
  },

  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: {
    fontFamily: "Nunito_900Black",
    fontSize: 10,
    letterSpacing: 0.8,
  },

  hearts: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  heartsText: { fontFamily: "Nunito_900Black", fontSize: 12 },

  rail: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 22,
    marginTop: 14,
  },
  railSeg: { flex: 1, height: 8, borderRadius: 5 },
  railLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginTop: 7,
  },
  railLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: hz.faint,
  },

  sectionLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.3,
    color: hz.faint,
  },

  ratingChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingChipText: { fontFamily: "Nunito_900Black", fontSize: 9.5 },

  sheet: {
    position: "absolute",
    // Bleed past the session body's 20/24px padding so the sheet spans the
    // full screen width and sits flush with the bottom (J12).
    left: -20,
    right: -20,
    bottom: -24,
    borderTopWidth: 2,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetIconGlyph: { fontFamily: "Nunito_900Black", fontSize: 18 },
  sheetTitle: { fontFamily: "Nunito_900Black", fontSize: 17 },
  sheetMsg: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    marginTop: 2,
  },
});
