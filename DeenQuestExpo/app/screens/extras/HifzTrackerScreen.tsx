import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { ChevronLeft, RotateCcw } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { dq } from "../../theme/designTokens";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "HifzTracker">;

// Mock hifz data (H2 mock) — real memorization tracking comes later.
const MEMORIZED = 11;
const TOTAL = 37;
const AYAHS_BY_HEART = 142;

const STRENGTH: {
  surah: string;
  surahId: number;
  pct: number;
  label: "Strong" | "Fading" | "Weak";
}[] = [
  { surah: "الناس", surahId: 114, pct: 95, label: "Strong" },
  { surah: "الفلق", surahId: 113, pct: 88, label: "Strong" },
  { surah: "العاديات", surahId: 100, pct: 54, label: "Fading" },
  { surah: "التين", surahId: 95, pct: 30, label: "Weak" },
];

const LABEL_COLOR: Record<string, string> = {
  Strong: "#5EE0CE",
  Fading: dq.gold,
  Weak: theme.colors.error,
};
const BAR_COLOR: Record<string, string> = {
  Strong: dq.green,
  Fading: dq.gold,
  Weak: theme.colors.error,
};

function ProgressRing() {
  const r = 40;
  const c = 2 * Math.PI * r;
  const pct = MEMORIZED / TOTAL;
  return (
    <View style={s.ringWrap}>
      <Svg width={92} height={92} viewBox="0 0 92 92">
        <Circle cx={46} cy={46} r={r} stroke="#1B3036" strokeWidth={11} fill="none" />
        <Circle
          cx={46}
          cy={46}
          r={r}
          stroke={dq.gold}
          strokeWidth={11}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 46 46)"
        />
      </Svg>
      <View style={s.ringCenter}>
        <Text style={s.ringNum}>{MEMORIZED}</Text>
        <Text style={s.ringOf}>OF {TOTAL}</Text>
      </View>
    </View>
  );
}

export function HifzTrackerScreen({ navigation }: Props) {
  const startReview = () => {
    // Reviews open the weakest surah in the reader for now.
    navigation.navigate("SurahDetail", { surahId: 95 });
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* header */}
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Hifz</Text>
          <Text style={s.headerSub}>Memorization journey</Text>
        </View>
        <View style={s.juzChip}>
          <Text style={s.juzChipText}>JUZ 30</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* progress hero */}
        <View style={s.heroCard}>
          <ProgressRing />
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Surahs memorized</Text>
            <Text style={s.heroSub}>
              An-Nas → Ad-Duha done. Al-Layl is next.
            </Text>
            <View style={s.ayahRow}>
              <Text style={s.ayahStar}>✦</Text>
              <Text style={s.ayahText}>{AYAHS_BY_HEART} ayahs by heart</Text>
            </View>
          </View>
        </View>

        {/* review due */}
        <LinearGradient
          colors={["#3A2F16", "#16272B"]}
          locations={[0, 0.75]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.reviewCard}
        >
          <View style={s.reviewTop}>
            <View style={s.reviewIcon}>
              <RotateCcw size={19} color={dq.onGold} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.reviewTitle}>Review due today</Text>
              <Text style={s.reviewSub}>
                3 surahs fading — refresh before they slip
              </Text>
            </View>
            <View style={s.reviewCount}>
              <Text style={s.reviewCountText}>3</Text>
            </View>
          </View>
          <TactilePressable
            faceStyle={s.reviewBtn}
            edgeColor={dq.goldDark}
            radius={14}
            depth={4}
            haptic="medium"
            style={{ marginTop: 13 }}
            onPress={startReview}
          >
            <Text style={s.reviewBtnText}>START REVIEW · 5 MIN</Text>
          </TactilePressable>
        </LinearGradient>

        {/* memory strength */}
        <View style={s.strengthHeader}>
          <Text style={s.strengthTitle}>Memory strength</Text>
          <Pressable
            onPress={() =>
              navigation.navigate("Demo", { screen: "QuranScreen" })
            }
            hitSlop={8}
          >
            <Text style={s.seeAll}>See all →</Text>
          </Pressable>
        </View>
        <View style={s.strengthCard}>
          {STRENGTH.map((row, i) => (
            <Pressable
              key={row.surah}
              onPress={() =>
                navigation.navigate("SurahDetail", { surahId: row.surahId })
              }
              style={({ pressed }) => [
                s.strengthRow,
                i < STRENGTH.length - 1 && s.strengthRowBorder,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={s.strengthSurah}>{row.surah}</Text>
              <View style={s.strengthTrack}>
                <View
                  style={[
                    s.strengthFill,
                    {
                      width: `${row.pct}%`,
                      backgroundColor: BAR_COLOR[row.label],
                    },
                  ]}
                />
              </View>
              <Text
                style={[s.strengthLabel, { color: LABEL_COLOR[row.label] }]}
              >
                {row.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Nunito_900Black", color: dq.text },
  headerSub: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: dq.faint },
  juzChip: {
    backgroundColor: dq.goldTint,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  juzChipText: { fontSize: 11, fontFamily: "Nunito_900Black", color: dq.gold },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 24,
    padding: 20,
  },
  ringWrap: { width: 92, height: 92 },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringNum: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: "Nunito_900Black",
    color: dq.gold,
  },
  ringOf: { fontSize: 9, fontFamily: "Nunito_800ExtraBold", color: dq.faint },
  heroTitle: { fontSize: 16, fontFamily: "Nunito_900Black", color: dq.text },
  heroSub: {
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    marginTop: 4,
  },
  ayahRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  ayahStar: { fontSize: 13, color: dq.gold },
  ayahText: { fontSize: 11.5, fontFamily: "Nunito_800ExtraBold", color: dq.gold },

  reviewCard: {
    borderWidth: 1.5,
    borderColor: dq.gold,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 17,
    marginTop: 16,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: dq.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewTitle: { fontSize: 14.5, fontFamily: "Nunito_900Black", color: dq.text },
  reviewSub: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: "#D9BC85",
    marginTop: 1,
  },
  reviewCount: {
    backgroundColor: dq.card,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  reviewCountText: { fontSize: 12, fontFamily: "Nunito_900Black", color: dq.gold },
  reviewBtn: {
    backgroundColor: dq.gold,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  reviewBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    color: dq.onGold,
    letterSpacing: 0.7,
  },

  strengthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  strengthTitle: { fontSize: 15, fontFamily: "Nunito_900Black", color: dq.text },
  seeAll: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.green },
  strengthCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 12,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  strengthRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dq.rowBorder,
  },
  strengthSurah: {
    width: 70,
    fontSize: 19,
    fontFamily: "Amiri_700Bold",
    color: dq.muted,
    writingDirection: "rtl",
  },
  strengthTrack: {
    flex: 1,
    height: 8,
    borderRadius: 5,
    backgroundColor: dq.screen,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 5 },
  strengthLabel: {
    width: 46,
    textAlign: "right",
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
  },
});

export default HifzTrackerScreen;
