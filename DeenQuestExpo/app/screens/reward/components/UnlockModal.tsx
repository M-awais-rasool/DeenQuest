import React from "react";
import { Animated, Modal, Share, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Line,
  G,
} from "react-native-svg";
import {
  X,
  Sparkles,
  Sparkle,
  Zap,
  Gift,
  Share2,
} from "lucide-react-native";
import { TactilePressable } from "../../../components/ui";
import { dq } from "../../../theme/designTokens";
import { type NewlyGrantedReward } from "../../../store/services/api";
import { RewardIcon } from "./RewardIcon";

type Props = {
  reward: NewlyGrantedReward;
  fadeAnim: Animated.Value;
  popAnim: Animated.Value;
  ringAnim: Animated.Value;
  onClose: () => void;
};

const CONFETTI: {
  top: number;
  left: number;
  size: number;
  square?: boolean;
  color: string;
}[] = [
  { top: 118, left: 58, size: 9, color: dq.green },
  { top: 176, left: 330, size: 8, square: true, color: dq.gold },
  { top: 250, left: 40, size: 8, square: true, color: dq.gold },
  { top: 300, left: 352, size: 9, color: dq.green },
  { top: 96, left: 250, size: 7, color: dq.gold },
  { top: 212, left: 78, size: 7, square: true, color: dq.green },
  { top: 140, left: 300, size: 6, color: dq.gold },
  { top: 360, left: 96, size: 7, color: dq.gold },
  { top: 330, left: 300, size: 8, square: true, color: dq.green },
  { top: 88, left: 120, size: 7, square: true, color: dq.gold },
];

// Sunburst rays drawn from the centre outward.
const RAYS = Array.from({ length: 18 }, (_, i) => i * 20);

export function UnlockModal({
  reward,
  fadeAnim,
  popAnim,
  ringAnim,
  onClose,
}: Props) {
  const onShare = async () => {
    try {
      await Share.share({
        message: `I just unlocked "${reward.title}" on DeenQuest! 🏅`,
      });
    } catch {}
  };

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.root, { opacity: fadeAnim }]}>
        {/* ambient glow */}
        <Animated.View
          style={[s.glow, { transform: [{ scale: ringAnim }] }]}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="28%" r="60%">
                <Stop offset="0%" stopColor={dq.gold} stopOpacity={0.18} />
                <Stop offset="45%" stopColor={dq.gold} stopOpacity={0.05} />
                <Stop offset="70%" stopColor={dq.screen} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
          </Svg>
        </Animated.View>

        {/* sunburst rays */}
        <View style={s.sunburst} pointerEvents="none">
          <Svg width={360} height={360} viewBox="0 0 360 360">
            <G>
              {RAYS.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const cx = 180;
                const cy = 180;
                return (
                  <Line
                    key={deg}
                    x1={cx + Math.cos(rad) * 55}
                    y1={cy + Math.sin(rad) * 55}
                    x2={cx + Math.cos(rad) * 150}
                    y2={cy + Math.sin(rad) * 150}
                    stroke={dq.gold}
                    strokeOpacity={0.12}
                    strokeWidth={8}
                  />
                );
              })}
            </G>
          </Svg>
        </View>

        {/* confetti */}
        {CONFETTI.map((c, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: c.top,
              left: c.left,
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              borderRadius: c.square ? 0 : c.size / 2,
              transform: c.square ? [{ rotate: "45deg" }] : undefined,
            }}
          />
        ))}

        {/* close */}
        <TactilePressable
          style={s.closeWrap}
          faceStyle={s.closeFace}
          edgeColor="rgba(0,0,0,0.4)"
          faceUnderlayColor={dq.screen}
          radius={17}
          depth={3}
          haptic="light"
          onPress={onClose}
        >
          <X size={17} color="#8DA5A3" />
        </TactilePressable>

        {/* content */}
        <View style={s.content}>
          <Animated.View style={[s.medallion, { transform: [{ scale: popAnim }] }]}>
            <View style={s.dashedRing} />
            <LinearGradient
              colors={["#F9DDA0", "#EFB65A", "#C98F35"]}
              start={{ x: 0.34, y: 0.28 }}
              end={{ x: 1, y: 1 }}
              style={s.medallionCore}
            >
              <RewardIcon icon={reward.icon} color="#3A2A08" size={54} />
            </LinearGradient>
            <Sparkles size={22} color={dq.gold} style={s.sparkTop} />
            <Sparkle size={15} color={dq.gold} style={s.sparkBottom} />
          </Animated.View>

          <Text style={s.eyebrow}>BADGE UNLOCKED</Text>
          <Text style={s.title}>{reward.title}</Text>
          <Text style={s.desc}>{reward.description}</Text>

          <View style={s.xpPill}>
            <Zap size={16} color={dq.gold} />
            <Text style={s.xpText}>+{reward.xp_bonus} XP earned</Text>
          </View>
        </View>

        {/* actions */}
        <View style={s.actions}>
          <TactilePressable
            faceStyle={s.claimBtn}
            edgeColor="#1B9484"
            faceUnderlayColor={dq.green}
            radius={16}
            depth={4}
            haptic="medium"
            onPress={onClose}
          >
            <Gift size={17} color={dq.onGreen} />
            <Text style={s.claimText}>Claim reward</Text>
          </TactilePressable>
          <TactilePressable
            faceStyle={s.shareBtn}
            edgeColor="rgba(0,0,0,0.4)"
            faceUnderlayColor={dq.screen}
            radius={16}
            depth={3}
            haptic="light"
            onPress={onShare}
          >
            <Share2 size={16} color={dq.text} />
            <Text style={s.shareText}>Share achievement</Text>
          </TactilePressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 560,
  },
  sunburst: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  closeWrap: {
    position: "absolute",
    top: 60,
    right: 22,
    zIndex: 3,
  },
  closeFace: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  medallion: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  dashedRing: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "rgba(255,219,60,0.4)",
    borderStyle: "dashed",
  },
  medallionCore: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,233,168,0.7)",
    shadowColor: dq.gold,
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  sparkTop: { position: "absolute", top: 6, right: 10 },
  sparkBottom: { position: "absolute", bottom: 14, left: 6 },

  eyebrow: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    letterSpacing: 2.1,
    color: dq.gold,
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito_900Black",
    color: dq.white,
    marginTop: 8,
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    lineHeight: 21,
    color: "#8DA5A3",
    textAlign: "center",
    marginTop: 12,
    maxWidth: 260,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 22,
    backgroundColor: dq.gold12,
    borderWidth: 1,
    borderColor: dq.gold25,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 99,
  },
  xpText: { fontSize: 14, fontFamily: "Nunito_900Black", color: dq.gold },

  actions: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 12,
  },
  claimBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: dq.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: dq.green,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  claimText: { fontSize: 15, fontFamily: "Nunito_800ExtraBold", color: dq.onGreen },
  shareBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareText: { fontSize: 14, fontFamily: "Nunito_800ExtraBold", color: dq.text },
});
