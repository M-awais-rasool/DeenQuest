import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Star } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { type NewlyGrantedReward } from "../../../store/services/api";
import { RewardIcon } from "./RewardIcon";
import { rarityTheme } from "./rarityTheme";

type Props = {
  reward: NewlyGrantedReward;
  fadeAnim: Animated.Value;
  popAnim: Animated.Value;
  ringAnim: Animated.Value;
  onClose: () => void;
};

export function UnlockModal({
  reward,
  fadeAnim,
  popAnim,
  ringAnim,
  onClose,
}: Props) {
  const rt = rarityTheme(reward.rarity);

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdropWrap, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={s.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[s.modalCard, { transform: [{ scale: popAnim }] }]}
          >
            <Animated.View
              style={[
                s.glowRing,
                {
                  backgroundColor: rt.iconBg,
                  transform: [{ scale: ringAnim }],
                  opacity: Animated.subtract(1.4, ringAnim),
                },
              ]}
            />

            <View
              style={[
                s.modalIconWrap,
                { backgroundColor: rt.iconBg, borderColor: rt.border },
              ]}
            >
              <RewardIcon icon={reward.icon} color={rt.iconColor} size={52} />
            </View>

            <Text style={[s.modalEyebrow, { color: rt.pillText }]}>
              🎉 Reward Unlocked!
            </Text>
            <Text style={s.modalTitle}>{reward.title}</Text>
            <Text style={s.modalDesc}>{reward.description}</Text>

            <View
              style={[
                s.bonusPill,
                { backgroundColor: rt.pillBg, borderColor: rt.border },
              ]}
            >
              <Star
                size={14}
                color={theme.colors.secondary}
                fill={theme.colors.secondary}
              />
              <Text style={s.bonusText}>+{reward.xp_bonus} XP bonus</Text>
            </View>

            <TouchableOpacity
              style={[s.awesomeBtn, { backgroundColor: rt.accent }]}
              onPress={onClose}
              activeOpacity={0.88}
            >
              <Text style={s.awesomeBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdropWrap: {
    flex: 1,
    backgroundColor: theme.colors.background80,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdropTouch: {
    width: "100%",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  glowRing: {
    position: "absolute",
    top: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  modalIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 18,
  },
  modalEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 16,
  },
  bonusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  bonusText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "900",
  },
  awesomeBtn: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  awesomeBtnText: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
