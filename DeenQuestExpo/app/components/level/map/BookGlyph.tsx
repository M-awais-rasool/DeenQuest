import React, { memo } from "react";
import Svg, { Path } from "react-native-svg";

const PAGE =
  "M15.2 5.6 C11.6 3.0 7.2 2.0 3.2 2.0 C1.9 2.0 1 2.9 1 4.1 " +
  "V19.4 C1 20.5 1.9 21.4 3.0 21.4 C7.0 21.4 11.6 22.4 15.2 25.0 Z";

export const BookGlyph = memo(function BookGlyph({
  size = 30,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size * (26 / 32)} viewBox="0 0 32 26">
      <Path d={PAGE} fill={color} />
      <Path d={PAGE} fill={color} transform="translate(32 0) scale(-1 1)" />
    </Svg>
  );
});
