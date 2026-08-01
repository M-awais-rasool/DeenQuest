import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { ProgressRing } from "../../components/hifz/ProgressRing";
import {
  FloatView,
  OutlineButton,
  RadialGlow,
  RatingChip,
  SolidButton,
  hz,
} from "../../components/hifz/ui";
import { haptics } from "../../utils/haptics";
import { sfx } from "../../utils/sfx";
import {
  useCompleteHifzSessionMutation,
  type HifzCompletion,
} from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "HifzResult">;

function relativeDays(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.round((then - Date.now()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "in a week" : `in ${weeks} weeks`;
}

/** Static confetti pieces at the mock's exact positions (J14). */
function Confetti() {
  return (
    <>
      <View style={[s.confetti, { top: 110, left: 54, width: 9, height: 13, backgroundColor: hz.gold, transform: [{ rotate: "24deg" }] }]} />
      <View style={[s.confetti, { top: 80, right: 70, width: 8, height: 12, backgroundColor: hz.teal, transform: [{ rotate: "-20deg" }] }]} />
      <View style={[s.confetti, { top: 184, right: 48, width: 7, height: 7, borderRadius: 4, backgroundColor: "#F27FB2" }]} />
      <View style={[s.confetti, { top: 234, left: 42, width: 8, height: 12, backgroundColor: hz.violet, transform: [{ rotate: "38deg" }] }]} />
    </>
  );
}

export function HifzResultScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const [complete] = useCompleteHifzSessionMutation();

  const [result, setResult] = useState<HifzCompletion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await complete(sessionId).unwrap();
        if (cancelled) return;
        if (!res.data) {
          setError("Could not save this session.");
          return;
        }
        setResult(res.data);
        if (res.data.passed) {
          haptics.success();
          sfx.complete();
        } else {
          haptics.warning();
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.data?.error ?? "Could not save this session.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, complete]);

  const done = () => navigation.navigate("HifzHome");

  if (error) {
    return (
      <ScreenWrapper innerStyle={s.center}>
        <Text style={s.errTitle}>Hmm</Text>
        <Text style={s.errBody}>{error}</Text>
        <OutlineButton
          label="BACK TO MY HIFZ"
          onPress={done}
          style={{ marginTop: 20, alignSelf: "stretch" }}
        />
      </ScreenWrapper>
    );
  }

  if (!result) {
    return (
      <ScreenWrapper innerStyle={s.center}>
        <ActivityIndicator color={hz.teal} />
        <Text style={s.loading}>Saving your progress…</Text>
      </ScreenWrapper>
    );
  }

  const passed = result.passed;
  const ringColor = passed ? hz.teal : hz.gold;
  const nextReview = relativeDays(result.next_review_at);

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* J14: teal radial wash when sealed, gold when it needs more work */}
      <RadialGlow tint={passed ? "#1A3A33" : "#1E1A0E"} cy="28%" />
      {passed && <Confetti />}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* floating ring + headline */}
        <View style={{ alignItems: "center", paddingTop: 24 }}>
          <FloatView>
            <ProgressRing
              pct={result.accuracy_pct}
              size={150}
              stroke={13}
              from={ringColor}
              to={ringColor}
              track="#12241F"
            >
              <Text style={s.ringPct}>{result.accuracy_pct}%</Text>
              <Text style={[s.ringLabel, { color: passed ? hz.tealBright : hz.gold }]}>
                SESSION
              </Text>
            </ProgressRing>
          </FloatView>
          <Text style={s.headline}>
            {result.first_seal
              ? "Memorized!"
              : passed
                ? "Locked in"
                : "Keep working on it"}
          </Text>
          <Text style={s.headSub}>
            {result.portion_label} ·{" "}
            {result.sealed ? "sealed" : "back in the queue"}
          </Text>
        </View>

        {/* strength before → after (J14) */}
        <View style={s.strengthCard}>
          <Text style={s.strengthLabel}>STRENGTH</Text>
          <View style={s.strengthRow}>
            <View style={{ flex: 1, alignItems: "center", gap: 5 }}>
              <Text
                style={[
                  s.strengthPct,
                  {
                    color:
                      result.before.rating === "Strong"
                        ? hz.tealBright
                        : result.before.rating === "Medium"
                          ? hz.gold
                          : hz.rose,
                  },
                ]}
              >
                {result.before.strength_pct}%
              </Text>
              <RatingChip rating={result.before.rating} />
            </View>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12h14M13 6l6 6-6 6"
                stroke={hz.faint}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={{ flex: 1, alignItems: "center", gap: 5 }}>
              <Text
                style={[
                  s.strengthPct,
                  {
                    color:
                      result.after.rating === "Strong"
                        ? hz.tealBright
                        : result.after.rating === "Medium"
                          ? hz.gold
                          : hz.rose,
                  },
                ]}
              >
                {result.after.strength_pct}%
              </Text>
              <RatingChip rating={result.after.rating} />
            </View>
          </View>
        </View>

        {/* stat tiles (J14) */}
        <View style={s.tileRow}>
          <View style={s.tile}>
            <Text style={[s.tileValue, { color: hz.gold }]}>
              +{result.xp_earned}
            </Text>
            <Text style={s.tileLabel}>XP</Text>
          </View>
          <View style={s.tile}>
            <Text style={[s.tileValue, { color: hz.gold }]}>
              {result.streak_days}
            </Text>
            <Text style={s.tileLabel}>DAY STREAK</Text>
          </View>
          <View style={s.tile}>
            <Text style={[s.tileValue, { color: hz.skyBright }]}>
              {result.sealed ? `${result.interval_days}d` : "TODAY"}
            </Text>
            <Text style={s.tileLabel}>
              {result.sealed ? "NEXT REVIEW" : "TRY AGAIN"}
            </Text>
          </View>
        </View>

        {/* sky explainer (J14) — a portion that did not seal is still Sabaq */}
        <View style={s.explainCard}>
          <Text style={s.explainStar}>✦</Text>
          {result.sealed ? (
            <Text style={s.explainText}>
              You'll see this portion again{" "}
              <Text style={s.explainStrong}>{nextReview ?? "soon"}</Text> as
              Sabqi. Each clean recall pushes it further out.
            </Text>
          ) : (
            <Text style={s.explainText}>
              This portion stays in <Text style={s.explainStrong}>Sabaq</Text>.
              It is only memorized once you recite it from memory cleanly — pick
              it up again whenever you're ready.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <SolidButton label="DONE FOR TODAY" onPress={done} />
        <OutlineButton
          label="REVIEW THE MISTAKES"
          onPress={() => navigation.navigate("HifzMistakes")}
          size="md"
        />
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    gap: 8,
  },
  loading: { fontFamily: "Nunito_600SemiBold", fontSize: 12.5, color: hz.faint },
  errTitle: { fontFamily: "Nunito_900Black", fontSize: 18, color: hz.text },
  errBody: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    lineHeight: 20,
    color: hz.muted,
    textAlign: "center",
  },

  confetti: { position: "absolute", borderRadius: 2 },

  scroll: { paddingHorizontal: 20, paddingBottom: 12 },

  ringPct: { fontFamily: "Nunito_900Black", fontSize: 40, lineHeight: 44, color: hz.text },
  ringLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
  headline: {
    fontFamily: "Nunito_900Black",
    fontSize: 27,
    color: hz.text,
    marginTop: 22,
  },
  headSub: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: hz.muted,
    marginTop: 4,
  },

  strengthCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 24,
  },
  strengthLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10.5,
    letterSpacing: 1.3,
    color: hz.faint,
    textAlign: "center",
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
  },
  strengthPct: { fontFamily: "Nunito_900Black", fontSize: 19 },

  tileRow: { flexDirection: "row", gap: 11, marginTop: 12 },
  tile: {
    flex: 1,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  tileValue: { fontFamily: "Nunito_900Black", fontSize: 17 },
  tileLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    letterSpacing: 0.8,
    color: hz.faint,
    marginTop: 2,
  },

  explainCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: hz.skyCard,
    borderWidth: 1,
    borderColor: hz.skyEdge,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 12,
  },
  explainStar: { fontSize: 15, color: hz.sky },
  explainText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 19.5,
    color: hz.skyBright,
  },
  explainStrong: { fontFamily: "Nunito_800ExtraBold", color: hz.text },

  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24, gap: 10 },
});

export default HifzResultScreen;
