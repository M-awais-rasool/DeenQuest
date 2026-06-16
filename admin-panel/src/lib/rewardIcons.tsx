import {
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  BoltIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import type { ComponentType, CSSProperties, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// Reward icon names (crown|flame|gem|trophy|zap) → real icons.
const ICONS: Record<string, Icon> = {
  trophy: TrophyIcon,
  crown: StarIcon,
  flame: FireIcon,
  gem: SparklesIcon,
  zap: BoltIcon,
};

const RARITY_COLOR: Record<string, string> = {
  rare: "#60a5fa",
  epic: "#c084fc",
  legendary: "#fbbf24",
};

export function RewardIcon({
  icon,
  className = "w-5 h-5",
  style,
}: {
  icon: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = ICONS[icon] ?? TrophyIcon;
  return <Icon className={className} style={style} />;
}

export function rarityColor(rarity: string): string {
  return RARITY_COLOR[rarity] ?? "#94a3b8";
}
