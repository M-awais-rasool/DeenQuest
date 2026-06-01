import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, Languages } from "lucide-react-native";
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

type Props = NativeStackScreenProps<AppStackParamList, "SurahDetail">;

const TRANSLATION_EDITION = "en.asad";

export const SurahDetailScreen = ({ route, navigation }: Props) => {
  const [showTranslation, setShowTranslation] = useState(false);
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
  const ayahs = surah?.ayahs ?? [];

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

  const renderAyah = ({ item }: { item: QuranAyah }) => (
    <View style={s.ayahRow}>
      <View style={s.ayahNumber}>
        <Text style={s.ayahNumberText}>{item.number_in_surah}</Text>
      </View>
      <Text style={s.ayahText}>{item.text}</Text>
      {item.translation ? (
        <Text style={s.translationText}>{item.translation}</Text>
      ) : null}
    </View>
  );

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

      <FlatList
        data={ayahs}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderAyah}
        refreshing={isFetching}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          surah ? (
            <View>
              <View style={s.hero}>
                <Text style={s.surahNumber}>Surah {surah.number}</Text>
                <Text style={s.title}>{surah.english_name}</Text>
                <Text style={s.arabicTitle}>{surah.name}</Text>
                <Text style={s.subtitle}>
                  {surah.english_name_translation} • {surah.number_of_ayahs} ayahs •{" "}
                  {surah.revelation_type}
                </Text>
              </View>
              <AudioPlayer
                surah={surah}
                audio={audioData?.data}
                loadingAudio={audioLoading}
              />
            </View>
          ) : null
        }
      />
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
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  hero: {
    paddingBottom: theme.spacing.md,
  },
  surahNumber: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  arabicTitle: {
    color: theme.colors.secondary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
    writingDirection: "rtl",
    textAlign: "left",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  ayahRow: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    padding: 16,
    marginBottom: 12,
  },
  ayahNumber: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  ayahNumberText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  ayahText: {
    color: theme.colors.text,
    fontSize: 27,
    lineHeight: 48,
    writingDirection: "rtl",
    textAlign: "right",
    fontWeight: "500",
  },
  translationText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: 14,
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
});
