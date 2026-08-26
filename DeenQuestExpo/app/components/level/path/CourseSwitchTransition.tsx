import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Svg, Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";
import type { LucideIcon } from "lucide-react-native";

import { theme } from "../../../theme/themes";
import { haptics } from "../../../utils/haptics";
import { hexToRgba, type SectionColors } from "../map/constants";

const W = Dimensions.get("window").width;
const H = Math.max(
  Dimensions.get("window").height,
  Dimensions.get("screen").height,
);

const BAND_UNITS_W = 220;
const BAND_W = W * 2.2;

const VERT_OVERSCAN = 1.5;
const BAND_UNITS_H = 100 * VERT_OVERSCAN;
const BAND_H = H * VERT_OVERSCAN;

const MID_X = (W - BAND_W) / 2;
const MID_Y = (H - BAND_H) / 2;

const COVER_MS = 520;
const REVEAL_MS = 560;
const MIN_HOLD_MS = 620;

interface Puff {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function buildPuffs(
  seed: number,
  cols: number,
  rows: number,
  minR: number,
  maxR: number,
): Puff[] {
  const rand = makeRng(seed);
  const puffs: Puff[] = [];
  // Overscan the band so the puffs run past every edge of the viewBox.
  const spanX = BAND_UNITS_W + 30;
  const spanY = BAND_UNITS_H + 30;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (rand() - 0.5) * (spanX / cols) * 0.85;
      const jy = (rand() - 0.5) * (spanY / rows) * 0.85;
      const cx = -15 + ((c + 0.5) / cols) * spanX + jx;
      const cy = -15 + ((r + 0.5) / rows) * spanY + jy;
      const rx = minR + rand() * (maxR - minR);
      puffs.push({ cx, cy, rx, ry: rx * (0.62 + rand() * 0.3) });
    }
  }
  return puffs;
}

interface LayerSpec {
  puffs: Puff[];
  travel: number;
  scale: number;
  opacity: number;
  drift: number;
  tilt: string;
}

const LAYERS: LayerSpec[] = [
  {
    puffs: buildPuffs(11, 7, 4, 30, 46),
    travel: 1,
    scale: 1.4,
    opacity: 0.55,
    drift: 14,
    tilt: "-4deg",
  },
  {
    puffs: buildPuffs(29, 9, 6, 24, 36),
    travel: 1.22,
    scale: 1.12,
    opacity: 0.8,
    drift: -10,
    tilt: "2deg",
  },
  {
    puffs: buildPuffs(47, 11, 6, 17, 27),
    travel: 1.5,
    scale: 0.88,
    opacity: 0.95,
    drift: 8,
    tilt: "-2deg",
  },
];

