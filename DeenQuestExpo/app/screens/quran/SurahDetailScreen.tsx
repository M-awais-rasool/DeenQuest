import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, ChevronDown, ChevronUp, Languages } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  QuranAyah,
  useGetSurahAudioQuery,
  useGetSurahByIdQuery,
} from "../../store/services/api";
import { AudioPlayer } from "../../components/quran/AudioPlayer";
import { haptics } from "../../utils/haptics";
import { toArabicNumber } from "../../utils/arabicNumbers";
import { useQuranFont } from "../../hooks/useQuranFont";

type Props = NativeStackScreenProps<AppStackParamList, "SurahDetail">;

const TRANSLATION_EDITION = "en.asad";

const BASMALAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const AYAH_MARKER_PREFIX = "\u06DD";

export const SurahDetailScreen = ({ route, navigation }: Props) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [audioExpanded, setAudioExpanded] = useState(true);
  const { fontFamily } = useQuranFont();
  const surahId = Number(route.params.surahId);
  const isValidSurah = Number.isInteger(surahId) && surahId >= 1 && surahId <= 114;
  const queryArgs = useMemo(
    () => ({
      id: isValidSurah ? surahId : 1,
      translation: showTranslation ? TRANSLATION_EDITION : undefined,
    }),
    [isValidSurah, showTranslation, surahId],
  );

  const { data, isLoading, isFetching } = useGetSurahByIdQuery(queryArgs, {
    skip: !isValidSurah,
  });
  const { data: audioData, isLoading: audioLoading } =
    useGetSurahAudioQuery(isValidSurah ? surahId : 1, { skip: !isValidSurah });

  const surah = data?.data;
  const rawAyahs = surah?.ayahs ?? [];

  const { ayahs, showBasmalah } = useMemo(() => {
    if (rawAyahs.length === 0) return { ayahs: [], showBasmalah: false };
    const hasBasmalah =
      surahId !== 1 && surahId !== 9 && rawAyahs[0].text.startsWith(BASMALAH);
    if (!hasBasmalah) return { ayahs: rawAyahs, showBasmalah: false };
    return {
      ayahs: rawAyahs.map((ayah, i) =>
        i === 0 ? { ...ayah, text: ayah.text.replace(BASMALAH, "").trim() } : ayah,
      ),
      showBasmalah: true,
    };
  }, [rawAyahs, surahId]);

  const toggleAudio = useCallback(() => {
    haptics.light();
    setAudioExpanded((v) => !v);
  }, []);
  const renderAyah = useCallback(({ item }: { item: QuranAyah }) => (
    <View>
      <View style={s.ayahBlock}>
        <Text style={s.ayahText}>
          <Text style={[s.ayahTextContent, fontFamily ? { fontFamily } : undefined]}>{item.text}</Text>
          <Text style={s.ayahMarker}>
            {" "}{AYAH_MARKER_PREFIX}{toArabicNumber(item.number_in_surah)}
          </Text>
        </Text>
      </View>
      {showTranslation && item.translation && (
        <View style={s.translationBlock}>
          <Text style={s.translationText}>{item.translation}</Text>
        </View>
      )}
    </View>
  ), [showTranslation, fontFamily]);

  if (!isValidSurah) {
    return (
      <ScreenWrapper>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.errorState}>
          <Text style={s.errorTitle}>Surah not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (isLoading && !surah) {
    return (
      <ScreenWrapper>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <Loader />
      </ScreenWrapper>
    );
  }

  const revelationLabel =
    surah?.revelation_type === "Meccan" || surah?.revelation_type === "meccan"
      ? "Meccan"
      : "Medinan";

  return (
    <ScreenWrapper>
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            navigation.goBack();
          }}
          style={s.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            setShowTranslation((value) => !value);
          }}
          style={[s.translateBtn, showTranslation && s.translateBtnActive]}
          activeOpacity={0.8}
        >
          <Languages
            size={18}
            color={
              showTranslation ? theme.colors.onPrimary : theme.colors.primary
            }
          />
          <Text
            style={[
              s.translateText,
              showTranslation && s.translateTextActive,
            ]}
          >
            Translation
          </Text>
        </TouchableOpacity>
      </View>

      {surah && (
        <FlatList
          data={ayahs}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderAyah}
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Surah Header */}
              <View style={s.surahHeader}>
                <Text style={[s.surahNameArabic, fontFamily ? { fontFamily } : undefined]}>{surah.name}</Text>
                <Text style={s.surahNameEnglish}>{surah.english_name}</Text>
                <Text style={s.surahMeta}>
                  {revelationLabel} · {surah.number_of_ayahs} verses
                </Text>
              </View>

              {/* Bismillah */}
              {showBasmalah && (
                <View style={s.bismillahContainer}>
                  <Text style={[s.bismillahText, fontFamily ? { fontFamily } : undefined]}>{BASMALAH}</Text>
                </View>
              )}

              {/* Audio Player Toggle */}
              <TouchableOpacity
                style={s.audioToggle}
                onPress={toggleAudio}
                activeOpacity={0.7}
              >
                <Text style={s.audioToggleText}>
                  {audioExpanded ? "Hide reciter" : "Show reciter"}
                </Text>
                {audioExpanded ? (
                  <ChevronUp size={16} color={theme.colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.colors.textMuted} />
                )}
              </TouchableOpacity>

              {audioExpanded && (
                <AudioPlayer
                  surah={surah}
                  audio={audioData?.data}
                  loadingAudio={audioLoading}
                />
              )}
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  topBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline25,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  translateBtn: {
    height: 42,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary12,
    borderWidth: 1,
    borderColor: theme.colors.primary25,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  translateBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  translateText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 12,
  },
  translateTextActive: {
    color: theme.colors.onPrimary,
  },
  list: {
    // flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  errorTitle: {
    color: theme.colors.error,
    fontSize: 18,
    fontWeight: "900",
  },

  /* Surah Header */
  surahHeader: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline25,
  },
  surahNameArabic: {
    fontSize: 32,
    lineHeight: 56,
    color: theme.colors.text,
    writingDirection: "rtl",
    textAlign: "center",
    marginBottom: 8,
  },
  surahNameEnglish: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
  surahMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.5,
  },

  /* Bismillah */
  bismillahContainer: {
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline10,
  },
  bismillahText: {
    fontSize: 32,
    lineHeight: 60,
    writingDirection: "rtl",
    textAlign: "center",
    color: theme.colors.text,
  },

  /* Audio Toggle */
  audioToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  audioToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Ayah Block */
  ayahBlock: {
    marginBottom: 4,
  },
  ayahText: {
    fontSize: 38,
    lineHeight: 82,
    writingDirection: "rtl",
    textAlign: "center",
    color: theme.colors.text,
  },
  ayahTextContent: {
    fontSize: 38,
    lineHeight: 82,
  },
  ayahMarker: {
    fontSize: 28,
    lineHeight: 82,
    color: theme.colors.textMuted,
  },

  /* Translation */
  translationBlock: {
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline10,
  },
  translationText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "500",
    fontStyle: "italic",
    textAlign: "center",
  },
});
