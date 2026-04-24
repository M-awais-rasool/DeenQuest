import React from "react";
import { Crown, Flame, Gem, Trophy, Zap } from "lucide-react-native";

type Props = {
  icon: string;
  color: string;
  size?: number;
};

export function RewardIcon({ icon, color, size = 22 }: Props) {
  switch (icon) {
    case "crown":
      return <Crown size={size} color={color} />;
    case "flame":
      return <Flame size={size} color={color} />;
    case "gem":
      return <Gem size={size} color={color} />;
    case "zap":
      return <Zap size={size} color={color} />;
    default:
      return <Trophy size={size} color={color} />;
  }
}
