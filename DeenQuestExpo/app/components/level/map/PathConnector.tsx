import React, { memo, useMemo } from "react";
import { Dimensions, View } from "react-native";
import { CIRCLE_CY, ROW_PITCH, getNodeOffset } from "./constants";
import { s } from "./styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DOTS = 7;
const T_FROM = 0.2;
const T_TO = 0.72;
const BOW = 16;

export const PathConnector = memo(function PathConnector({
  offsetIndex,
}: {
  offsetIndex: number;
}) {
  const dots = useMemo(() => {
    const x0 = SCREEN_WIDTH / 2 + getNodeOffset(offsetIndex);
    const x1 = SCREEN_WIDTH / 2 + getNodeOffset(offsetIndex + 1);
    const y0 = CIRCLE_CY;
    const y1 = CIRCLE_CY + ROW_PITCH;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2 + BOW * 2;

    return Array.from({ length: DOTS }, (_, i) => {
      const t = T_FROM + ((T_TO - T_FROM) * i) / (DOTS - 1);
      const u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      const swell = Math.sin((i / (DOTS - 1)) * Math.PI);
      const size = 6.4 + swell * 1.8;
      return { x, y, size, opacity: 0.72 + swell * 0.28 };
    });
  }, [offsetIndex]);

  return (
    <View style={s.connector} pointerEvents="none">
      {dots.map((d, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              left: d.x - d.size / 2,
              top: d.y - d.size / 2,
              width: d.size,
              height: d.size,
              borderRadius: d.size * 0.38,
              opacity: d.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
});
