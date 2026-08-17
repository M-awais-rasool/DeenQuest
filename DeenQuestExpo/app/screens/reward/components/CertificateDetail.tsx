import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Lock, X } from "lucide-react-native";
import { dq } from "../../../theme/designTokens";
import { RevealText } from "../../../components/level/lesson/shared";
import {
  TactilePressable,
  CertificateFrame,
  CERT_TIMELINE,
} from "../../../components/ui";

const T = CERT_TIMELINE;

export interface CertificateDetailData {
  title: string;
  message?: string;
  nextPhase?: string;
  sectionTitle: string;
  courseLevel: number;
  earned: boolean;
  holderName: string;
}

export function CertificateDetail({
  data,
  visible,
  onClose,
}: {
  data: CertificateDetailData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const earned = !!data?.earned;
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    backdrop.setValue(0);
    sheet.setValue(0);
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(sheet, {
        toValue: 1,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdrop, sheet]);

  if (!data) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I earned the "${data.title}" certificate on DeenQuest! 🎓`,
      });
    } catch {}
  };

  const beat = (ms: number) => (earned ? ms : 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          s.sheet,
          {
            opacity: backdrop,
            transform: [
              {
                translateY: sheet.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={s.handleRow}>
          <View style={s.handle} />
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close certificate"
          >
            <X size={24} color={dq.text} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.eyebrow}>{data.sectionTitle.toUpperCase()}</Text>

          <CertificateFrame
            sealId={`shelf-${data.courseLevel}`}
            animate={earned}
            outerColor={earned ? "#4A3E28" : dq.lockBorder}
            innerColor={earned ? dq.gold : dq.lockBorder}
            sealSlot={
              earned ? undefined : (
                <View style={s.lockCircle}>
                  <Lock size={22} color="#5F7E7C" strokeWidth={2.5} />
                </View>
              )
            }
          >
            <RevealText
              text="CERTIFICATE OF COMPLETION"
              style={s.certLabel}
              containerStyle={s.certLabelWrap}
              delay={beat(T.label)}
              wordStagger={beat(80)}
            />
            <RevealText
              text={data.title}
              style={[s.courseTitle, !earned && { color: dq.muted }]}
              containerStyle={s.courseTitleWrap}
              delay={beat(T.title)}
              wordStagger={beat(90)}
            />
            <RevealText
              text="awarded to"
              style={s.awardedTo}
              containerStyle={s.awardedToWrap}
              delay={beat(T.awardedTo)}
              wordStagger={beat(55)}
            />
            {earned ? (
              <RevealText
                text={data.holderName}
                style={s.name}
                containerStyle={s.nameWrap}
                delay={T.name}
                wordStagger={120}
              />
            ) : (
              <View style={s.nameWrap}>
                <Text style={s.namePlaceholder}>— — — — —</Text>
              </View>
            )}

            <View style={s.metaRow}>
              <View style={s.metaLine} />
              <Text style={s.metaText}>
                {earned ? "COMPLETED" : "NOT YET EARNED"}
              </Text>
              <View style={s.metaLine} />
            </View>
          </CertificateFrame>

          {!!data.message && (
            <RevealText
              text={data.message}
              style={s.message}
              containerStyle={s.messageWrap}
              delay={beat(T.message)}
              wordStagger={beat(45)}
            />
          )}

          {!earned && (
            <View style={s.requirement}>
              <Lock size={13} color={dq.gold} />
              <Text style={s.requirementText}>
                Complete Level {data.courseLevel} to unlock this certificate
              </Text>
            </View>
          )}

          {!!data.nextPhase && earned && (
            <View style={s.nextChip}>
              <Text style={s.nextStar}>✦</Text>
              <Text style={s.nextText}>{data.nextPhase}</Text>
            </View>
          )}

          {earned && (
            <TactilePressable
              edgeColor={dq.goldDark}
              radius={18}
              haptic="medium"
              style={s.shareWrap}
              faceStyle={s.shareBtn}
              onPress={handleShare}
            >
              <Text style={s.shareText}>SHARE CERTIFICATE</Text>
            </TactilePressable>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,14,16,0.82)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 60,
    backgroundColor: dq.screen,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: dq.cardBorder,
  },
  // Tall enough to contain the close button. It is positioned absolutely, and a
  // child that overflows its parent is not touchable on Android — which is
  // exactly how the close button ends up drawn but dead.
  handleRow: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: dq.cardBorder,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 7,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
  },
  scroll: { padding: 22, paddingBottom: 44 },

  eyebrow: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 1.6,
    textAlign: "center",
    marginBottom: 14,
  },

  // carry only the spacing they used to pair with a border.
  lockCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2C464C",
    alignItems: "center",
    justifyContent: "center",
  },

  certLabelWrap: { marginTop: 16, alignSelf: "stretch" },
  certLabel: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.muted,
    letterSpacing: 2.2,
  },
  courseTitleWrap: { marginTop: 12, alignSelf: "stretch" },
  courseTitle: { fontSize: 23, fontFamily: "Nunito_900Black", color: dq.text },
  awardedToWrap: { marginTop: 8, alignSelf: "stretch" },
  awardedTo: { fontSize: 12.5, fontFamily: "Nunito_600SemiBold", color: dq.muted },
  nameWrap: { marginTop: 4, alignSelf: "stretch", alignItems: "center" },
  name: { fontSize: 27, fontFamily: "Amiri_700Bold", color: "#F5CE8A" },
  namePlaceholder: {
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
    color: "#31494B",
    letterSpacing: 3,
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  metaLine: { width: 28, height: 1, backgroundColor: "#4A3E28" },
  metaText: {
    fontSize: 10.5,
    fontFamily: "Nunito_700Bold",
    color: "#5F7E7C",
    letterSpacing: 0.6,
  },

  messageWrap: { marginTop: 18, alignSelf: "stretch" },
  message: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
  },

  requirement: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: dq.goldTint,
    borderWidth: 1,
    borderColor: dq.goldBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.gold,
    flexShrink: 1,
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
  nextStar: { fontSize: 13, color: dq.gold },
  nextText: { fontSize: 12.5, fontFamily: "Nunito_800ExtraBold", color: dq.gold },

  shareWrap: { marginTop: 22 },
  shareBtn: {
    backgroundColor: dq.gold,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  shareText: {
    color: dq.onGold,
    fontFamily: "Nunito_900Black",
    fontSize: 15.5,
    letterSpacing: 1.2,
  },
});
