import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable } from "../../components/ui";
import { SectionLabel, SolidButton, hz } from "../../components/hifz/ui";
import { haptics } from "../../utils/haptics";
import {
  useEnrollHifzMutation,
  useGetHifzPlansQuery,
  useGetHifzSettingsQuery,
  useGetHifzTodayQuery,
} from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "HifzPlanPicker">;

export function HifzPlanPickerScreen({ navigation }: Props) {
  const plansQ = useGetHifzPlansQuery();
  const settingsQ = useGetHifzSettingsQuery();
  const todayQ = useGetHifzTodayQuery();
  const [enroll, { isLoading: enrolling }] = useEnrollHifzMutation();

  const plans = plansQ.data?.data ?? [];
  const reciters = settingsQ.data?.data?.reciters ?? [];

  const [planId, setPlanId] = useState<string | null>(null);
  const [reciterId, setReciterId] = useState<string | null>(null);

  const enrolled = todayQ.data?.data?.enrolled ? todayQ.data.data : null;

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    // Wait for both queries so we never hydrate from half the picture.
    if (plans.length === 0 || todayQ.isLoading) return;
    hydratedRef.current = true;

    const current = plans.find((p) => p.enrolled) ?? plans[0];
    setPlanId(current.id);
    setReciterId(enrolled?.reciter_id ?? reciters[0]?.id ?? null);
  }, [plans, todayQ.isLoading, enrolled, reciters]);

  // A reciter list that arrives after hydration still needs a valid selection.
  useEffect(() => {
    if (!reciterId && reciters.length > 0) setReciterId(reciters[0].id);
  }, [reciters, reciterId]);

  const loading = plansQ.isLoading || settingsQ.isLoading || todayQ.isLoading;

  const start = async () => {
    if (!planId) return;
    try {
      await enroll({
        plan_id: planId,
        reciter_id: reciterId ?? undefined,
      }).unwrap();
      haptics.success();
      navigation.goBack();
    } catch {
      haptics.error();
    }
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={17} color={hz.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View>
          <Text style={s.headerTitle}>Choose a plan</Text>
          <Text style={s.headerSub}>You can change this any time</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={hz.teal} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
          >
            {plans.map((plan, idx) => {
              const active = plan.id === planId;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    haptics.selection();
                    setPlanId(plan.id);
                  }}
                  style={[
                    s.planCard,
                    idx > 0 && { marginTop: 11 },
                    active && s.planCardActive,
                  ]}
                >
                  <View style={s.planTop}>
                    <View
                      style={[
                        s.planIcon,
                        { backgroundColor: active ? hz.tealTint : plan.accent + "22" },
                      ]}
                    >
                      <Text style={s.planIconGlyph}>{plan.icon}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.planTitle}>{plan.title}</Text>
                      <Text style={s.planSub} numberOfLines={1}>
                        {plan.subtitle}
                      </Text>
                      {!active && (
                        <Text style={s.planMeta}>
                          {plan.portion_count} portions · {plan.ayah_count} ayahs
                        </Text>
                      )}
                    </View>
                    {active ? (
                      <View style={s.planCheck}>
                        <Text style={s.planCheckGlyph}>✓</Text>
                      </View>
                    ) : (
                      <View style={s.planRadio} />
                    )}
                  </View>

                  {/* Stats strip only on the selected card (J4) */}
                  {active && (
                    <View style={s.planStats}>
                      <StatTile label="PORTIONS" value={String(plan.portion_count)} />
                      <StatTile label="AYAHS" value={String(plan.ayah_count)} />
                      <StatTile
                        label="XP EACH"
                        value={String(plan.xp_per_portion)}
                        color={hz.gold}
                      />
                      <StatTile
                        label="DONE"
                        value={String(plan.portions_sealed)}
                        color={hz.tealBright}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}



            {reciters.length > 0 && (
              <>
                <SectionLabel style={s.groupLabel}>RECITER</SectionLabel>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {reciters.map((reciter) => {
                    const active = reciter.id === reciterId;
                    return (
                      <Pressable
                        key={reciter.id}
                        onPress={() => {
                          haptics.selection();
                          setReciterId(reciter.id);
                        }}
                        style={[s.reciterChip, active && s.reciterChipActive]}
                      >
                        <Text
                          style={[
                            s.reciterText,
                            active && { color: hz.tealBright },
                          ]}
                        >
                          {reciter.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>

          {/* Sticky CTA over a fade (J4) */}
          <View style={s.footerWrap}>
            <LinearGradient
              colors={["rgba(11,21,23,0)", hz.screen]}
              locations={[0, 0.4]}
              style={StyleSheet.absoluteFill}
            />
            <SolidButton
              label={enrolling ? "STARTING…" : "START THIS PLAN"}
              onPress={start}
              disabled={!planId || enrolling}
            />
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}

function StatTile({
  label,
  value,
  color = hz.text,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={s.statTile}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Nunito_900Black", fontSize: 19, color: hz.text },
  headerSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: hz.muted,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 110 },

  planCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: hz.teal,
    shadowColor: hz.tealTint,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  planTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  planIconGlyph: { fontSize: 19 },
  planTitle: { fontFamily: "Nunito_900Black", fontSize: 15.5, color: hz.text },
  planSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: hz.muted,
    marginTop: 1,
  },
  planMeta: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: hz.faint,
    marginTop: 4,
  },
  planCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: hz.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  planCheckGlyph: { fontFamily: "Nunito_900Black", fontSize: 12, color: hz.onTeal },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: hz.wellDash,
  },
  planStats: { flexDirection: "row", gap: 8, marginTop: 12 },
  statTile: {
    flex: 1,
    backgroundColor: hz.inset,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  statValue: { fontFamily: "Nunito_900Black", fontSize: 14 },
  statLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 8.5,
    letterSpacing: 0.5,
    color: hz.faint,
    marginTop: 1,
  },

  groupLabel: { marginTop: 16, marginBottom: 8, marginLeft: 4 },



  reciterChip: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  reciterChipActive: {
    backgroundColor: hz.tealTint,
    borderWidth: 1.5,
    borderColor: hz.teal,
  },
  reciterText: { fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: hz.muted },

  footerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
  },
});

export default HifzPlanPickerScreen;
