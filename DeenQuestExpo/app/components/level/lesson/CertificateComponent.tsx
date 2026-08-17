import React from "react";
import { View, Text, StyleSheet, Share } from "react-native";
import {
  TactilePressable,
  AnimatedPressable,
  CertificateFrame,
  CERT_TIMELINE,
} from "../../ui";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { FadeInView, RevealText } from "./shared";
import { useAppSelector } from "../../../store/hooks";

const T = CERT_TIMELINE;

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
      <View style={s.headline}>
        <RevealText text="COURSE COMPLETE" style={s.eyebrow} wordStagger={70} />
        <RevealText
          text={`MashaAllah, ${displayName}!`}
          style={s.headlineTitle}
          delay={180}
          wordStagger={110}
        />
      </View>

      {/* certificate frame */}
      <CertificateFrame sealId="award-seal">
        <RevealText
          text="CERTIFICATE OF COMPLETION"
          style={s.certLabel}
          containerStyle={s.certLabelWrap}
          delay={T.label}
          wordStagger={80}
        />
        <RevealText
          text={String(data.title ?? "")}
          style={s.courseTitle}
          containerStyle={s.courseTitleWrap}
          delay={T.title}
          wordStagger={90}
        />
        <RevealText
          text="awarded to"
          style={s.awardedTo}
          containerStyle={s.awardedToWrap}
          delay={T.awardedTo}
        />
        <RevealText
          text={displayName}
          style={s.name}
          containerStyle={s.nameWrap}
          delay={T.name}
          wordStagger={120}
        />
        <FadeInView delay={T.meta}>
          <View style={s.metaRow}>
            <View style={s.metaLine} />
            <Text style={s.metaText}>{dateLabel}</Text>
            <View style={s.metaLine} />
          </View>
        </FadeInView>
      </CertificateFrame>

      {/* message + next phase */}
      {!!data.message && (
        <RevealText
          text={String(data.message)}
          style={s.message}
          containerStyle={s.messageWrap}
          delay={T.message}
          wordStagger={45}
        />
      )}
      {!!data.next_phase && (
        <FadeInView delay={T.nextPhase}>
          <View style={s.nextChip}>
            <Text style={s.nextStar}>✦</Text>
            <Text style={s.nextText}>{data.next_phase}</Text>
          </View>
        </FadeInView>
      )}

      {/* actions */}
      <FadeInView delay={T.actions}>
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
      </FadeInView>
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

  // RevealText lays each word out itself, so the centering and spacing that
  // used to live on the Text styles moves onto these wrappers.
  certLabelWrap: { marginTop: 16, alignSelf: "stretch" },
  courseTitleWrap: { marginTop: 12, alignSelf: "stretch" },
  awardedToWrap: { marginTop: 8, alignSelf: "stretch" },
  nameWrap: { marginTop: 4, alignSelf: "stretch" },
  messageWrap: { marginTop: 18, alignSelf: "stretch" },
  certLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 2.4,
  },
  courseTitle: {
    fontSize: 24,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
  },
  awardedTo: {
    fontSize: 12.5,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
  },
  name: {
    fontSize: 28,
    fontFamily: "Amiri_700Bold",
    color: "#F5CE8A",
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