function lighten(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix(parseInt(clean.slice(0, 2), 16));
  const g = mix(parseInt(clean.slice(2, 4), 16));
  const b = mix(parseInt(clean.slice(4, 6), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

function CloudBand({
  layer,
  index,
  tint,
}: {
  layer: LayerSpec;
  index: number;
  tint: string;
}) {
  const gradientId = `cloud-grad-${index}`;
  return (
    <Svg
      width={BAND_W}
      height={BAND_H}
      viewBox={`0 0 ${BAND_UNITS_W} ${BAND_UNITS_H}`}
      preserveAspectRatio="none"
    >
      <Defs>
        {/* Opaque core with a long soft falloff — fakes a blurred puff edge
            without needing a blur library, and lets neighbours melt together. */}
        <RadialGradient id={gradientId} cx="50%" cy="42%" r="52%">
          <Stop offset="0" stopColor={tint} stopOpacity="1" />
          <Stop offset="0.42" stopColor={tint} stopOpacity="0.96" />
          <Stop offset="0.68" stopColor={tint} stopOpacity="0.62" />
          <Stop offset="0.86" stopColor={tint} stopOpacity="0.22" />
          <Stop offset="1" stopColor={tint} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {layer.puffs.map((p, i) => (
        <Ellipse
          key={i}
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          fill={`url(#${gradientId})`}
        />
      ))}
    </Svg>
  );
}

export interface CourseSwitchTransitionProps {
  active: boolean;
  toIcon: LucideIcon;
  toTitle: string;
  toPalette: SectionColors[];
  dataReady: boolean;
  onCovered: () => void;
  onFinished: () => void;
}

export function CourseSwitchTransition({
  active,
  toIcon: ToIcon,
  toTitle,
  toPalette,
  dataReady,
  onCovered,
  onFinished,
}: CourseSwitchTransitionProps) {
  const sweep = useRef(new Animated.Value(0)).current;
  const iconIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const [covered, setCovered] = useState(false);
  const coveredAt = useRef(0);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const finishing = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = toPalette[0];
  const tints = useMemo(
    () => [colors.dark, colors.accent, lighten(colors.accent, 0.5)],
    [colors],
  );

  useEffect(() => {
    if (!active) return;
    sweep.setValue(0);
    iconIn.setValue(0);
    pulse.setValue(0);
    setCovered(false);
    finishing.current = false;

    const anim = Animated.timing(sweep, {
      toValue: 0.5,
      duration: COVER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished) return;
      coveredAt.current = Date.now();
      setCovered(true);
      haptics.medium();
      onCovered();

      Animated.spring(iconIn, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();

      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    });

    return () => {
      anim.stop();
      pulseLoop.current?.stop();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !covered || !dataReady || finishing.current) return;
    finishing.current = true;

    const held = Date.now() - coveredAt.current;
    const wait = Math.max(0, MIN_HOLD_MS - held);

    revealTimer.current = setTimeout(() => {
      pulseLoop.current?.stop();
      Animated.parallel([
        Animated.timing(iconIn, {
          toValue: 0,
          duration: 240,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 1,
          duration: REVEAL_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onFinished();
      });
    }, wait);
  }, [active, covered, dataReady, iconIn, sweep, onFinished]);

  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      pulseLoop.current?.stop();
    },
    [],
  );

  if (!active) return null;

  const scrimOpacity = sweep.interpolate({
    inputRange: [0, 0.24, 0.42, 0.5, 0.58, 0.76, 1],
    outputRange: [0, 0.12, 0.94, 1, 0.94, 0.12, 0],
  });

  const iconScale = Animated.multiply(
    iconIn.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }),
  );
  const glowScale = Animated.multiply(
    iconIn.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
    pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }),
  );
  const glowOpacity = Animated.multiply(
    iconIn,
    pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.22] }),
  );
  const labelTranslate = iconIn.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <View style={s.root} pointerEvents="auto">
        <Animated.View
          style={[
            s.scrim,
            { backgroundColor: colors.deep, opacity: scrimOpacity },
          ]}
        />

        {LAYERS.map((layer, i) => {
          const swing = (BAND_W / 2 + BAND_W * 0.75) * layer.travel;
          const translateX = sweep.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [MID_X - swing, MID_X, MID_X + swing],
          });
          const translateY = sweep.interpolate({
            inputRange: [0, 1],
            outputRange: [-layer.drift, layer.drift],
          });
          const opacity = sweep.interpolate({
            inputRange: [0, 0.08, 0.92, 1],
            outputRange: [0, layer.opacity, layer.opacity, 0],
          });

          return (
            <Animated.View
              key={i}
              style={[
                s.band,
                {
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale: layer.scale },
                    { rotate: layer.tilt },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <CloudBand layer={layer} index={i} tint={tints[i]} />
            </Animated.View>
          );
        })}

        <View style={s.center} pointerEvents="none">
          <Animated.View
            style={[
              s.glow,
              {
                backgroundColor: hexToRgba(colors.accent, 0.9),
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              s.mark,
              {
                backgroundColor: colors.deep,
                borderColor: colors.accent,
                opacity: iconIn,
                transform: [{ scale: iconScale }],
              },
            ]}
          >
            <ToIcon size={44} color={colors.accent} strokeWidth={2.2} />
          </Animated.View>

          <Animated.View
            style={[
              s.labelPill,
              { backgroundColor: hexToRgba(colors.deep, 0.85) },
              { opacity: iconIn, transform: [{ translateY: labelTranslate }] },
            ]}
          >
            <Text style={s.label}>{toTitle}</Text>
          </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  band: {
    position: "absolute",
    top: MID_Y,
    left: 0,
    width: BAND_W,
    height: BAND_H,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -21,
  },
  mark: {
    width: 108,
    height: 108,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  labelPill: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  label: {
    color: theme.colors.white,
    fontSize: 19,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.4,
  },
});
