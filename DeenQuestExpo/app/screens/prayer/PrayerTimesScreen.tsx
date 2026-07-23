import React, { useEffect } from "react";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bell, ChevronLeft, LocateFixed, MapPin, Settings2 } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { dq } from "../../theme/designTokens";
import { haptics } from "../../utils/haptics";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { NextPrayerHero } from "../../components/prayer/NextPrayerHero";
import { PrayerList } from "../../components/prayer/PrayerList";
import { Toggle } from "../../components/prayer/ReminderToggleRow";
import { usePrayerLocation } from "../../hooks/usePrayerLocation";
import { usePrayerTimes } from "../../hooks/usePrayerTimes";
import {
  getPrayerSettings,
  usePrayerSettings,
} from "../../hooks/usePrayerSettings";
import { scheduleAdhanReminders } from "../../services/adhanScheduler";
import { prayerColors } from "../../theme/prayerTokens";

type Props = NativeStackScreenProps<AppStackParamList, "PrayerTimes">;

export function PrayerTimesScreen({ navigation }: Props) {
  const { location, status, detect } = usePrayerLocation();
  const { settings, update } = usePrayerSettings();
  const { times, next, countdown, ready } = usePrayerTimes();

  const remindersOn = settings.reminders.enabled;
  const offset = settings.reminders.offsetMinutes;

  useEffect(() => {
    const sync = () => {
      if (getPrayerSettings().reminders.enabled) {
        void scheduleAdhanReminders(getPrayerSettings());
      }
    };
    sync();
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") sync();
    });
    return () => sub.remove();
  }, []);

  const nextName = next?.next.name;
  const nextAtMs = next?.next.date.getTime();
  useEffect(() => {
    if (nextName == null || nextAtMs == null) return;
    const ms = nextAtMs - Date.now();
    if (ms < 0 || ms > 6 * 60 * 60 * 1000) return; // only arm within 6h
    const id = setTimeout(() => {
      const st = getPrayerSettings();
      if (
        AppState.currentState === "active" &&
        st.reminders.enabled &&
        st.reminders.perPrayer[nextName]
      ) {
        navigation.navigate("AdhanAlarm", { prayer: nextName });
      }
    }, ms);
    return () => clearTimeout(id);
  }, [nextName, nextAtMs, navigation]);

  const toggleReminders = (on: boolean) => {
    const nextSettings = update((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, enabled: on },
    }));
    void scheduleAdhanReminders(nextSettings);
  };

  const nowMs = Date.now();
  const nextIndex = times.findIndex((t) => t.date.getTime() > nowMs);
  const reminderSub =
    offset > 0 ? `${offset} min before each prayer` : "At the time of Adhan";

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {/* header */}
      <View style={s.header}>
        <AnimatedPressable style={s.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={17} color={dq.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Prayer Times</Text>
          {location ? (
            <View style={s.locationRow}>
              <MapPin size={12} color={prayerColors.blue} strokeWidth={2.4} />
              <Text style={s.locationText}>{location.city}</Text>
            </View>
          ) : null}
        </View>
        {location ? (
          <AnimatedPressable
            style={s.iconBtn}
            onPress={() => navigation.navigate("PrayerSettings")}
          >
            <Settings2 size={17} color={dq.muted} strokeWidth={2} />
          </AnimatedPressable>
        ) : null}
      </View>

      {ready && next ? (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <NextPrayerHero next={next} countdown={countdown} />
          <PrayerList times={times} nextIndex={nextIndex} />

          <AnimatedPressable
            style={s.reminderCard}
            haptic="none"
            onPress={() => {
              haptics.light();
              toggleReminders(!remindersOn);
            }}
          >
            <View style={s.bellTile}>
              <Bell size={18} color={dq.gold} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.reminderTitle}>Adhan reminders</Text>
              <Text style={s.reminderSub}>{reminderSub}</Text>
            </View>
            {/* Display-only: the whole card is the tap target. */}
            <View pointerEvents="none">
              <Toggle value={remindersOn} onValueChange={() => {}} />
            </View>
          </AnimatedPressable>
        </ScrollView>
      ) : (
        <LocationPrompt
          denied={status === "denied"}
          loading={status === "loading"}
          onDetect={() => {
            void haptics.light();
            void detect();
          }}
          onPickCity={() => navigation.navigate("PrayerSettings")}
        />
      )}
    </ScreenWrapper>
  );
}

function LocationPrompt({
  denied,
  loading,
  onDetect,
  onPickCity,
}: {
  denied: boolean;
  loading: boolean;
  onDetect: () => void;
  onPickCity: () => void;
}) {
  return (
    <View style={s.prompt}>
      <View style={s.promptIcon}>
        <MapPin size={42} color={prayerColors.blue} strokeWidth={2} />
      </View>
      <Text style={s.promptTitle}>
        {denied ? "Location is off" : "Set your location"}
      </Text>
      <Text style={s.promptBody}>
        {denied
          ? "We couldn't access your location. Turn it on to auto-detect, or choose a city manually."
          : "We need your city to calculate accurate prayer times for where you are."}
      </Text>

      <View style={s.promptBtns}>
        <TactilePressable
          style={{ alignSelf: "stretch" }}
          faceStyle={s.detectFace}
          edgeColor={prayerColors.blueEdge}
          radius={18}
          depth={5}
          haptic="medium"
          onPress={onDetect}
        >
          <LocateFixed size={17} color={prayerColors.blueDark} strokeWidth={2.4} />
          <Text style={s.detectText}>
            {loading ? "LOCATING…" : "USE MY LOCATION"}
          </Text>
        </TactilePressable>
        <AnimatedPressable style={s.cityBtn} onPress={onPickCity} haptic="none">
          <Text style={s.cityBtnText}>CHOOSE A CITY INSTEAD</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default PrayerTimesScreen;

const s = StyleSheet.create({
  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 2,
  },
  iconBtn: {
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  locationText: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: dq.muted,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },

  // reminders card
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
  bellTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: dq.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: {
    fontSize: 14.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.text,
  },
  reminderSub: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: dq.muted },

  // location prompt
  prompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  promptIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: prayerColors.tileBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: prayerColors.blue,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  promptTitle: {
    fontSize: 23,
    fontFamily: "Nunito_900Black",
    color: dq.text,
    marginTop: 26,
  },
  promptBody: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Nunito_600SemiBold",
    color: dq.muted,
    textAlign: "center",
    marginTop: 10,
  },
  promptBtns: { alignSelf: "stretch", gap: 12, marginTop: 32 },
  detectFace: {
    backgroundColor: prayerColors.blue,
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  detectText: {
    fontSize: 15,
    fontFamily: "Nunito_900Black",
    color: prayerColors.blueDark,
    letterSpacing: 0.8,
  },
  cityBtn: {
    borderWidth: 2,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  cityBtnText: {
    fontSize: 14,
    fontFamily: "Nunito_900Black",
    color: dq.muted,
    letterSpacing: 0.5,
  },
});
