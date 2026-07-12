import React from "react";
import { View, Text, StyleSheet, Share } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { TactilePressable, AnimatedPressable } from "../../ui";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { FadeInView } from "./shared";
import { useAppSelector } from "../../../store/hooks";

function CertificateSeal({ size = 54 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient
          id="certg"
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
      <Circle cx="40" cy="40" r="36" fill="url(#certg)" />
      <Circle cx="40" cy="40" r="29" fill="#0F1D20" />
      <Path
        d="M38 22 A16 16 0 1 0 38 54 A21 21 0 0 1 38 22 Z"
        fill="url(#certg)"
        transform="rotate(-22 40 38)"
      />
      <Path
        d="M47 30 l1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8z"
        fill="#FDF6E3"
      />
    </Svg>
  );
}

const CONFETTI = [
  { top: 96, right: 60, w: 8, h: 12, rotate: "-28deg", color: "#2CC9B5" },
  { top: 210, right: 36, w: 8, h: 8, round: true, color: "#F27FB2" },
  { top: 250, left: 30, w: 9, h: 13, rotate: "40deg", color: "#A78BFA" },
] as const;

export function CertificateComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const user = useAppSelector((state) => state.main.user);
  const displayName =
    user?.display_name || user?.email?.split("@")[0] || "Student";

  const dateLabel = new Date()
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just completed "${data.title}" on DeenQuest! 🎓`,
      });
    } catch {}
  };

  return (
    <View>
      {/* confetti accents */}
      {CONFETTI.map((c, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: c.top - 90,
            left: "left" in c ? c.left : undefined,
            right: "right" in c ? c.right : undefined,
            width: c.w,
            height: c.h,
            backgroundColor: c.color,
            borderRadius: "round" in c && c.round ? c.w / 2 : 2,
            transform: "rotate" in c ? [{ rotate: c.rotate }] : undefined,
            zIndex: 1,
          }}
        />
      ))}

      {/* headline */}
      <FadeInView style={s.headline}>
        <Text style={s.eyebrow}>COURSE COMPLETE</Text>
        <Text style={s.headlineTitle}>MashaAllah, {displayName}!</Text>
      </FadeInView>

      {/* certificate frame */}
      <FadeInView delay={120} style={s.frameOuter}>
        <View style={s.frameInner}>
          <Text style={[s.corner, { top: 8, left: 10 }]}>✦</Text>
          <Text style={[s.corner, { top: 8, right: 10 }]}>✦</Text>
          <Text style={[s.corner, { bottom: 8, left: 10 }]}>✦</Text>
          <Text style={[s.corner, { bottom: 8, right: 10 }]}>✦</Text>

          <CertificateSeal />
          <Text style={s.certLabel}>CERTIFICATE OF COMPLETION</Text>
          <Text style={s.courseTitle}>{data.title}</Text>
          <Text style={s.awardedTo}>awarded to</Text>
          <Text style={s.name}>{displayName}</Text>
          <View style={s.metaRow}>
            <View style={s.metaLine} />
            <Text style={s.metaText}>{dateLabel}</Text>
            <View style={s.metaLine} />
          </View>
        </View>
      </FadeInView>

      {/* message + next phase */}
      {!!data.message && (
        <FadeInView delay={220}>
          <Text style={s.message}>{data.message}</Text>
        </FadeInView>
      )}
      {!!data.next_phase && (
        <View style={s.nextChip}>
          <Text style={s.nextStar}>✦</Text>
          <Text style={s.nextText}>{data.next_phase}</Text>
        </View>
      )}

      {/* actions */}
      <TactilePressable
        edgeColor={theme.colors.goldDark}
        radius={18}
        haptic="medium"
        style={s.shareBtnWrap}
        faceStyle={s.shareBtn}
        onPress={handleShare}
      >
        <Text style={s.shareBtnText}>SHARE CERTIFICATE</Text>
      </TactilePressable>
      <AnimatedPressable style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
      </AnimatedPressable>
    </View>
  );
}

const s = StyleSheet.create({
  headline: {
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.secondary,
    letterSpacing: 2.2,
  },
  headlineTitle: {
    fontSize: 26,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    marginTop: 6,
    textAlign: "center",
  },

  frameOuter: {
    marginTop: 20,
    backgroundColor: "#0F1D20",
    borderWidth: 2,
    borderColor: "#4A3E28",
    borderRadius: 8,
    padding: 8,
  },
  frameInner: {
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    borderRadius: 4,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    fontSize: 12,
    color: theme.colors.secondary,
  },
  certLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 2.4,
    marginTop: 16,
  },
  courseTitle: {
    fontSize: 24,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    marginTop: 12,
    textAlign: "center",
  },
  awardedTo: {
    fontSize: 12.5,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  name: {
    fontSize: 28,
    fontFamily: "Amiri_700Bold",
    color: "#F5CE8A",
    marginTop: 4,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  metaLine: {
    width: 30,
    height: 1,
    backgroundColor: "#4A3E28",
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Nunito_700Bold",
    color: "#5F7E7C",
    letterSpacing: 0.5,
  },

  message: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 18,
  },
  nextChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    backgroundColor: "#3A2F16",
    borderWidth: 1,
    borderColor: "#4A3E28",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 14,
  },
  nextStar: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  nextText: {
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.secondary,
  },

  shareBtnWrap: {
    marginTop: 24,
  },
  shareBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
  },
  shareBtnText: {
    color: theme.colors.onSecondary,
    fontFamily: "Nunito_900Black",
    fontSize: 16,
    letterSpacing: 1.3,
  },
  continueBtn: {
    marginTop: 11,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },
  continueBtnText: {
    color: theme.colors.textMuted,
    fontFamily: "Nunito_900Black",
    fontSize: 15,
    letterSpacing: 0.6,
  },
});
