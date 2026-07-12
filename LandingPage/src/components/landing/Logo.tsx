import type { CSSProperties } from "react";

interface LogoProps {
  size?: number;
  /** border-radius of the svg element itself */
  radius?: number;
  /** rx of the inner rounded square */
  rectRadius?: number;
  /** unique gradient id (must differ per instance on the page) */
  gradientId: string;
  /** drop the moon + stalk detail (footer variant) */
  simplified?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Logo({
  size = 38,
  radius = 11,
  rectRadius = 18,
  gradientId,
  simplified = false,
  className,
  style,
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      style={{ borderRadius: radius, ...style }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="12"
          y1="0"
          x2="62"
          y2="80"
        >
          <stop offset="0" stopColor="#F9D98C" />
          <stop offset="1" stopColor="#D08A22" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="78" height="78" rx={rectRadius} fill={`url(#${gradientId})`} />
      <g fill="#0B3B33">
        <path d="M40 16 C55 25 61 38 61 64 H19 C19 38 25 25 40 16 Z" />
        {!simplified && <rect x="38.7" y="9" width="2.6" height="8" rx="1.3" />}
        {!simplified && (
          <path d="M40 1.5 A4.5 4.5 0 1 0 40 10.5 A6 6 0 0 1 40 1.5 Z" transform="rotate(-20 40 6)" />
        )}
      </g>
      <path d="M33 64 v-12 a7 7 0 0 1 14 0 v12 z" fill={`url(#${gradientId})`} />
    </svg>
  );
}
