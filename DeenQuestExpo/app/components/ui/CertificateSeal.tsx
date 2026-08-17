import React from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";

export function CertificateSeal({
  size = 54,
  id = "certseal",
}: {
  size?: number;
  id?: string;
}) {
  const gold = `url(#${id})`;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="12"
          y1="0"
          x2="62"
          y2="80"
        >
          <Stop offset="0" stopColor="#F9D98C" />
          <Stop offset="1" stopColor="#D08A22" />
        </SvgLinearGradient>
      </Defs>

      {/* wax disc */}
      <Circle cx="40" cy="40" r="36" fill={gold} />
      <Circle cx="40" cy="40" r="30" fill="#0F1D20" />

      {/* the open mushaf: two leaves meeting at the spine */}
      <Path
        d="M40 30 C34 26 26 26 21 28 L21 50 C26 48 34 48 40 52 C46 48 54 48 59 50 L59 28 C54 26 46 26 40 30 Z"
        fill="none"
        stroke={gold}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Path d="M40 30 L40 52" stroke={gold} strokeWidth={2.6} strokeLinecap="round" />

      {/* lines of text, short enough to stay legible when the seal is tiny */}
      <Path
        d="M26 35 h9 M26 40.5 h9 M45 35 h9 M45 40.5 h9"
        stroke={gold}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.72}
      />
    </Svg>
  );
}

export default CertificateSeal;
