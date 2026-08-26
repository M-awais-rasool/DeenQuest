import React from "react";
import { Svg, Path, Circle, Line } from "react-native-svg";
import type { PosePartProps } from "./wudu";

const STROKE = 5;
const commonProps = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Shared ground line every standing/seated figure rests on. */
function Ground({ color }: { color: string }) {
  return (
    <Line
      x1={14}
      y1={88}
      x2={86}
      y2={88}
      stroke={color}
      strokeWidth={3}
      opacity={0.25}
      strokeLinecap="round"
    />
  );
}

export function SalahTakbir({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={22} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 31 L50 62 M50 62 L40 88 M50 62 L60 88 M50 38 L38 20 M50 38 L62 20"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahQiyam({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={22} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 31 L50 62 M50 62 L40 88 M50 62 L60 88 M50 38 L42 50 L58 50 L50 38"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahQawmah({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={22} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 31 L50 62 M50 62 L40 88 M50 62 L60 88 M50 38 L44 58 M50 38 L56 58"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahRuku({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={74} cy={42} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M67 46 L32 56 M32 56 L28 88 M32 56 L44 88 M60 44 L36 60"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahSujood({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={26} cy={74} r={8} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M33 70 Q46 48 62 48 Q72 48 74 72 L80 88 M46 62 L30 80"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahJalsa({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={30} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 39 L50 62 M50 62 L68 66 L72 84 M50 62 L36 68 L34 84 M50 45 L60 62"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahTashahhud({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={30} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 39 L50 62 M50 62 L68 66 L72 84 M50 62 L36 68 L34 84 M50 45 L64 56 L72 50 M72 50 L74 38"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahSalamRight({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={30} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 39 L50 62 M50 62 L68 66 L72 84 M50 62 L36 68 L34 84 M50 45 L60 62"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M66 24 L76 30 L66 36"
        stroke={color}
        strokeWidth={3.5}
        opacity={0.7}
        {...commonProps}
      />
    </Svg>
  );
}

export function SalahSalamLeft({ color }: PosePartProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Ground color={color} />
      <Circle cx={50} cy={30} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M50 39 L50 62 M50 62 L68 66 L72 84 M50 62 L36 68 L34 84 M50 45 L60 62"
        stroke={color}
        strokeWidth={STROKE}
        {...commonProps}
      />
      <Path
        d="M34 24 L24 30 L34 36"
        stroke={color}
        strokeWidth={3.5}
        opacity={0.7}
        {...commonProps}
      />
    </Svg>
  );
}
