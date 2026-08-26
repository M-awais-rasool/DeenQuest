import React from "react";
import { Svg, Path, Circle, G } from "react-native-svg";

export interface PosePartProps {
  color: string;
}

const STROKE = 4.5;
const commonProps = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Droplets({ color, cx }: { color: string; cx: number }) {
  return (
    <G>
      <Path
        d={`M${cx - 10} 30 q-4 8 0 12 q4 -4 0 -12`}
        fill={color}
        opacity={0.55}
      />
      <Path
        d={`M${cx + 6} 22 q-4 8 0 12 q4 -4 0 -12`}
        fill={color}
        opacity={0.85}
      />
    </G>
  );
}

export function WuduWashHands({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Droplets color={color} cx={50} />
      <Path
        d="M28 58 q-6 -20 6 -28 q4 -3 8 0 l2 20"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M72 58 q6 -20 -6 -28 q-4 -3 -8 0 l-2 20"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M24 58 q26 16 52 0"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function WuduRinseMouth({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Path
        d="M50 20 q26 0 26 30 q0 28 -26 28 q-26 0 -26 -28 q0 -30 26 -30 Z"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M36 58 q14 10 28 0"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path d="M50 70 q-4 8 0 12 q4 -4 0 -12" fill={color} opacity={0.85} />
    </Svg>
  );
}

export function WuduRinseNose({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Path
        d="M50 20 q26 0 26 30 q0 28 -26 28 q-26 0 -26 -28 q0 -30 26 -30 Z"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M44 36 q-4 14 0 20 q3 4 12 4"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path d="M62 24 q-4 8 0 12 q4 -4 0 -12" fill={color} opacity={0.85} />
    </Svg>
  );
}

export function WuduWashFace({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Path
        d="M50 16 q28 0 28 32 q0 30 -28 30 q-28 0 -28 -30 q0 -32 28 -32 Z"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M28 40 q10 -6 20 0 t20 0"
        stroke={color}
        strokeWidth={3}
        opacity={0.6}
        {...commonProps}
      />
      <Path
        d="M28 54 q10 -6 20 0 t20 0"
        stroke={color}
        strokeWidth={3}
        opacity={0.6}
        {...commonProps}
      />
    </Svg>
  );
}

export function WuduWashArms({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Droplets color={color} cx={62} />
      <Path
        d="M30 78 L48 40 q3 -6 10 -4 l16 6 q6 2 4 8 q-2 6 -8 4 l-14 -5 L52 74"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Circle cx={30} cy={78} r={7} stroke={color} strokeWidth={STROKE} fill="none" />
    </Svg>
  );
}

export function WuduWipeHead({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Circle cx={50} cy={54} r={28} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path
        d="M26 34 q24 -20 48 0"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function WuduWipeEars({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Path
        d="M40 20 q30 -4 32 30 q2 30 -20 32 q-6 1 -8 -6"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M68 44 q10 -2 10 10 q0 12 -12 10"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function WuduWashFeet({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Droplets color={color} cx={50} />
      <Path
        d="M30 70 L30 44 q0 -8 8 -8 q8 0 8 8 l0 14 q10 -4 18 2 q10 6 8 16 q-2 8 -12 8 L30 70 Z"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}
