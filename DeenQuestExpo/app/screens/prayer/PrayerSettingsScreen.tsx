import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Bell, Check, ChevronLeft, MapPin } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable } from "../../components/ui";
import { Toggle } from "../../components/prayer/ReminderToggleRow";
import { dq } from "../../theme/designTokens";
import { haptics } from "../../utils/haptics";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { CALC_METHODS } from "../../utils/prayerCalcMethods";
import { CITIES } from "../../utils/prayerCities";
import type { CalcMethodId, Madhab } from "../../types/prayer";
import { PRAYER_LABELS, PRAYER_ORDER } from "../../types/prayer";
import { usePrayerLocation } from "../../hooks/usePrayerLocation";
import { usePrayerSettings } from "../../hooks/usePrayerSettings";
import {
  scheduleAdhanReminders,
  scheduleTestAdhanInSeconds,
} from "../../services/adhanScheduler";
import { prayerColors } from "../../theme/prayerTokens";

type Props = NativeStackScreenProps<AppStackParamList, "PrayerSettings">;

const OFFSETS = [0, 5, 10, 15, 30];

export function PrayerSettingsScreen({ navigation }: Props) {
  const { settings, update } = usePrayerSettings();
  const { location, status, detect, setManual } = usePrayerLocation();
  const [testMsg, setTestMsg] = useState<string | null>(null);

  // Any settings change re-applies reminders (schedules when on, cancels when off).
  useEffect(() => {
    void scheduleAdhanReminders(settings);
  }, [settings]);

  const reminders = settings.reminders;
  const onCount = PRAYER_ORDER.filter((p) => reminders.perPrayer[p]).length;

  const selectCity = (c: (typeof CITIES)[number]) => {
    haptics.selection();
    setManual({
      coords: { latitude: c.latitude, longitude: c.longitude },
      city: `${c.name}, ${c.country}`,
    });
  };

  const onTestReminder = async () => {
    void haptics.medium();
    await scheduleTestAdhanInSeconds("fajr", 5);
    setTestMsg("Reminder set — minimize the app to hear it in ~5s.");
    setTimeout(() => setTestMsg(null), 6000);
  };

  const togglePrayer = (name: (typeof PRAYER_ORDER)[number]) => {
    haptics.selection();
    update((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        perPrayer: {
          ...prev.reminders.perPrayer,
          [name]: !prev.reminders.perPrayer[name],
        },
      },
    }));
  };

  const modeLabel =
    location?.mode === "auto"
      ? "Set automatically"
      : location?.mode === "manual"
        ? "Chosen manually"
        : "Choose a city below";

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={s.header}>
        <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={17} color={dq.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <Text style={s.headerTitle}>Prayer Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Location ── */}
        <Text style={s.sectionLabel}>LOCATION</Text>
        <View style={s.card}>
          <View style={s.locRow}>
            <MapPin size={17} color={prayerColors.blue} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={s.locCity}>{location?.city ?? "Not set"}</Text>
              <Text style={s.locMode}>{modeLabel}</Text>
            </View>
            <AnimatedPressable
              style={s.gpsPill}
              haptic="none"
              onPress={() => {
                void haptics.light();
                void detect();
              }}
            >
              <Text style={s.gpsText}>{status === "loading" ? "…" : "GPS"}</Text>
            </AnimatedPressable>
          </View>
          <View style={s.chipWrap}>
            {CITIES.map((c) => {
              const selected = location?.city === `${c.name}, ${c.country}`;
              return (
                <AnimatedPressable
                  key={`${c.name}-${c.country}`}
                  style={[s.chip, selected && s.chipOn]}
                  haptic="none"
                  onPress={() => selectCity(c)}
                >
                  <Text style={[s.chipText, selected && s.chipTextOn]}>
                    {c.name}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* ── Calculation method ── */}
        <Text style={s.sectionLabel}>CALCULATION METHOD</Text>
        <View style={s.card}>
          {CALC_METHODS.map((m, i) => {
            const selected = settings.method === m.id;
            return (
              <AnimatedPressable
                key={m.id}
                haptic="none"
                style={[s.methodRow, i !== CALC_METHODS.length - 1 && s.rowBorder]}
                onPress={() => {
                  haptics.selection();
                  update((prev) => ({ ...prev, method: m.id as CalcMethodId }));
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.methodName, !selected && s.methodNameOff]}>
                    {m.label}
                  </Text>
                  <Text style={s.methodHint}>{m.hint}</Text>
                </View>
                {selected ? (
                  <View style={s.radioOn}>
                    <Check size={12} color={dq.onGreen} strokeWidth={3.5} />
                  </View>
                ) : (
                  <View style={s.radioOff} />
                )}
              </AnimatedPressable>
            );
          })}
        </View>

        {/* ── Asr ── */}
        <Text style={s.sectionLabel}>ASR CALCULATION</Text>
        <View style={s.segment}>
          {(
            [
              ["shafi", "Shafi · Standard"],
              ["hanafi", "Hanafi"],
            ] as [Madhab, string][]
          ).map(([mad, label]) => {
            const on = settings.madhab === mad;
            return (
              <AnimatedPressable
                key={mad}
                style={[s.segItem, on && s.segItemOn]}
                haptic="none"
                onPress={() => {
                  haptics.selection();
                  update((prev) => ({ ...prev, madhab: mad }));
                }}
              >
                <Text style={[s.segText, on && s.segTextOn]}>{label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* ── Reminders ── */}
        <Text style={s.sectionLabel}>REMINDERS</Text>
        <View style={s.card}>
          <View style={s.reminderRow}>
            <View style={s.bellTile}>
              <Bell size={16} color={dq.gold} strokeWidth={2.2} />
            </View>
            <Text style={s.reminderLabel}>Adhan reminders</Text>
            <Toggle
              value={reminders.enabled}
              onValueChange={(on) =>
                update((prev) => ({
                  ...prev,
                  reminders: { ...prev.reminders, enabled: on },
                }))
              }
            />
          </View>

          {reminders.enabled ? (
            <>
              <View style={s.chipWrap}>
                {OFFSETS.map((min) => {
                  const on = reminders.offsetMinutes === min;
                  return (
                    <AnimatedPressable
                      key={min}
                      style={[s.chip, on && s.chipOn]}
                      haptic="none"
                      onPress={() => {
                        haptics.selection();
                        update((prev) => ({
                          ...prev,
                          reminders: { ...prev.reminders, offsetMinutes: min },
                        }));
                      }}
                    >
                      <Text style={[s.chipText, on && s.chipTextOn]}>
                        {min === 0 ? "At time" : `${min}m`}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <View style={s.perPrayerRow}>
                <Text style={s.perPrayerLine} numberOfLines={1}>
                  {PRAYER_ORDER.map((name, i) => (
                    <Text
                      key={name}
                      onPress={() => togglePrayer(name)}
                      style={reminders.perPrayer[name] ? s.prayerOn : s.prayerOff}
                    >
                      {i > 0 ? "  ·  " : ""}
                      {PRAYER_LABELS[name]}
                    </Text>
                  ))}
                </Text>
                <Text style={s.onCount}>{onCount} on</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* ── Try it ── */}
        <Text style={s.sectionLabel}>TRY IT</Text>
        <View style={s.tryRow}>
          <AnimatedPressable
            style={s.previewBtn}
            onPress={() => {
              void haptics.medium();
              navigation.navigate("AdhanAlarm", { prayer: "fajr" });
            }}
          >
            <Text style={s.previewText}>Preview Adhan</Text>
          </AnimatedPressable>
          <AnimatedPressable style={s.testBtn} onPress={onTestReminder}>
            <Text style={s.testText}>Test reminder (5s)</Text>
          </AnimatedPressable>
        </View>
        {testMsg ? <Text style={s.testMsg}>{testMsg}</Text> : null}

        <Text style={s.credit}>
          Adhan: Sabah Fakhri · via Wikimedia Commons
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

export default PrayerSettingsScreen;

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: dq.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 19, fontFamily: "Nunito_900Black", color: dq.text },

  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // location
  locRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  locCity: { fontSize: 14, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  locMode: { fontSize: 11, fontFamily: "Nunito_600SemiBold", color: dq.faint },
  gpsPill: {
    backgroundColor: prayerColors.tileBlue,
    borderRadius: 11,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  gpsText: {
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    color: prayerColors.blueLight,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 },
  chip: {
    backgroundColor: prayerColors.dimTile,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    paddingVertical: 5.5,
    paddingHorizontal: 12,
  },
  chipOn: {
    backgroundColor: prayerColors.tileBlue,
    borderColor: prayerColors.blue,
  },
  chipText: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  chipTextOn: { color: prayerColors.blueLight },

  // method
  methodRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: dq.rowBorder },
  methodName: { fontSize: 14, fontFamily: "Nunito_800ExtraBold", color: dq.text },
  methodNameOff: { color: dq.muted },
  methodHint: { fontSize: 11, fontFamily: "Nunito_600SemiBold", color: dq.faint },
  radioOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: dq.green,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: prayerColors.emptyRing,
  },

  // asr segment
  segment: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: prayerColors.dimTile,
    borderRadius: 15,
    padding: 5,
  },
  segItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 11,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  segItemOn: {
    backgroundColor: prayerColors.tileBlue,
    borderColor: prayerColors.blue,
  },
  segText: { fontSize: 13, fontFamily: "Nunito_800ExtraBold", color: dq.muted },
  segTextOn: { color: prayerColors.blueLight },

  // reminders
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  bellTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: dq.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
  },
  perPrayerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: dq.rowBorder,
  },
  perPrayerLine: { flex: 1, fontSize: 13 },
  prayerOn: { fontFamily: "Nunito_700Bold", color: dq.muted },
  prayerOff: { fontFamily: "Nunito_700Bold", color: "#3A4E4C" },
  onCount: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.greenBright,
  },

  // try it
  tryRow: { flexDirection: "row", gap: 10 },
  previewBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: prayerColors.tileBlue,
    borderWidth: 1.5,
    borderColor: prayerColors.border,
    borderRadius: 14,
    paddingVertical: 11,
  },
  previewText: {
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    color: prayerColors.blueLight,
  },
  testBtn: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: dq.cardBorder,
    borderRadius: 14,
    paddingVertical: 11,
  },
  testText: { fontSize: 13, fontFamily: "Nunito_900Black", color: dq.muted },
  testMsg: {
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
    color: dq.greenBright,
    textAlign: "center",
    marginTop: 8,
  },
  credit: {
    fontSize: 10.5,
    lineHeight: 16,
    fontFamily: "Nunito_600SemiBold",
    color: dq.chevron,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 10,
  },
});
