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
      <Circle cx="40" cy="40" r="36" fill={`url(#${id})`} />
      <Circle cx="40" cy="40" r="29" fill="#0F1D20" />
      <Path
        d="M38 22 A16 16 0 1 0 38 54 A21 21 0 0 1 38 22 Z"
        fill={`url(#${id})`}
        transform="rotate(-22 40 38)"
      />
      <Path
        d="M47 30 l1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8z"
        fill="#FDF6E3"
      />
    </Svg>
  );
}

export default CertificateSeal;
