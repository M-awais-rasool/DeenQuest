import React from "react";
import { View } from "react-native";
import { Svg, Circle } from "react-native-svg";
import {
  WuduWashHands,
  WuduRinseMouth,
  WuduRinseNose,
  WuduWashFace,
  WuduWashArms,
  WuduWipeHead,
  WuduWipeEars,
  WuduWashFeet,
} from "./poses/wudu";
import {
  SalahTakbir,
  SalahQiyam,
  SalahQawmah,
  SalahRuku,
  SalahSujood,
  SalahJalsa,
  SalahTashahhud,
  SalahSalamRight,
  SalahSalamLeft,
} from "./poses/salah";

export type PoseId =
  | "wudu_wash_hands"
  | "wudu_rinse_mouth"
  | "wudu_rinse_nose"
  | "wudu_wash_face"
  | "wudu_wash_arms"
  | "wudu_wipe_head"
  | "wudu_wipe_ears"
  | "wudu_wash_feet"
  | "salah_takbir"
  | "salah_qiyam"
  | "salah_qawmah"
  | "salah_ruku"
  | "salah_sujood"
  | "salah_jalsa"
  | "salah_tashahhud"
  | "salah_salam_right"
  | "salah_salam_left";

const POSES: Record<PoseId, React.FC<{ color: string }>> = {
  wudu_wash_hands: WuduWashHands,
  wudu_rinse_mouth: WuduRinseMouth,
  wudu_rinse_nose: WuduRinseNose,
  wudu_wash_face: WuduWashFace,
  wudu_wash_arms: WuduWashArms,
  wudu_wipe_head: WuduWipeHead,
  wudu_wipe_ears: WuduWipeEars,
  wudu_wash_feet: WuduWashFeet,
  salah_takbir: SalahTakbir,
  salah_qiyam: SalahQiyam,
  salah_qawmah: SalahQawmah,
  salah_ruku: SalahRuku,
  salah_sujood: SalahSujood,
  salah_jalsa: SalahJalsa,
  salah_tashahhud: SalahTashahhud,
  salah_salam_right: SalahSalamRight,
  salah_salam_left: SalahSalamLeft,
};

function UnknownPose({ color }: { color: string }) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Circle
        cx={50}
        cy={50}
        r={10}
        fill={color}
        opacity={0.5}
      />
    </Svg>
  );
}

interface PoseIllustrationProps {
  pose: string;
  size?: number;
  color: string;
}

export function PoseIllustration({
  pose,
  size = 56,
  color,
}: PoseIllustrationProps) {
  const Pose = POSES[pose as PoseId] ?? UnknownPose;
  return (
    <View style={{ width: size, height: size }}>
      <Pose color={color} />
    </View>
  );
}
