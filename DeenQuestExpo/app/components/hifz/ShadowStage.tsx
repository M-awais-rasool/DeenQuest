import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { OutlineButton, PulseRing, SolidButton, hz } from "./ui";
import { AYAH_FONT } from "./ui";
import { haptics } from "../../utils/haptics";
import { useAyahAudio } from "./useAyahAudio";
import type { HifzSessionAyah } from "../../store/services/api";

function SoundWave({ size = 38, color = hz.skyBright }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5.5v13M7 8.5v7M15 8v8M3.5 11v2M19 9.5v5M22.5 11v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShadowStage({
  surahId,
  ayahs,
  reciterId,
  onDone,
}: {
  surahId: number;
  ayahs: HifzSessionAyah[];
  reciterId?: string;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(false);

  const start = ayahs[0]?.number ?? 1;
  const end = ayahs[ayahs.length - 1]?.number ?? start;
  const ayah = ayahs[index];
  const isLast = index === ayahs.length - 1;

  const audio = useAyahAudio({
    surahId,
    ayahStart: start,
    ayahEnd: end,
    reciterId,
    stepMode: true, // stop after each ayah so the learner can echo it
    onAyahComplete: () => setHeard(true),
  });

  const playAyahRef = useRef(audio.playAyah);
  playAyahRef.current = audio.playAyah;

  const playCurrent = useCallback(() => {
    if (!ayah) return;
    setHeard(false);
    void playAyahRef.current(ayah.number);
  }, [ayah?.number]);

  // Autoplay each ayah exactly once.
  const autoplayedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!audio.ready || !ayah) return;
    if (autoplayedRef.current === ayah.number) return;
    autoplayedRef.current = ayah.number;
    playCurrent();
  }, [audio.ready, ayah?.number, playCurrent]);

  const advance = () => {
    haptics.medium();
    void audio.stop();
    if (isLast) {
      onDone();
      return;
    }
    setHeard(false);
    setIndex(index + 1);
  };

  if (!ayah) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* title (J6) */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Now say it back</Text>
          <Text style={s.sub}>
            Nothing is recorded here — just recite along until it feels natural.
          </Text>
        </View>

        {/* ayah card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>
            AYAH {ayah.number} OF {end}
          </Text>
          <Text style={s.arabic}>{ayah.text}</Text>
          {!!ayah.translation && (
            <Text style={s.translation}>“{ayah.translation}”</Text>
          )}
        </View>

        {/* replay circle */}
        <View style={s.circleWrap}>
          <View style={s.circleHolder}>
            <PulseRing size={96} color={hz.sky} active={audio.isPlaying} />
            <Pressable onPress={playCurrent} style={s.circle}>
              <SoundWave />
            </Pressable>
          </View>
          <Text
            style={[s.circleCaption, !!audio.error && { color: hz.rose }]}
          >
            {audio.error
              ? "AUDIO UNAVAILABLE"
              : audio.isLoading
                ? "LOADING…"
                : audio.isPlaying
                  ? "PLAYING…"
                  : "TAP TO HEAR IT AGAIN"}
          </Text>
          {!!audio.error && <Text style={s.errorHint}>{audio.error}</Text>}
        </View>

        {/* per-ayah dots (J6): done teal · current sky · todo dim */}
        <View style={s.dots}>
          {ayahs.map((a, i) => (
            <View
              key={a.number}
              style={[
                s.dot,
                {
                  backgroundColor:
                    i < index ? hz.teal : i === index ? hz.sky : hz.track,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* bottom buttons (J6): AGAIN + NEXT AYAH */}
      <View style={s.footer}>
        <OutlineButton
          label="AGAIN"
          onPress={playCurrent}
          style={{ flex: 1 }}
          size="lg"
        />
        <SolidButton
          label={isLast ? "FINISH" : "NEXT AYAH"}
          onPress={advance}
          disabled={!heard && audio.isBusy}
          color={hz.sky}
          shadowColor={hz.skyShadow}
          textColor={hz.onSky}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  titleBlock: { alignItems: "center", paddingTop: 12, paddingHorizontal: 10 },
  title: { fontFamily: "Nunito_900Black", fontSize: 20, color: hz.text },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13.5,
    lineHeight: 21.5,
    color: hz.muted,
    textAlign: "center",
    marginTop: 6,
  },

  card: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 24,
  },
  cardLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: hz.faint,
  },
  arabic: {
    fontFamily: AYAH_FONT,
    fontSize: 34,
    lineHeight: 68,
    color: hz.text,
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 12,
  },
  translation: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: hz.muted,
    textAlign: "center",
    marginTop: 8,
  },

  circleWrap: { alignItems: "center", gap: 14, marginTop: 30 },
  circleHolder: { alignItems: "center", justifyContent: "center" },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: hz.skyTint,
    borderWidth: 3,
    borderColor: hz.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  circleCaption: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    letterSpacing: 1.2,
    color: hz.skyBright,
  },

  errorHint: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    lineHeight: 17,
    color: hz.muted,
    textAlign: "center",
    paddingHorizontal: 30,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 26,
    paddingBottom: 12,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },

  footer: { flexDirection: "row", gap: 10, paddingTop: 8 },
});
