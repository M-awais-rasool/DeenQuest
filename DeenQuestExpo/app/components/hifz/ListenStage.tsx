import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react-native";
import { AnimatedPressable } from "../ui";
import { AYAH_FONT, DiamondBadge, OutlineButton, hz } from "./ui";
import { useAyahAudio } from "./useAyahAudio";
import type { HifzSessionAyah } from "../../store/services/api";

const RATES = [1, 0.75, 0.5] as const;

export function ListenStage({
  surahId,
  ayahs,
  repeats,
  reciterName,
  onDone,
}: {
  surahId: number;
  ayahs: HifzSessionAyah[];
  repeats: number;
  reciterName: string;
  onDone: () => void;
}) {
  const [passes, setPasses] = useState(0);

  const start = ayahs[0]?.number ?? 1;
  const end = ayahs[ayahs.length - 1]?.number ?? start;

  const audio = useAyahAudio({
    surahId,
    ayahStart: start,
    ayahEnd: end,
    onPassComplete: () => setPasses((n) => n + 1),
  });

  // Autoplay exactly once when audio becomes ready.
  const startedRef = useRef(false);
  const restartRef = useRef(audio.restart);
  restartRef.current = audio.restart;
  useEffect(() => {
    if (!audio.ready || startedRef.current) return;
    startedRef.current = true;
    restartRef.current();
  }, [audio.ready]);

  return (
    <View style={{ flex: 1 }}>
      {/* repeat dots (J5): "Repeat ●●○ 2 of 3" */}
      <View style={s.repeatRow}>
        <Text style={s.repeatLabel}>Repeat</Text>
        <View style={{ flexDirection: "row", gap: 5 }}>
          {Array.from({ length: repeats }).map((_, i) => (
            <View
              key={i}
              style={[
                s.repeatDot,
                { backgroundColor: i < passes ? hz.sky : hz.skyDim },
              ]}
            />
          ))}
        </View>
        <Text style={s.repeatCount}>
          {Math.min(passes, repeats)} of {repeats}
        </Text>
      </View>

      {/* ayah cards */}
      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={{ gap: 9, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {ayahs.map((ayah) => {
          const active = audio.currentAyah === ayah.number && audio.isBusy;
          return (
            <Pressable
              key={ayah.number}
              onPress={() => audio.playAyah(ayah.number)}
              style={[s.ayahCard, active && s.ayahCardActive]}
            >
              <View style={{ marginTop: 8 }}>
                <DiamondBadge number={ayah.number} active={active} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[s.ayahText, { color: active ? hz.text : hz.muted }]}
                >
                  {ayah.text}
                </Text>
                {active && (
                  <View style={s.playingRow}>
                    <View style={s.playingDot} />
                    <Text style={s.playingText}>PLAYING</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* player card (J5) */}
      <View style={s.player}>
        <View style={s.playerTop}>
          <Text style={s.reciter} numberOfLines={1}>
            {reciterName}
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {RATES.map((r) => {
              const active = audio.rate === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => audio.setPlaybackRate(r)}
                  style={[s.rateChip, active && s.rateChipActive]}
                >
                  <Text
                    style={[s.rateText, { color: active ? hz.skyBright : hz.faint }]}
                  >
                    {r === 1 ? "1×" : `${r}×`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={s.transport}>
          <AnimatedPressable
            onPress={audio.previous}
            disabled={!audio.canGoPrevious}
            style={!audio.canGoPrevious && { opacity: 0.45 }}
          >
            <SkipBack size={26} color={hz.faint} fill={hz.faint} />
          </AnimatedPressable>

          <Pressable onPress={audio.toggle} disabled={!audio.ready}>
            <View style={s.playEdge} />
            <View style={[s.playBtn, !audio.ready && { opacity: 0.5 }]}>
              {audio.isPlaying ? (
                <Pause size={24} color={hz.onSky} fill={hz.onSky} />
              ) : (
                <Play size={24} color={hz.onSky} fill={hz.onSky} />
              )}
            </View>
          </Pressable>

          <AnimatedPressable
            onPress={audio.next}
            disabled={!audio.canGoNext}
            style={!audio.canGoNext && { opacity: 0.45 }}
          >
            <SkipForward size={26} color={hz.muted} fill={hz.muted} />
          </AnimatedPressable>
        </View>
      </View>

      <OutlineButton
        label="I'VE HEARD IT — NEXT"
        onPress={() => {
          void audio.stop();
          onDone();
        }}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  repeatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 6,
  },
  repeatLabel: { fontFamily: "Nunito_800ExtraBold", fontSize: 11.5, color: hz.muted },
  repeatDot: { width: 9, height: 9, borderRadius: 5 },
  repeatCount: { fontFamily: "Nunito_800ExtraBold", fontSize: 11.5, color: hz.faint },

  ayahCard: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ayahCardActive: {
    backgroundColor: hz.skyTint,
    borderWidth: 2,
    borderColor: hz.sky,
    shadowColor: hz.sky,
    shadowOpacity: 0.16,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  ayahText: {
    fontFamily: AYAH_FONT,
    fontSize: 25,
    lineHeight: 50,
    textAlign: "right",
    writingDirection: "rtl",
  },
  playingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  playingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: hz.sky },
  playingText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1,
    color: hz.sky,
  },

  player: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.skyEdge,
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  playerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reciter: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    color: hz.muted,
    flexShrink: 1,
  },
  rateChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  rateChipActive: {
    backgroundColor: hz.skyTint,
    borderWidth: 1,
    borderColor: hz.sky,
  },
  rateText: { fontFamily: "Nunito_900Black", fontSize: 11 },

  transport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    marginTop: 14,
  },
  playEdge: {
    position: "absolute",
    top: 5,
    left: 0,
    right: 0,
    bottom: -5,
    borderRadius: 30,
    backgroundColor: hz.skyShadow,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: hz.sky,
    alignItems: "center",
    justifyContent: "center",
  },
});
