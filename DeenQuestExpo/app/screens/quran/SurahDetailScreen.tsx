import React, { useEffect, useMemo } from "react";
import TrackPlayer from "react-native-track-player";
import {
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
  useGetSurahAudioQuery,
  useGetSurahByIdQuery,
} from "../../store/services/api";
import { SyncedSurahReader } from "../../components/quran/SyncedSurahReader";
import { BASMALAH } from "../../components/quran/constants";
import { haptics } from "../../utils/haptics";
import { useQuranFont } from "../../hooks/useQuranFont";

type Props = NativeStackScreenProps<AppStackParamList, "SurahDetail">;

const TRANSLATION_EDITION = "en.asad";

export const SurahDetailScreen = ({ route, navigation }: Props) => {
  const [showTranslation, setShowTranslation] = React.useState(false);
  const { fontFamily } = useQuranFont();
  const surahId = Number(route.params.surahId);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      TrackPlayer.reset();
    });
    return unsubscribe;
  }, [navigation]);
  const isValidSurah = Number.isInteger(surahId) && surahId >= 1 && surahId <= 114;
  const queryArgs = useMemo(
    () => ({
      id: isValidSurah ? surahId : 1,
      translation: showTranslation ? TRANSLATION_EDITION : undefined,
    }),
    [isValidSurah, showTranslation, surahId],
  );

  const { data, isLoading } = useGetSurahByIdQuery(queryArgs, {
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
    <ScreenWrapper style={{ position: "relative" }} innerStyle={{ flex: 1 }}>
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
        <SyncedSurahReader
          surah={surah}
          ayahs={ayahs}
          syncAyahs={rawAyahs}
          audio={audioData?.data}
          loadingAudio={audioLoading}
          showBasmalah={showBasmalah}
          showTranslation={showTranslation}
          fontFamily={fontFamily}
          revelationLabel={revelationLabel}
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
