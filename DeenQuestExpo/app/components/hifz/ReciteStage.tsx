import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { ProgressRing } from "./ProgressRing";
import {
  AYAH_FONT,
  DiamondBadge,
  OutlineButton,
  PulseRing,
  SolidButton,
  hz,
} from "./ui";
import { haptics } from "../../utils/haptics";
import { useHifzRecorder } from "./useHifzRecorder";
import type {
  HifzSessionAyah,
  HifzStage,
  HifzWordResult,
} from "../../store/services/api";

function MicIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={2.2} />
      <Path
        d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Waveform({ bright, dim }: { bright: string; dim: string }) {
  const bars = [12, 24, 34, 19, 28, 14, 22, 9];
  return (
    <View style={s.waveRow}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: h,
            borderRadius: 2,
            backgroundColor: i < 5 ? bright : dim,
          }}
        />
      ))}
    </View>
  );
}

function firstLetters(text: string): string[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => Array.from(w)[0] ?? "");
}

export function ReciteStage({
  sessionId,
  ayahs,
  blind,
  passScore,
  onResultView,
  onDone,
}: {
  sessionId: string;
  ayahs: HifzSessionAyah[];
  blind: boolean;
  passScore: number;
  onResultView?: (showing: boolean, ayahNumber?: number) => void;
  onDone: (nextStage: HifzStage) => void;
}) {
  const [index, setIndex] = useState(0);
  const [peeking, setPeeking] = useState(false);

  const recorder = useHifzRecorder(sessionId);
  const ayah = ayahs[index];
  const isLast = index === ayahs.length - 1;
  const result = recorder.result;

  const accent = blind ? hz.gold : hz.teal;
  const accentTint = blind ? hz.goldTint : hz.tealTint;
  const accentBright = blind ? hz.goldBright : hz.tealBright;

  useEffect(() => {
    onResultView?.(recorder.hasResult, ayah?.number);
  }, [recorder.hasResult]);

  const advancingRef = useRef(false);
  useEffect(() => {
    advancingRef.current = false;
  }, [index]);

  const advance = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    if (isLast) {
      onDone(result?.next_stage ?? "sealed");
      return;
    }
    recorder.reset();
    setPeeking(false);
    setIndex(index + 1);
  };

  if (!ayah) return null;

  if (recorder.hasResult && result) {
    return (
      <ReciteResult
        result={result}
        passScore={passScore}
        isLast={isLast}
        onRetry={() => recorder.reset()}
        onOverride={advance}
        onNext={advance}
      />
    );
  }

  const maxLen = Math.max(...ayahs.map((a) => a.text.length), 1);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {blind ? (
          <>
            {/* J13 headline */}
            <View style={s.titleBlock}>
              <Text style={s.title}>No text. Just you.</Text>
              <Text style={s.sub}>
                Recite all {ayahs.length} ayah{ayahs.length === 1 ? "" : "s"} of
                the portion from memory.
              </Text>
            </View>

            {/* skeleton card */}
            <View style={s.blindCard}>
              <View style={{ gap: 12 }}>
                {ayahs.map((a, i) => (
                  <View key={a.number} style={s.blindRow}>
                    <DiamondBadge number={a.number} size={24} dim />
                    <View
                      style={[
                        s.blindBar,
                        {
                          width: `${Math.round(40 + (a.text.length / maxLen) * 58)}%`,
                          backgroundColor: i === index ? hz.goldWell : hz.card,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>

              {peeking && (
                <>
                  <View style={s.blindLetters}>
                    {firstLetters(ayah.text).map((letter, i) => (
                      <View key={i} style={s.letterChip}>
                        <Text style={s.letterText}>{letter}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={s.peekNote}>First letters · ayah {ayah.number}</Text>
                </>
              )}
            </View>
          </>
        ) : (
          /* J7: the ayah to recite, mushaf open */
          <View style={s.openCard}>
            <Text style={s.openLabel}>AYAH {ayah.number} · RECITE THIS</Text>
            <Text style={s.openArabic}>{ayah.text}</Text>
          </View>
        )}

        {/* mic centre */}
        <View style={s.micArea}>
          <View style={s.micHolder}>
            <PulseRing
              size={blind ? 148 : 168}
              color={accent}
              active={recorder.isRecording || !recorder.isProcessing}
            />
            <Pressable
              disabled={recorder.isProcessing}
              onPress={() => {
                haptics.medium();
                if (recorder.isRecording) {
                  void recorder.stopAndSubmit(ayah.number, isLast);
                } else {
                  void recorder.start();
                }
              }}
              style={[
                s.micBtn,
                blind ? s.micBtnBlind : s.micBtnOpen,
                recorder.isProcessing && { opacity: 0.6 },
              ]}
            >
              {recorder.isProcessing ? (
                <Text style={[s.micDots, { color: accentBright }]}>•••</Text>
              ) : (
                <MicIcon
                  size={blind ? 40 : 46}
                  color={blind ? hz.goldBright : hz.onTeal}
                />
              )}
            </Pressable>
          </View>

          {recorder.isRecording && (
            <Text style={s.timer}>
              {Math.floor(recorder.elapsed / 60)}:
              {String(recorder.elapsed % 60).padStart(2, "0")}
            </Text>
          )}
          <Text style={[s.micCaption, { color: blind ? hz.gold : hz.tealBright }]}>
            {recorder.isProcessing
              ? "CHECKING…"
              : recorder.isRecording
                ? "LISTENING…"
                : blind
                  ? "TAP TO START RECITING"
                  : "TAP AND RECITE THIS AYAH"}
          </Text>
          {recorder.isRecording && (
            <Waveform
              bright={blind ? hz.gold : hz.teal}
              dim={blind ? hz.goldEdge : hz.tealEdge}
            />
          )}
        </View>
      </ScrollView>

      {/* bottom (J7/J13) */}
      <View style={{ gap: 10, paddingTop: 8 }}>
        {recorder.isRecording ? (
          <SolidButton
            label="STOP & CHECK"
            onPress={() => void recorder.stopAndSubmit(ayah.number, isLast)}
            color={hz.rose}
            shadowColor={hz.roseShadow}
            textColor={hz.onRose}
          />
        ) : blind ? (
          <OutlineButton
            label={peeking ? "HIDE FIRST LETTERS" : "SHOW FIRST LETTERS"}
            onPress={() => setPeeking((p) => !p)}
            color={hz.gold}
            borderColor={hz.goldEdge}
          />
        ) : null}
        <Text style={s.footCaption}>
          Ayah {index + 1} of {ayahs.length} in this portion
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// J8 — per-ayah result
// ─────────────────────────────────────────────

function ReciteResult({
  result,
  passScore,
  isLast,
  onRetry,
  onOverride,
  onNext,
}: {
  result: NonNullable<ReturnType<typeof useHifzRecorder>["result"]>;
  passScore: number;
  isLast: boolean;
  onRetry: () => void;
  onOverride: () => void;
  onNext: () => void;
}) {
  const words = result.words ?? [];
  const inAyah = words.filter((w) => w.status !== "extra");
  const extras = words.filter((w) => w.status === "extra");
  const correct = inAyah.filter((w) => w.status === "correct").length;
  const dropped = inAyah.filter((w) => w.status === "missing").length;

  const passed = result.passed;
  const ringColor = passed ? hz.teal : hz.gold;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* score card */}
        <View style={s.resultCard}>
          <ProgressRing
            pct={result.score}
            size={86}
            stroke={9}
            from={ringColor}
            to={ringColor}
            track={hz.screen}
          >
            <Text style={s.resultPct}>{result.score}%</Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text style={[s.resultTitle, { color: passed ? hz.tealBright : hz.gold }]}>
              {passed ? "That counts" : "Almost there"}
            </Text>
            <Text style={s.resultSub}>
              {correct} of {inAyah.length} words matched.
              {dropped > 0
                ? ` ${dropped === 1 ? "One word was" : `${dropped} words were`} dropped.`
                : ""}
            </Text>
          </View>
        </View>

        {/* legend */}
        <View style={s.legend}>
          <LegendItem color={hz.teal} label="correct" />
          <LegendItem color={hz.rose} label="wrong" />
          <LegendItem dashed label="missing" />
        </View>

        {/* word chips */}
        <View style={s.wordsCard}>
          <View style={s.wordFlow}>
            {inAyah.map((word, i) => (
              <WordChip key={`${word.text}-${i}`} word={word} />
            ))}
          </View>
          {extras.length > 0 && (
            <View style={s.mistakeNote}>
              <View style={s.mistakeIcon}>
                <Text style={s.mistakeGlyph}>!</Text>
              </View>
              <Text style={s.mistakeText}>
                Also heard:{" "}
                <Text style={s.mistakeArabic}>
                  {extras.map((w) => w.text).join("، ")}
                </Text>{" "}
                — not part of this ayah.
              </Text>
            </View>
          )}
        </View>

        {/* coach tip (sky card) */}
        {!!(result.explanation || result.tip) && (
          <View style={s.tipCard}>
            <Text style={s.tipStar}>✦</Text>
            <Text style={s.tipText}>{result.explanation || result.tip}</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ gap: 10, paddingTop: 8 }}>
        {passed ? (
          <>
            <SolidButton
              label={isLast ? "FINISH STAGE" : "NEXT AYAH"}
              onPress={onNext}
            />
            <OutlineButton label="TRY THIS AYAH AGAIN" onPress={onRetry} size="md" />
          </>
        ) : (
          <>
            <SolidButton label="TRY THIS AYAH AGAIN" onPress={onRetry} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <OutlineButton
                label="I RECITED IT CORRECTLY"
                onPress={onOverride}
                size="sm"
                style={{ flex: 1 }}
              />
              <OutlineButton
                label={isLast ? "FINISH ANYWAY" : "NEXT AYAH →"}
                onPress={onNext}
                size="sm"
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function LegendItem({
  color,
  dashed,
  label,
}: {
  color?: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <View style={s.legendItem}>
      <View
        style={[
          s.legendSwatch,
          dashed
            ? { borderWidth: 1.5, borderStyle: "dashed", borderColor: hz.faint }
            : { backgroundColor: color },
        ]}
      />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

function WordChip({ word }: { word: HifzWordResult }) {
  const conf =
    word.status === "correct"
      ? { color: hz.tealBright, bg: hz.tealTint, border: hz.tealEdge, dashed: false }
      : word.status === "wrong"
        ? { color: hz.rose, bg: hz.roseTint, border: hz.roseEdge, dashed: false }
        : { color: hz.faint, bg: "transparent", border: hz.wellDash, dashed: true };
  return (
    <View
      style={[
        s.wordChip,
        {
          backgroundColor: conf.bg,
          borderColor: conf.border,
          borderStyle: conf.dashed ? "dashed" : "solid",
          borderWidth: conf.dashed ? 1.5 : 1,
        },
      ]}
    >
      <Text style={[s.wordText, { color: conf.color }]}>{word.text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  titleBlock: { alignItems: "center", paddingTop: 12, paddingHorizontal: 10 },
  title: { fontFamily: "Nunito_900Black", fontSize: 21, color: hz.text },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13.5,
    lineHeight: 21.5,
    color: hz.muted,
    textAlign: "center",
    marginTop: 6,
  },

  openCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginTop: 6,
  },
  openLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: hz.faint,
    textAlign: "center",
  },
  openArabic: {
    fontFamily: AYAH_FONT,
    fontSize: 30,
    lineHeight: 63,
    color: hz.text,
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 10,
  },

  blindCard: {
    backgroundColor: hz.well,
    borderWidth: 1.5,
    borderColor: hz.wellDash,
    borderStyle: "dashed",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginTop: 22,
  },
  blindRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  blindBar: { height: 14, borderRadius: 7 },
  blindLetters: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: hz.rowBorder,
  },
  letterChip: {
    backgroundColor: hz.goldWell,
    borderWidth: 1,
    borderColor: hz.goldEdge,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  letterText: { fontFamily: AYAH_FONT, fontSize: 22, lineHeight: 34, color: hz.gold },
  peekNote: {
    fontFamily: "Nunito_700Bold",
    fontSize: 10.5,
    color: hz.faint,
    textAlign: "center",
    marginTop: 10,
  },

  micArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 22 },
  micHolder: { alignItems: "center", justifyContent: "center" },
  micBtn: { alignItems: "center", justifyContent: "center" },
  micBtnOpen: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: hz.teal,
    shadowColor: hz.teal,
    shadowOpacity: 0.4,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  micBtnBlind: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: hz.goldTint,
    borderWidth: 3,
    borderColor: hz.gold,
    shadowColor: hz.gold,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  micDots: { fontFamily: "Nunito_900Black", fontSize: 22 },
  timer: { fontFamily: "Nunito_900Black", fontSize: 26, color: hz.text },
  micCaption: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1.4,
  },
  waveRow: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 34 },

  footCaption: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: hz.faint,
    textAlign: "center",
  },

  // result (J8)
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  resultPct: { fontFamily: "Nunito_900Black", fontSize: 22, color: hz.text },
  resultTitle: { fontFamily: "Nunito_900Black", fontSize: 17 },
  resultSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 19,
    color: hz.muted,
    marginTop: 4,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 14,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: "Nunito_700Bold", fontSize: 11, color: hz.muted },

  wordsCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  wordFlow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 9,
  },
  wordChip: { borderRadius: 12, paddingVertical: 7, paddingHorizontal: 14 },
  wordText: { fontFamily: AYAH_FONT, fontSize: 27, lineHeight: 44 },

  mistakeNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: hz.rowBorder,
  },
  mistakeIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: hz.roseTint,
    alignItems: "center",
    justifyContent: "center",
  },
  mistakeGlyph: { fontFamily: "Nunito_900Black", fontSize: 12, color: hz.rose },
  mistakeText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 19,
    color: hz.muted,
  },
  mistakeArabic: { fontFamily: AYAH_FONT, fontSize: 15, color: hz.rose },

  tipCard: {
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
  tipStar: { fontSize: 15, color: hz.sky },
  tipText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 19.5,
    color: hz.skyBright,
  },
});
